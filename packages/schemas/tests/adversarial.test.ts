import { describe, it, expect } from "vitest";
import {
  registerSchema,
  loginSchema,
  createClientSchema,
  searchClientSchema,
  createItemSchema,
  listItemsSchema,
  createComboSchema,
  updateItemSchema,
  createOrderSchema,
  updateOrderSchema,
  changeOrderStatusSchema,
  anularOrderSchema,
  assignTechnicianSchema,
  listOrdersSchema,
  createPaymentSchema,
  anularPagoSchema,
} from "../index.js";

// ============================================================
// Payloads adversariales reutilizables
// ============================================================

const XSS_PAYLOADS = [
  '<script>alert("xss")</script>',
  '<img src=x onerror=alert(1)>',
  '"><svg onload=alert(1)>',
  "javascript:alert(document.cookie)",
];

const SQL_INJECTION_PAYLOADS = [
  "' OR '1'='1",
  "'; DROP TABLE users; --",
  "1; SELECT * FROM users",
  "' UNION SELECT null, null, null --",
  "admin'--",
];

const OVERFLOW_STRING = "A".repeat(10_000);
const UNICODE_BOMB = "𝕳𝖊𝖑𝖑𝖔".repeat(200);
const NULL_BYTES = "normal\x00malicious";
const EMPTY_WHITESPACE = "   \t\n  ";

const PROTOTYPE_POLLUTION = {
  __proto__: { admin: true },
  constructor: { prototype: { admin: true } },
};

// ============================================================
// AUTH — Registro y Login
// ============================================================

describe("ADVERSARIAL: Auth Schemas", () => {
  describe("registerSchema — inyección", () => {
    it.each(XSS_PAYLOADS)(
      "debe sanitizar o aceptar sin ejecutar XSS en nombre: %s",
      (payload) => {
        const result = registerSchema.safeParse({
          nombre: payload,
          user_name: "testuser",
          password: "securepass123",
          rol: "tecnico",
        });
        // Zod acepta strings válidos — la protección XSS es responsabilidad del render
        // Pero verificamos que no rompa el schema
        expect(result.success).toBe(true);
      },
    );

    it.each(SQL_INJECTION_PAYLOADS)(
      "debe aceptar sin ejecutar SQL injection en user_name: %s",
      (payload) => {
        const result = registerSchema.safeParse({
          nombre: "Test User",
          user_name: payload,
          password: "securepass123",
          rol: "tecnico",
        });
        expect(result.success).toBe(true);
      },
    );

    it("debe rechazar roles no autorizados (escalación de privilegios)", () => {
      const roles = ["superadmin", "root", "owner", "god", "ADMIN", "Admin"];
      for (const rol of roles) {
        const result = registerSchema.safeParse({
          nombre: "Hacker",
          user_name: "hacker",
          password: "pass",
          rol,
        });
        expect(result.success).toBe(false);
      }
    });

    it("debe rechazar nombre que excede el límite de caracteres", () => {
      const result = registerSchema.safeParse({
        nombre: OVERFLOW_STRING,
        user_name: "user",
        password: "pass",
        rol: "tecnico",
      });
      expect(result.success).toBe(false);
    });

    it("debe rechazar user_name que excede el límite de caracteres", () => {
      const result = registerSchema.safeParse({
        nombre: "User",
        user_name: OVERFLOW_STRING,
        password: "pass",
        rol: "tecnico",
      });
      expect(result.success).toBe(false);
    });

    it("debe rechazar campos vacíos", () => {
      expect(
        registerSchema.safeParse({
          nombre: "",
          user_name: "",
          password: "",
          rol: "tecnico",
        }).success,
      ).toBe(false);
    });

    it("debe rechazar tipos incorrectos en todos los campos", () => {
      expect(
        registerSchema.safeParse({
          nombre: 12345,
          user_name: null,
          password: undefined,
          rol: 999,
        }).success,
      ).toBe(false);
    });

    it("debe ignorar campos extra (prototype pollution)", () => {
      const result = registerSchema.safeParse({
        nombre: "Normal User",
        user_name: "normal",
        password: "pass123",
        rol: "tecnico",
        ...PROTOTYPE_POLLUTION,
        isAdmin: true,
        role_override: "admin",
      });
      if (result.success) {
        const data = result.data as any;
        expect(data.isAdmin).toBeUndefined();
        expect(data.role_override).toBeUndefined();
        expect(data.__proto__?.admin).toBeUndefined();
      }
    });
  });

  describe("loginSchema — fuerza bruta y evasión", () => {
    it("debe rechazar credenciales completamente vacías", () => {
      expect(loginSchema.safeParse({ user_name: "", password: "" }).success).toBe(false);
    });

    it("debe manejar passwords extremadamente largos sin crash", () => {
      const result = loginSchema.safeParse({
        user_name: "admin",
        password: "A".repeat(100_000),
      });
      expect(result.success).toBe(true);
    });

    it("debe manejar null bytes en credenciales", () => {
      const result = loginSchema.safeParse({
        user_name: NULL_BYTES,
        password: NULL_BYTES,
      });
      // Debe parsear como string — no truncar en el null byte
      expect(result.success).toBe(true);
    });
  });
});

// ============================================================
// CLIENTS — Inyección y límites
// ============================================================

describe("ADVERSARIAL: Client Schemas", () => {
  describe("createClientSchema — inputs maliciosos", () => {
    it.each(XSS_PAYLOADS)(
      "no debe crashear con XSS en nombre: %s",
      (payload) => {
        const result = createClientSchema.safeParse({
          nombre: payload,
          telefono: "999999999",
        });
        expect(result.success).toBe(true);
      },
    );

    it("debe rechazar teléfono con más de 20 caracteres", () => {
      const result = createClientSchema.safeParse({
        nombre: "Cliente Test",
        telefono: "9".repeat(21),
      });
      expect(result.success).toBe(false);
    });

    it("debe aceptar DNI y RUC como opcionales sin crashear", () => {
      const result = createClientSchema.safeParse({
        nombre: "Cliente",
        telefono: "999",
        dni: undefined,
        ruc: undefined,
      });
      expect(result.success).toBe(true);
    });

    it("debe rechazar unicode complejo que excede max length", () => {
      const result = createClientSchema.safeParse({
        nombre: UNICODE_BOMB,
        telefono: "999999999",
      });
      expect(result.success).toBe(false);
    });

    it("debe aceptar unicode válido dentro del límite", () => {
      const result = createClientSchema.safeParse({
        nombre: "José María García-Ñoño",
        telefono: "999999999",
      });
      expect(result.success).toBe(true);
    });

    it("NO valida formato de DNI (8 dígitos) — posible brecha", () => {
      const result = createClientSchema.safeParse({
        nombre: "Cliente",
        telefono: "999",
        dni: "esto-no-es-un-dni-valido-!@#$%",
      });
      // Documentamos que el schema acepta cualquier string como DNI
      expect(result.success).toBe(true);
    });

    it("NO valida formato de RUC (11 dígitos) — posible brecha", () => {
      const result = createClientSchema.safeParse({
        nombre: "Empresa",
        telefono: "999",
        ruc: "abc",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("searchClientSchema — inyección en búsqueda", () => {
    it.each(SQL_INJECTION_PAYLOADS)(
      "debe aceptar sin ejecutar SQL en query: %s",
      (payload) => {
        const result = searchClientSchema.safeParse({
          query: payload,
          limit: 10,
        });
        expect(result.success).toBe(true);
      },
    );

    it("debe rechazar límites fuera de rango", () => {
      expect(
        searchClientSchema.safeParse({ query: "test", limit: 0 }).success,
      ).toBe(false);
      expect(
        searchClientSchema.safeParse({ query: "test", limit: 51 }).success,
      ).toBe(false);
      expect(
        searchClientSchema.safeParse({ query: "test", limit: -1 }).success,
      ).toBe(false);
    });
  });
});

// ============================================================
// CATALOG — Manipulación de precios y tipos
// ============================================================

describe("ADVERSARIAL: Catalog Schemas", () => {
  describe("createItemSchema — manipulación de datos", () => {
    it("debe rechazar tipos de item inventados", () => {
      const tipos = ["gratis", "premium", "hack", "SERVICIO", "Combo"];
      for (const tipo of tipos) {
        const result = createItemSchema.safeParse({
          tipo,
          nombre: "Item",
          precio_referencial: "100.00",
        });
        expect(result.success).toBe(false);
      }
    });

    it("debe rechazar nombre vacío", () => {
      const result = createItemSchema.safeParse({
        tipo: "servicio",
        nombre: "",
        precio_referencial: "100.00",
      });
      expect(result.success).toBe(false);
    });

    it("debe rechazar precio referencial vacío", () => {
      const result = createItemSchema.safeParse({
        tipo: "servicio",
        nombre: "Test",
        precio_referencial: "",
      });
      expect(result.success).toBe(false);
    });

    it("NO valida que precio_referencial sea numérico — posible brecha", () => {
      const result = createItemSchema.safeParse({
        tipo: "servicio",
        nombre: "Test",
        precio_referencial: "not-a-number",
      });
      // precio_referencial es z.string().min(1) — acepta cualquier string no vacío
      expect(result.success).toBe(true);
    });

    it("NO valida precios negativos en string — posible brecha", () => {
      const result = createItemSchema.safeParse({
        tipo: "servicio",
        nombre: "Test",
        precio_referencial: "-999.99",
      });
      expect(result.success).toBe(true);
    });

    it.each(XSS_PAYLOADS)(
      "no debe crashear con XSS en nombre de item: %s",
      (payload) => {
        const result = createItemSchema.safeParse({
          tipo: "servicio",
          nombre: payload,
          precio_referencial: "10.00",
        });
        expect(result.success).toBe(true);
      },
    );
  });

  describe("listItemsSchema — abuso de paginación", () => {
    it("debe rechazar limit mayor a 500", () => {
      const result = listItemsSchema.safeParse({ limit: 501 });
      expect(result.success).toBe(false);
    });

    it("debe rechazar offset negativo", () => {
      const result = listItemsSchema.safeParse({ offset: -1 });
      expect(result.success).toBe(false);
    });

    it("debe rechazar limit de 0", () => {
      const result = listItemsSchema.safeParse({ limit: 0 });
      expect(result.success).toBe(false);
    });
  });

  describe("updateItemSchema — escalación y manipulación", () => {
    it("debe ignorar campos extra no definidos", () => {
      const result = updateItemSchema.safeParse({
        id: 1,
        nombre: "Updated",
        isAdmin: true,
        tipo_item: "combo",
      });
      if (result.success) {
        const data = result.data as any;
        expect(data.isAdmin).toBeUndefined();
        expect(data.tipo_item).toBeUndefined();
      }
    });
  });

  describe("createComboSchema — integridad de combos", () => {
    it("debe rechazar combo con menos de 2 componentes", () => {
      const result = createComboSchema.safeParse({
        nombre: "Combo falso",
        precio_referencial: 100,
        componentes: [{ componente_item_id: 1, cantidad: 1 }],
      });
      expect(result.success).toBe(false);
    });

    it("debe rechazar combo con precio negativo", () => {
      const result = createComboSchema.safeParse({
        nombre: "Combo",
        precio_referencial: -50,
        componentes: [
          { componente_item_id: 1, cantidad: 1 },
          { componente_item_id: 2, cantidad: 1 },
        ],
      });
      expect(result.success).toBe(false);
    });

    it("debe rechazar combo con cantidad 0 en componente", () => {
      const result = createComboSchema.safeParse({
        nombre: "Combo",
        precio_referencial: 100,
        componentes: [
          { componente_item_id: 1, cantidad: 0 },
          { componente_item_id: 2, cantidad: 1 },
        ],
      });
      expect(result.success).toBe(false);
    });

    it("debe rechazar componentes vacíos", () => {
      const result = createComboSchema.safeParse({
        nombre: "Combo vacío",
        precio_referencial: 100,
        componentes: [],
      });
      expect(result.success).toBe(false);
    });
  });
});

// ============================================================
// ORDERS — Lógica de negocio adversarial
// ============================================================

describe("ADVERSARIAL: Order Schemas", () => {
  describe("createOrderSchema — órdenes malformadas", () => {
    it("debe rechazar orden completamente vacía", () => {
      const result = createOrderSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it("debe rechazar orden sin equipos ni detalle suelto", () => {
      const result = createOrderSchema.safeParse({
        cliente_id: 1,
        equipos: [],
        detalle_suelto: [],
      });
      expect(result.success).toBe(false);
    });

    it("debe rechazar equipo sin descripción", () => {
      const result = createOrderSchema.safeParse({
        equipos: [
          {
            tipo_equipo: "PC",
            descripcion: "",
            detalle: [
              { nombre_personalizado: "Test", precio_unitario: 10, cantidad: 1 },
            ],
          },
        ],
      });
      expect(result.success).toBe(false);
    });

    it("debe rechazar equipo con detalle vacío", () => {
      const result = createOrderSchema.safeParse({
        equipos: [
          {
            tipo_equipo: "LAPTOP",
            descripcion: "Lenovo",
            detalle: [],
          },
        ],
      });
      expect(result.success).toBe(false);
    });

    it("acepta precio_unitario de 0 (nonnegative) — podría ser intencional para garantías", () => {
      const result = createOrderSchema.safeParse({
        equipos: [
          {
            tipo_equipo: "PC",
            descripcion: "PC Test",
            detalle: [
              { nombre_personalizado: "Garantía", precio_unitario: 0, cantidad: 1 },
            ],
          },
        ],
      });
      expect(result.success).toBe(true);
    });

    it("debe rechazar precio_unitario negativo", () => {
      const result = createOrderSchema.safeParse({
        equipos: [
          {
            tipo_equipo: "PC",
            descripcion: "PC",
            detalle: [
              { nombre_personalizado: "Hack", precio_unitario: -100, cantidad: 1 },
            ],
          },
        ],
      });
      expect(result.success).toBe(false);
    });

    it("debe rechazar cantidad 0 en detalle", () => {
      const result = createOrderSchema.safeParse({
        equipos: [
          {
            tipo_equipo: "PC",
            descripcion: "PC",
            detalle: [
              { nombre_personalizado: "Item", precio_unitario: 50, cantidad: 0 },
            ],
          },
        ],
      });
      expect(result.success).toBe(false);
    });

    it("debe rechazar tipo de equipo inventado", () => {
      const result = createOrderSchema.safeParse({
        equipos: [
          {
            tipo_equipo: "DRONE",
            descripcion: "DJI Mini",
            detalle: [
              { nombre_personalizado: "Reparación", precio_unitario: 200, cantidad: 1 },
            ],
          },
        ],
      });
      expect(result.success).toBe(false);
    });

    it.each(XSS_PAYLOADS)(
      "no debe crashear con XSS en observaciones: %s",
      (payload) => {
        const result = createOrderSchema.safeParse({
          observaciones: payload,
          equipos: [
            {
              tipo_equipo: "PC",
              descripcion: "Test",
              detalle: [
                { nombre_personalizado: "Item", precio_unitario: 10, cantidad: 1 },
              ],
            },
          ],
        });
        expect(result.success).toBe(true);
      },
    );

    it("debe manejar orden con muchos equipos sin crashear", () => {
      const equipos = Array.from({ length: 100 }, (_, i) => ({
        tipo_equipo: "PC" as const,
        descripcion: `PC #${i}`,
        detalle: [
          { nombre_personalizado: `Item ${i}`, precio_unitario: 10, cantidad: 1 },
        ],
      }));
      const result = createOrderSchema.safeParse({ equipos });
      expect(result.success).toBe(true);
    });

    it("NO limita la cantidad máxima por ítem — posible brecha", () => {
      const result = createOrderSchema.safeParse({
        equipos: [
          {
            tipo_equipo: "PC",
            descripcion: "PC",
            detalle: [
              {
                nombre_personalizado: "Item",
                precio_unitario: 1,
                cantidad: 999_999_999,
              },
            ],
          },
        ],
      });
      expect(result.success).toBe(true);
    });

    it("NO limita el precio unitario máximo — posible brecha", () => {
      const result = createOrderSchema.safeParse({
        equipos: [
          {
            tipo_equipo: "PC",
            descripcion: "PC",
            detalle: [
              {
                nombre_personalizado: "Item caro",
                precio_unitario: Number.MAX_SAFE_INTEGER,
                cantidad: 1,
              },
            ],
          },
        ],
      });
      expect(result.success).toBe(true);
    });
  });

  describe("changeOrderStatusSchema — transiciones inválidas", () => {
    it("debe rechazar estados inventados", () => {
      const estados = ["PAGADA", "ELIMINADA", "ARCHIVADA", "EN_PROCESO", "PENDING"];
      for (const estado of estados) {
        const result = changeOrderStatusSchema.safeParse({ id: 1, estado });
        expect(result.success).toBe(false);
      }
    });

    it("acepta cualquier transición de estado — no valida flujo a nivel schema", () => {
      // NOTA: validar transiciones (ej. no saltar de RECEPCIONADA a ENTREGADA)
      // debería hacerse en el servicio, no en el schema
      const result = changeOrderStatusSchema.safeParse({
        id: 1,
        estado: "ENTREGADA",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("anularOrderSchema — motivo obligatorio", () => {
    it("debe rechazar anulación sin motivo", () => {
      expect(
        anularOrderSchema.safeParse({ id: 1, motivo: "" }).success,
      ).toBe(false);
    });

    it("debe rechazar anulación sin id", () => {
      expect(
        anularOrderSchema.safeParse({ motivo: "Error" }).success,
      ).toBe(false);
    });

    it.each(SQL_INJECTION_PAYLOADS)(
      "no debe crashear con SQL injection en motivo: %s",
      (payload) => {
        const result = anularOrderSchema.safeParse({ id: 1, motivo: payload });
        expect(result.success).toBe(true);
      },
    );
  });

  describe("assignTechnicianSchema — manipulación de asignación", () => {
    it("debe aceptar null para desasignar técnico", () => {
      const result = assignTechnicianSchema.safeParse({
        id: 1,
        encargado_id: null,
      });
      expect(result.success).toBe(true);
    });

    it("debe rechazar tipos inválidos en encargado_id", () => {
      expect(
        assignTechnicianSchema.safeParse({ id: 1, encargado_id: "admin" }).success,
      ).toBe(false);
    });
  });

  describe("listOrdersSchema — abuso de filtros", () => {
    it("debe rechazar limit mayor a 500", () => {
      const result = listOrdersSchema.safeParse({ limit: 501 });
      expect(result.success).toBe(false);
    });

    it("debe rechazar offset negativo", () => {
      const result = listOrdersSchema.safeParse({ offset: -1 });
      expect(result.success).toBe(false);
    });
  });
});

// ============================================================
// PAYMENTS — Manipulación financiera
// ============================================================

describe("ADVERSARIAL: Payment Schemas", () => {
  describe("createPaymentSchema — fraude y manipulación", () => {
    it("debe rechazar monto 0", () => {
      const result = createPaymentSchema.safeParse({
        order_id: 1,
        metodo: "efectivo",
        monto: 0,
      });
      expect(result.success).toBe(false);
    });

    it("debe rechazar monto negativo", () => {
      const result = createPaymentSchema.safeParse({
        order_id: 1,
        metodo: "efectivo",
        monto: -100,
      });
      expect(result.success).toBe(false);
    });

    it("NO limita el monto máximo — posible brecha", () => {
      const result = createPaymentSchema.safeParse({
        order_id: 1,
        metodo: "efectivo",
        monto: 999_999_999.99,
      });
      expect(result.success).toBe(true);
    });

    it("debe rechazar métodos de pago inventados", () => {
      const metodos = ["bitcoin", "crypto", "paypal", "EFECTIVO", "Yape"];
      for (const metodo of metodos) {
        const result = createPaymentSchema.safeParse({
          order_id: 1,
          metodo,
          monto: 50,
        });
        expect(result.success).toBe(false);
      }
    });

    it("debe rechazar fecha inválida", () => {
      const result = createPaymentSchema.safeParse({
        order_id: 1,
        metodo: "efectivo",
        monto: 50,
        fecha_pago: "not-a-date",
      });
      expect(result.success).toBe(false);
    });

    it("debe aceptar fecha ISO válida", () => {
      const result = createPaymentSchema.safeParse({
        order_id: 1,
        metodo: "efectivo",
        monto: 50,
        fecha_pago: "2026-11-10",
      });
      expect(result.success).toBe(true);
    });

    it("debe rechazar order_id como string", () => {
      const result = createPaymentSchema.safeParse({
        order_id: "1",
        metodo: "efectivo",
        monto: 50,
      });
      expect(result.success).toBe(false);
    });

    it("debe ignorar campos extra (intento de manipulación)", () => {
      const result = createPaymentSchema.safeParse({
        order_id: 1,
        metodo: "efectivo",
        monto: 50,
        estado: "aprobado",
        validado: true,
        descuento: 100,
      });
      if (result.success) {
        const data = result.data as any;
        expect(data.estado).toBeUndefined();
        expect(data.validado).toBeUndefined();
        expect(data.descuento).toBeUndefined();
      }
    });

    it("NO valida precisión decimal del monto — posible brecha", () => {
      const result = createPaymentSchema.safeParse({
        order_id: 1,
        metodo: "efectivo",
        monto: 10.999999999,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("anularPagoSchema — anulación fraudulenta", () => {
    it("debe rechazar motivo vacío", () => {
      expect(
        anularPagoSchema.safeParse({ id: 1, motivo: "" }).success,
      ).toBe(false);
    });

    it.each(XSS_PAYLOADS)(
      "no debe crashear con XSS en motivo: %s",
      (payload) => {
        const result = anularPagoSchema.safeParse({ id: 1, motivo: payload });
        expect(result.success).toBe(true);
      },
    );
  });
});

// ============================================================
// CROSS-CUTTING — Temas transversales
// ============================================================

describe("ADVERSARIAL: Cross-cutting concerns", () => {
  describe("Prototype pollution en todos los schemas", () => {
    const poisonedPayload = {
      __proto__: { isAdmin: true },
      constructor: { prototype: { isAdmin: true } },
    };

    it("registerSchema debe strip prototype pollution", () => {
      const result = registerSchema.safeParse({
        ...poisonedPayload,
        nombre: "Test",
        user_name: "test",
        password: "pass",
        rol: "tecnico",
      });
      if (result.success) {
        expect((result.data as any).isAdmin).toBeUndefined();
      }
    });

    it("createOrderSchema debe strip prototype pollution", () => {
      const result = createOrderSchema.safeParse({
        ...poisonedPayload,
        equipos: [
          {
            tipo_equipo: "PC",
            descripcion: "Test",
            detalle: [
              { nombre_personalizado: "Item", precio_unitario: 10, cantidad: 1 },
            ],
          },
        ],
      });
      if (result.success) {
        expect((result.data as any).isAdmin).toBeUndefined();
      }
    });

    it("createPaymentSchema debe strip prototype pollution", () => {
      const result = createPaymentSchema.safeParse({
        ...poisonedPayload,
        order_id: 1,
        metodo: "efectivo",
        monto: 50,
      });
      if (result.success) {
        expect((result.data as any).isAdmin).toBeUndefined();
      }
    });
  });

  describe("Type coercion attacks", () => {
    it("createPaymentSchema debe rechazar monto como string", () => {
      const result = createPaymentSchema.safeParse({
        order_id: 1,
        metodo: "efectivo",
        monto: "50",
      });
      expect(result.success).toBe(false);
    });

    it("createOrderSchema debe rechazar cantidad como string", () => {
      const result = createOrderSchema.safeParse({
        equipos: [
          {
            tipo_equipo: "PC",
            descripcion: "PC",
            detalle: [
              { nombre_personalizado: "Item", precio_unitario: 10, cantidad: "1" },
            ],
          },
        ],
      });
      expect(result.success).toBe(false);
    });

    it("IDs numéricos no deben aceptar NaN", () => {
      expect(
        changeOrderStatusSchema.safeParse({ id: NaN, estado: "COMPLETADA" }).success,
      ).toBe(false);
    });

    it("IDs numéricos no deben aceptar Infinity", () => {
      expect(
        changeOrderStatusSchema.safeParse({ id: Infinity, estado: "COMPLETADA" })
          .success,
      ).toBe(false);
    });
  });
});
