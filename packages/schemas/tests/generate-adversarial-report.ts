import { readFileSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..", "..", "..");
const jsonPath = path.resolve(rootDir, "adversarial-results.json");

const CATEGORY_MAP: Record<string, string> = {
  inyección: "Injection",
  "fuerza bruta": "Authentication",
  "inputs maliciosos": "Input Validation",
  manipulación: "Data Integrity",
  "abuso de paginación": "Rate Limiting / DoS",
  "abuso de filtros": "Rate Limiting / DoS",
  fraude: "Financial Integrity",
  anulación: "Business Logic",
  integridad: "Data Integrity",
  escalación: "Authorization",
  "prototype pollution": "Prototype Pollution",
  "type coercion": "Type Safety",
  "órdenes malformadas": "Input Validation",
  "transiciones inválidas": "Business Logic",
  evasión: "Authentication",
  "manipulación de asignación": "Authorization",
  "manipulación de datos": "Data Integrity",
  "manipulación de precios": "Financial Integrity",
  "anulación fraudulenta": "Financial Integrity",
};

function classifyCategory(ancestors: string[]): string {
  const full = ancestors.join(" ").toLowerCase();
  for (const [keyword, cat] of Object.entries(CATEGORY_MAP)) {
    if (full.includes(keyword)) return cat;
  }
  return "General";
}

function classifySeverity(testName: string): string {
  const lower = testName.toLowerCase();
  if (lower.includes("brecha") || lower.includes("posible brecha")) return "⚠️  MEDIO";
  if (lower.includes("sql") || lower.includes("xss")) return "🔴 ALTO";
  if (lower.includes("prototype") || lower.includes("escalación")) return "🔴 ALTO";
  if (lower.includes("crashear") || lower.includes("crash")) return "🔴 ALTO";
  return "🟡 BAJO";
}

function getRecommendation(testName: string): string {
  const lower = testName.toLowerCase();
  if (lower.includes("no valida formato de dni"))
    return "Agregar `z.string().regex(/^\\d{8}$/)` para validar DNI de 8 dígitos.";
  if (lower.includes("no valida formato de ruc"))
    return "Agregar `z.string().regex(/^\\d{11}$/)` para validar RUC de 11 dígitos.";
  if (lower.includes("no valida que precio_referencial sea numérico"))
    return "Cambiar `precio_referencial` a `z.coerce.number().positive()` o agregar `.regex(/^\\d+(\\.\\d{1,2})?$/)`.";
  if (lower.includes("no valida precios negativos en string"))
    return "Validar que el string de precio no empiece con '-' o usar `z.coerce.number().nonnegative()`.";
  if (lower.includes("no limita la cantidad máxima"))
    return "Agregar `.max(10000)` al campo cantidad para prevenir overflow en cálculos.";
  if (lower.includes("no limita el precio unitario máximo"))
    return "Agregar `.max(999999.99)` al campo `precio_unitario` para prevenir valores absurdos.";
  if (lower.includes("no limita el monto máximo"))
    return "Agregar `.max(999999.99)` al campo `monto` en `createPaymentSchema`.";
  if (lower.includes("no valida precisión decimal"))
    return "Redondear a 2 decimales en el servicio antes de persistir: `Math.round(monto * 100) / 100`.";
  if (lower.includes("xss"))
    return "Asegurar que el frontend sanitice al renderizar (React escapa por defecto, react-pdf no).";
  if (lower.includes("sql"))
    return "Drizzle ORM usa queries parametrizadas — seguro a nivel DB. Verificar que no haya raw queries.";
  if (lower.includes("prototype"))
    return "Zod strip mode activo por defecto — verificar que no se use `.passthrough()` en ningún schema.";
  if (lower.includes("nan") || lower.includes("infinity"))
    return "Agregar `.finite()` o `.int()` a los campos de ID numérico para rechazar NaN/Infinity.";
  if (lower.includes("transición"))
    return "Implementar validación de transiciones de estado en el servicio (máquina de estados).";
  return "Revisar el caso y ajustar la validación según la lógica de negocio.";
}

interface VitestResult {
  testResults: Array<{
    assertionResults: Array<{
      fullName: string;
      ancestorTitles: string[];
      title: string;
      status: "passed" | "failed" | "skipped";
      duration: number;
      failureMessages?: string[];
    }>;
  }>;
}

const raw = readFileSync(jsonPath, "utf-8");
const data: VitestResult = JSON.parse(raw);

interface Finding {
  test: string;
  suite: string;
  status: "PASS" | "FAIL" | "SKIP";
  duration: number;
  error?: string;
  category: string;
  severity: string;
  recommendation: string;
}

const findings: Finding[] = [];

for (const file of data.testResults) {
  for (const t of file.assertionResults) {
    const status: Finding["status"] =
      t.status === "passed" ? "PASS" : t.status === "failed" ? "FAIL" : "SKIP";
    const suite = t.ancestorTitles.join(" > ");

    findings.push({
      test: t.title,
      suite,
      status,
      duration: t.duration ?? 0,
      error: t.failureMessages?.[0]?.slice(0, 300),
      category: classifyCategory(t.ancestorTitles),
      severity: status === "FAIL" ? classifySeverity(t.title) : "—",
      recommendation: status === "FAIL" ? getRecommendation(t.title) : "",
    });
  }
}

const passed = findings.filter((f) => f.status === "PASS");
const failed = findings.filter((f) => f.status === "FAIL");
const brechas = findings.filter(
  (f) =>
    f.test.toLowerCase().includes("posible brecha") ||
    f.test.toLowerCase().includes("no valida") ||
    f.test.toLowerCase().includes("no limita"),
);

const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const reportPath = path.resolve(rootDir, `adversarial-report-${timestamp}.md`);

let md = `# 🛡️ Reporte de Tests Adversariales\n\n`;
md += `**Fecha:** ${new Date().toLocaleString("es-PE")}\n`;
md += `**Total de tests:** ${findings.length}\n`;
md += `**Pasaron:** ✅ ${passed.length}\n`;
md += `**Fallaron:** ❌ ${failed.length}\n`;
md += `**Brechas documentadas:** ⚠️  ${brechas.length}\n\n`;
md += `---\n\n`;

// Summary by category
md += `## Resumen por Categoría\n\n`;
md += `| Categoría | Total | ✅ Pass | ❌ Fail |\n`;
md += `|-----------|------:|--------:|--------:|\n`;

const byCategory = new Map<string, { pass: number; fail: number }>();
for (const f of findings) {
  const entry = byCategory.get(f.category) ?? { pass: 0, fail: 0 };
  if (f.status === "PASS") entry.pass++;
  else if (f.status === "FAIL") entry.fail++;
  byCategory.set(f.category, entry);
}
for (const [cat, counts] of byCategory) {
  md += `| ${cat} | ${counts.pass + counts.fail} | ${counts.pass} | ${counts.fail} |\n`;
}
md += `\n---\n\n`;

// Failures
if (failed.length > 0) {
  md += `## ❌ Tests Fallidos\n\n`;
  md += `Estos tests fallaron, indicando que el schema **rechaza correctamente** inputs adversariales, o que hay un bug que requiere atención.\n\n`;
  for (const f of failed) {
    md += `### ${f.test}\n\n`;
    md += `- **Suite:** ${f.suite}\n`;
    md += `- **Categoría:** ${f.category}\n`;
    md += `- **Severidad:** ${f.severity}\n`;
    md += `- **Error:** \`${f.error ?? "N/A"}\`\n`;
    md += `- **Recomendación:** ${f.recommendation}\n\n`;
  }
  md += `---\n\n`;
}

// Brechas
if (brechas.length > 0) {
  md += `## ⚠️  Brechas Documentadas\n\n`;
  md += `Estos tests **pasan intencionalmente** para documentar que el schema no valida ciertos casos que podrían ser problemáticos en producción. No son bugs — son debilidades conocidas que deberían evaluarse.\n\n`;
  for (const f of brechas) {
    md += `### ${f.test}\n\n`;
    md += `- **Suite:** ${f.suite}\n`;
    md += `- **Categoría:** ${f.category}\n`;
    md += `- **Qué ocurre:** El schema acepta este input sin validación adicional.\n`;
    md += `- **Riesgo:** ${classifySeverity(f.test)}\n`;
    md += `- **Recomendación:** ${getRecommendation(f.test)}\n\n`;
  }
  md += `---\n\n`;
}

// Full detail
md += `## 📋 Detalle Completo\n\n`;
md += `| Estado | Test | Categoría | Duración |\n`;
md += `|--------|------|-----------|----------|\n`;
for (const f of findings) {
  const icon = f.status === "PASS" ? "✅" : f.status === "FAIL" ? "❌" : "⏭️";
  md += `| ${icon} | ${f.test.slice(0, 80)} | ${f.category} | ${f.duration}ms |\n`;
}
md += `\n---\n\n`;
md += `*Reporte generado automáticamente por la suite de tests adversariales.*\n`;

writeFileSync(reportPath, md, "utf-8");
console.log(`\n📄 Reporte generado: ${reportPath}\n`);
