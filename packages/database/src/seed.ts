import { getDb } from "./db.js";
import {
  branchTable,
  usersTable,
  clientTable,
  catalogTable,
} from "./schema/index.js";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import "dotenv/config";

const db = getDb();
async function seed() {
  console.log("🌱 Iniciando seed...");

  // 1. Sucursal principal
  console.log("📍 Creando sucursal...");
  const [sucursal] = await db
    .insert(branchTable)
    //Local de testing, que será reemplazado por la unica sucursal que existe actualmente
    .values({
      nombre: "Central-PC Bocanegra",
      serie: "B001",
      RUC: String(process.env.RUC),
      isActive: true,
      ultimo_correlativo: 0,
    })
    .returning();
  console.log("✅ Sucursal creada:", sucursal.id);

  // 2. Usuarios
  console.log("👤 Creando usuarios...");
  const passwordHash = await bcrypt.hash("centralpc123", 10);

  const usuarios = await db
    .insert(usersTable)
    //usuarios de Testing
    .values([
      {
        nombre: "Hugo Santos",
        user_name: "admin",
        password_hash: passwordHash,
        rol: "admin",
        isActive: true,
      },
      {
        nombre: "Josue",
        user_name: "tecnico",
        password_hash: passwordHash,
        rol: "tecnico",
        isActive: true,
      },
      {
        nombre: "Juan Carlos",
        user_name: "cajero",
        password_hash: passwordHash,
        rol: "cajero",
        isActive: true,
      },
      {
        nombre: "Alvaro Palomino",
        user_name: "cajero1",
        password_hash: passwordHash,
        rol: "cajero",
        isActive: true,
      },
    ])
    .returning();
  console.log(
    "✅ Usuarios creados:",
    usuarios.map((u) => u.user_name).join(", "),
  );

  // 3. Clientes
  console.log("👥 Creando clientes...");
  const clientes = await db
    .insert(clientTable)
    //estos clientes son para testing de la db
    .values([
      {
        nombre: "Fantasmín Fantasmon",
        telefono: "906969670",
        dni: "12345678",
        ruc: null,
      },
    ])
    .returning();
  console.log("✅ Clientes creados:", clientes.length);

  // 4. Catálogo (servicios, productos, combos)
  console.log("📦 Creando catálogo...");
  const catalogo = await db
    .insert(catalogTable)
    .values([
      // --- PC Y SOPORTE GENERAL ---
      {
        nombre: "Diagnóstico de PC",
        precio_ref: "25.00",
        tipo_item: "servicio",
        isActive: true,
      },
      {
        nombre: "Mantenimiento y limpieza interna de PC",
        precio_ref: "75.00",
        tipo_item: "servicio",
        isActive: true,
      },
      {
        nombre: "Cambio de pasta térmica del procesador",
        precio_ref: "35.00",
        tipo_item: "servicio",
        isActive: true,
      },
      {
        nombre: "Mantenimiento de refrigeración líquida",
        precio_ref: "100.00",
        tipo_item: "servicio",
        isActive: true,
      },
      {
        nombre: "Mantenimiento y optimización de Windows",
        precio_ref: "50.00",
        tipo_item: "servicio",
        isActive: true,
      },
      {
        nombre: "Eliminación de virus y programas maliciosos",
        precio_ref: "40.00",
        tipo_item: "servicio",
        isActive: true,
      },
      {
        nombre: "Solución de errores de Windows",
        precio_ref: "40.00",
        tipo_item: "servicio",
        isActive: true,
      },
      {
        nombre: "Instalación y configuración de Windows",
        precio_ref: "70.00",
        tipo_item: "servicio",
        isActive: true,
      },
      {
        nombre: "Reinstalación de Windows",
        precio_ref: "70.00",
        tipo_item: "servicio",
        isActive: true,
      },
      {
        nombre: "Instalación y configuración de programas",
        precio_ref: "40.00",
        tipo_item: "servicio",
        isActive: true,
      },
      {
        nombre: "Reparación del inicio de Windows",
        precio_ref: "50.00",
        tipo_item: "servicio",
        isActive: true,
      },
      {
        nombre: "Reparación de fallas de encendido de PC",
        precio_ref: "50.00",
        tipo_item: "servicio",
        isActive: true,
      },
      {
        nombre: "Reparación del sistema de alimentación eléctrica",
        precio_ref: "60.00",
        tipo_item: "servicio",
        isActive: true,
      },
      {
        nombre: "Reparación de conectores y puertos",
        precio_ref: "80.00",
        tipo_item: "servicio",
        isActive: true,
      },
      {
        nombre: "Reparación electrónica de placa madre",
        precio_ref: "120.00",
        tipo_item: "servicio",
        isActive: true,
      },
      {
        nombre: "Solución de fallas de memoria RAM",
        precio_ref: "40.00",
        tipo_item: "servicio",
        isActive: true,
      },
      {
        nombre: "Solución de fallas de almacenamiento",
        precio_ref: "40.00",
        tipo_item: "servicio",
        isActive: true,
      },
      {
        nombre: "Reparación del sistema de refrigeración",
        precio_ref: "60.00",
        tipo_item: "servicio",
        isActive: true,
      },
      {
        nombre: "Ensamblaje de PC",
        precio_ref: "100.00",
        tipo_item: "servicio",
        isActive: true,
      },
      {
        nombre: "Instalación de memoria RAM",
        precio_ref: "25.00",
        tipo_item: "servicio",
        isActive: true,
      },
      {
        nombre: "Instalación de unidad SSD",
        precio_ref: "35.00",
        tipo_item: "servicio",
        isActive: true,
      },
      {
        nombre: "Instalación de unidad HDD",
        precio_ref: "25.00",
        tipo_item: "servicio",
        isActive: true,
      },
      {
        nombre: "Instalación de tarjeta gráfica",
        precio_ref: "35.00",
        tipo_item: "servicio",
        isActive: true,
      },
      {
        nombre: "Instalación de fuente de alimentación",
        precio_ref: "35.00",
        tipo_item: "servicio",
        isActive: true,
      },
      {
        nombre: "Instalación de placa madre",
        precio_ref: "80.00",
        tipo_item: "servicio",
        isActive: true,
      },
      {
        nombre: "Instalación de procesador",
        precio_ref: "40.00",
        tipo_item: "servicio",
        isActive: true,
      },
      {
        nombre: "Instalación de sistema de refrigeración",
        precio_ref: "50.00",
        tipo_item: "servicio",
        isActive: true,
      },
      {
        nombre: "Instalación de ventiladores de gabinete",
        precio_ref: "20.00",
        tipo_item: "servicio",
        isActive: true,
      },
      {
        nombre: "Instalación de tarjetas de expansión",
        precio_ref: "25.00",
        tipo_item: "servicio",
        isActive: true,
      },
      {
        nombre: "Clonación de unidad de almacenamiento",
        precio_ref: "80.00",
        tipo_item: "servicio",
        isActive: true,
      },
      {
        nombre: "Migración de Windows a otra unidad",
        precio_ref: "100.00",
        tipo_item: "servicio",
        isActive: true,
      },
      {
        nombre: "Recuperación de archivos eliminados",
        precio_ref: "80.00",
        tipo_item: "servicio",
        isActive: true,
      },
      {
        nombre: "Copia de seguridad de archivos",
        precio_ref: "40.00",
        tipo_item: "servicio",
        isActive: true,
      },
      {
        nombre: "Configuración de conexión de red",
        precio_ref: "30.00",
        tipo_item: "servicio",
        isActive: true,
      },
      {
        nombre: "Configuración de Wi-Fi",
        precio_ref: "25.00",
        tipo_item: "servicio",
        isActive: true,
      },
      {
        nombre: "Configuración de periféricos",
        precio_ref: "20.00",
        tipo_item: "servicio",
        isActive: true,
      },
      {
        nombre: "Configuración de impresora en PC",
        precio_ref: "25.00",
        tipo_item: "servicio",
        isActive: true,
      },
      {
        nombre: "Configuración de audio y video",
        precio_ref: "25.00",
        tipo_item: "servicio",
        isActive: true,
      },
      {
        nombre: "Actualización de BIOS/UEFI",
        precio_ref: "50.00",
        tipo_item: "servicio",
        isActive: true,
      },

      // --- PC COMBOS ---
      {
        nombre: "Cambio de memoria RAM",
        precio_ref: "120.00",
        tipo_item: "combo",
        isActive: true,
      },
      {
        nombre: "Cambio de unidad SSD",
        precio_ref: "230.00",
        tipo_item: "combo",
        isActive: true,
      },
      {
        nombre: "Cambio de unidad HDD",
        precio_ref: "180.00",
        tipo_item: "combo",
        isActive: true,
      },
      {
        nombre: "Cambio de tarjeta gráfica",
        precio_ref: "650.00",
        tipo_item: "combo",
        isActive: true,
      },
      {
        nombre: "Cambio de fuente de alimentación",
        precio_ref: "230.00",
        tipo_item: "combo",
        isActive: true,
      },
      {
        nombre: "Cambio de placa madre",
        precio_ref: "450.00",
        tipo_item: "combo",
        isActive: true,
      },
      {
        nombre: "Cambio de procesador",
        precio_ref: "400.00",
        tipo_item: "combo",
        isActive: true,
      },
      {
        nombre: "Cambio de sistema de refrigeración",
        precio_ref: "180.00",
        tipo_item: "combo",
        isActive: true,
      },
      {
        nombre: "Cambio de ventilador de gabinete",
        precio_ref: "80.00",
        tipo_item: "combo",
        isActive: true,
      },
      {
        nombre: "Cambio de tarjeta de expansión",
        precio_ref: "100.00",
        tipo_item: "combo",
        isActive: true,
      },
      {
        nombre: "Cambio de gabinete de PC",
        precio_ref: "250.00",
        tipo_item: "combo",
        isActive: true,
      },
      {
        nombre: "Cambio de batería CMOS",
        precio_ref: "40.00",
        tipo_item: "combo",
        isActive: true,
      },
      {
        nombre: "Cambio de conectores o puertos",
        precio_ref: "100.00",
        tipo_item: "combo",
        isActive: true,
      },
      {
        nombre: "Cambio de componentes electrónicos de placa madre",
        precio_ref: "150.00",
        tipo_item: "combo",
        isActive: true,
      },
      {
        nombre: "Cambio de cooler o disipador del procesador",
        precio_ref: "120.00",
        tipo_item: "combo",
        isActive: true,
      },

      // --- LAPTOP SERVICIOS ESPECÍFICOS ---
      {
        nombre: "Diagnóstico de laptop",
        precio_ref: "35.00",
        tipo_item: "servicio",
        isActive: true,
      },
      {
        nombre: "Mantenimiento y limpieza interna de laptop",
        precio_ref: "75.00",
        tipo_item: "servicio",
        isActive: true,
      },
      {
        nombre: "Instalación de módulo Wi-Fi",
        precio_ref: "30.00",
        tipo_item: "servicio",
        isActive: true,
      },
      {
        nombre: "Instalación de módulo Bluetooth",
        precio_ref: "30.00",
        tipo_item: "servicio",
        isActive: true,
      },

      // --- LAPTOP COMBOS ---
      {
        nombre: "Cambio de pantalla de laptop",
        precio_ref: "350.00",
        tipo_item: "combo",
        isActive: true,
      },
      {
        nombre: "Cambio de teclado integrado",
        precio_ref: "180.00",
        tipo_item: "combo",
        isActive: true,
      },
      {
        nombre: "Cambio de batería interna",
        precio_ref: "170.00",
        tipo_item: "combo",
        isActive: true,
      },
      {
        nombre: "Cambio de conector de carga",
        precio_ref: "150.00",
        tipo_item: "combo",
        isActive: true,
      },
      {
        nombre: "Cambio de bisagras de pantalla",
        precio_ref: "180.00",
        tipo_item: "combo",
        isActive: true,
      },
      {
        nombre: "Cambio de carcasa superior",
        precio_ref: "200.00",
        tipo_item: "combo",
        isActive: true,
      },
      {
        nombre: "Cambio de carcasa inferior",
        precio_ref: "180.00",
        tipo_item: "combo",
        isActive: true,
      },
      {
        nombre: "Cambio de cable flex de pantalla",
        precio_ref: "120.00",
        tipo_item: "combo",
        isActive: true,
      },
      {
        nombre: "Cambio de touchpad",
        precio_ref: "120.00",
        tipo_item: "combo",
        isActive: true,
      },
      {
        nombre: "Cambio de módulo Wi-Fi",
        precio_ref: "100.00",
        tipo_item: "combo",
        isActive: true,
      },
      {
        nombre: "Cambio de módulo Bluetooth",
        precio_ref: "90.00",
        tipo_item: "combo",
        isActive: true,
      },
      {
        nombre: "Cambio de altavoces internos",
        precio_ref: "100.00",
        tipo_item: "combo",
        isActive: true,
      },
      {
        nombre: "Cambio de cámara web integrada",
        precio_ref: "120.00",
        tipo_item: "combo",
        isActive: true,
      },
      {
        nombre: "Cambio de batería CMOS de laptop",
        precio_ref: "50.00",
        tipo_item: "combo",
        isActive: true,
      },
      {
        nombre: "Cambio de botón o placa de encendido",
        precio_ref: "120.00",
        tipo_item: "combo",
        isActive: true,
      },

      // --- IMPRESORAS DE TINTA - SERVICIOS ---
      {
        nombre: "Diagnóstico de impresora",
        precio_ref: "30.00",
        tipo_item: "servicio",
        isActive: true,
      },
      {
        nombre: "Mantenimiento general de impresora de tinta",
        precio_ref: "75.00",
        tipo_item: "servicio",
        isActive: true,
      },
      {
        nombre: "Limpieza del mecanismo de impresión",
        precio_ref: "45.00",
        tipo_item: "servicio",
        isActive: true,
      },
      {
        nombre: "Limpieza del sistema de alimentación de papel",
        precio_ref: "40.00",
        tipo_item: "servicio",
        isActive: true,
      },
      {
        nombre: "Limpieza de la estación de servicio del cabezal",
        precio_ref: "45.00",
        tipo_item: "servicio",
        isActive: true,
      },
      {
        nombre: "Limpieza de sensores internos",
        precio_ref: "35.00",
        tipo_item: "servicio",
        isActive: true,
      },
      {
        nombre: "Limpieza del escáner y cristal",
        precio_ref: "30.00",
        tipo_item: "servicio",
        isActive: true,
      },
      {
        nombre: "Limpieza del alimentador automático de documentos (ADF)",
        precio_ref: "40.00",
        tipo_item: "servicio",
        isActive: true,
      },
      {
        nombre: "Limpieza de cabezal de impresión",
        precio_ref: "50.00",
        tipo_item: "servicio",
        isActive: true,
      },
      {
        nombre: "Limpieza profunda de cabezal de impresión",
        precio_ref: "90.00",
        tipo_item: "servicio",
        isActive: true,
      },
      {
        nombre: "Desobstrucción de inyectores de impresión",
        precio_ref: "70.00",
        tipo_item: "servicio",
        isActive: true,
      },
      {
        nombre: "Limpieza y recuperación del flujo de tinta",
        precio_ref: "50.00",
        tipo_item: "servicio",
        isActive: true,
      },
      {
        nombre: "Mantenimiento del sistema de suministro de tinta",
        precio_ref: "60.00",
        tipo_item: "servicio",
        isActive: true,
      },
      {
        nombre: "Mantenimiento del sistema de succión y recuperación de tinta",
        precio_ref: "70.00",
        tipo_item: "servicio",
        isActive: true,
      },
      {
        nombre: "Reparación del sistema de alimentación y arrastre de papel",
        precio_ref: "70.00",
        tipo_item: "servicio",
        isActive: true,
      },
      {
        nombre: "Reparación del desplazamiento del cabezal",
        precio_ref: "80.00",
        tipo_item: "servicio",
        isActive: true,
      },
      {
        nombre: "Reparación del sistema de limpieza del cabezal",
        precio_ref: "70.00",
        tipo_item: "servicio",
        isActive: true,
      },
      {
        nombre: "Reparación del sistema de engranajes",
        precio_ref: "80.00",
        tipo_item: "servicio",
        isActive: true,
      },
      {
        nombre: "Reparación del mecanismo de apertura y cierre",
        precio_ref: "50.00",
        tipo_item: "servicio",
        isActive: true,
      },
      {
        nombre: "Mantenimiento del sistema de almohadillas de tinta residual",
        precio_ref: "60.00",
        tipo_item: "servicio",
        isActive: true,
      },
      {
        nombre: "Purga del sistema de tinta residual",
        precio_ref: "50.00",
        tipo_item: "servicio",
        isActive: true,
      },
      {
        nombre: "Restablecimiento del contador de tinta residual",
        precio_ref: "35.00",
        tipo_item: "servicio",
        isActive: true,
      },
      {
        nombre: "Diagnóstico y reparación electrónica básica",
        precio_ref: "80.00",
        tipo_item: "servicio",
        isActive: true,
      },
      {
        nombre: "Reparación del sistema de alimentación eléctrica",
        precio_ref: "80.00",
        tipo_item: "servicio",
        isActive: true,
      },
      {
        nombre: "Reparación del sistema de sensores",
        precio_ref: "60.00",
        tipo_item: "servicio",
        isActive: true,
      },
      {
        nombre: "Reparación del sistema de escáner",
        precio_ref: "90.00",
        tipo_item: "servicio",
        isActive: true,
      },
      {
        nombre: "Reparación del alimentador automático de documentos (ADF)",
        precio_ref: "80.00",
        tipo_item: "servicio",
        isActive: true,
      },
      {
        nombre: "Instalación de controladores de impresora",
        precio_ref: "30.00",
        tipo_item: "servicio",
        isActive: true,
      },
      {
        nombre: "Reinstalación de controladores de impresora",
        precio_ref: "35.00",
        tipo_item: "servicio",
        isActive: true,
      },
      {
        nombre: "Configuración de impresora por USB",
        precio_ref: "25.00",
        tipo_item: "servicio",
        isActive: true,
      },
      {
        nombre: "Configuración de impresora por Wi-Fi",
        precio_ref: "35.00",
        tipo_item: "servicio",
        isActive: true,
      },
      {
        nombre: "Configuración de impresora en red local",
        precio_ref: "40.00",
        tipo_item: "servicio",
        isActive: true,
      },
      {
        nombre: "Configuración de impresora compartida en Windows",
        precio_ref: "35.00",
        tipo_item: "servicio",
        isActive: true,
      },
      {
        nombre: "Configuración de escaneo a computadora",
        precio_ref: "35.00",
        tipo_item: "servicio",
        isActive: true,
      },

      // --- IMPRESORAS DE TINTA - COMBOS ---
      {
        nombre: "Cambio de cabezal de impresión",
        precio_ref: "350.00",
        tipo_item: "combo",
        isActive: true,
      },
      {
        nombre: "Cambio del sistema de rodillos y alimentación de papel",
        precio_ref: "120.00",
        tipo_item: "combo",
        isActive: true,
      },
      {
        nombre: "Cambio de sensor de alimentación de papel",
        precio_ref: "100.00",
        tipo_item: "combo",
        isActive: true,
      },
      {
        nombre: "Cambio de sensor de arrastre de papel",
        precio_ref: "100.00",
        tipo_item: "combo",
        isActive: true,
      },
      {
        nombre: "Cambio del sistema de escáner",
        precio_ref: "250.00",
        tipo_item: "combo",
        isActive: true,
      },
      {
        nombre: "Cambio de placa electrónica",
        precio_ref: "250.00",
        tipo_item: "combo",
        isActive: true,
      },
      {
        nombre: "Cambio de fuente de alimentación",
        precio_ref: "150.00",
        tipo_item: "combo",
        isActive: true,
      },
      {
        nombre: "Cambio de panel de control",
        precio_ref: "150.00",
        tipo_item: "combo",
        isActive: true,
      },
      {
        nombre: "Cambio del mecanismo de desplazamiento del cabezal",
        precio_ref: "180.00",
        tipo_item: "combo",
        isActive: true,
      },
      {
        nombre: "Cambio del sistema de engranajes",
        precio_ref: "150.00",
        tipo_item: "combo",
        isActive: true,
      },
      {
        nombre: "Cambio del sistema de succión de tinta",
        precio_ref: "150.00",
        tipo_item: "combo",
        isActive: true,
      },
      {
        nombre: "Cambio de la estación de servicio del cabezal",
        precio_ref: "180.00",
        tipo_item: "combo",
        isActive: true,
      },
      {
        nombre: "Cambio del alimentador automático de documentos (ADF)",
        precio_ref: "250.00",
        tipo_item: "combo",
        isActive: true,
      },
      {
        nombre: "Desbloqueo y reseteo de celular o tablet",
        precio_ref: "55.00",
        tipo_item: "servicio",
        isActive: true,
      },
      {
        nombre: "Recarga de tinta y cambio de cartuchos",
        precio_ref: "40.00",
        tipo_item: "servicio",
        isActive: true,
      },
      {
        nombre: "Servicio de copiado e impresión",
        precio_ref: "20.00",
        tipo_item: "servicio",
        isActive: true,
      },
      {
        nombre: "Instalación de sistema de videovigilancia CCTV",
        precio_ref: "150.00",
        tipo_item: "servicio",
        isActive: true,
      },
      {
        nombre: "Diagnóstico y reparación de celular",
        precio_ref: "60.00",
        tipo_item: "servicio",
        isActive: true,
      },
      {
        nombre: "Desbloqueo y reseteo de firmware de impresora",
        precio_ref: "60.00",
        tipo_item: "servicio",
        isActive: true,
      },
      {
        nombre: "Atención de garantía",
        precio_ref: "0.00",
        tipo_item: "servicio",
        isActive: true,
      },
    ])
    .returning();
  console.log("✅ Catálogo creado:", catalogo.length, "ítems");

  console.log("🎉 Seed completado exitosamente!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Error en seed:", err);
  process.exit(1);
});
