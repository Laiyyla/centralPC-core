import { describe, it, expect } from "vitest";
import {
  createOrderSchema,
  updateOrderSchema,
  estadoOrderEnum,
  tipoEquipoEnum,
} from "../order.schema.js";

describe("Order Schemas Validation", () => {
  describe("createOrderSchema", () => {
    it("debe aceptar una orden válida con 1 equipo y su detalle", () => {
      const payload = {
        cliente_id: 1,
        observaciones: "Pantalla rota",
        equipos: [
          {
            tipo_equipo: "LAPTOP" as const,
            descripcion: "Lenovo ThinkPad E14",
            detalle: [
              {
                nombre_personalizado: "Cambio de pantalla LED 14 pulgadas",
                precio_unitario: 250,
                cantidad: 1,
              },
            ],
          },
        ],
      };

      const result = createOrderSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it("debe aceptar una orden válida únicamente con detalle suelto (sin equipos físicos)", () => {
      const payload = {
        cliente_id: 2,
        equipos: [],
        detalle_suelto: [
          {
            nombre_personalizado: "Cargador universal 65W tipo C",
            precio_unitario: 85.5,
            cantidad: 1,
          },
        ],
      };

      const result = createOrderSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it("debe rechazar una orden si tanto equipos como detalle_suelto están vacíos", () => {
      const payload = {
        cliente_id: 1,
        equipos: [],
        detalle_suelto: [],
      };

      const result = createOrderSchema.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          "La orden debe tener almenos 1 equipo o 1 detalle suelto",
        );
      }
    });

    it("debe rechazar un equipo si no tiene al menos un ítem en su detalle", () => {
      const payload = {
        cliente_id: 1,
        equipos: [
          {
            tipo_equipo: "PC" as const,
            descripcion: "PC Gamer",
            detalle: [],
          },
        ],
      };

      const result = createOrderSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it("debe rechazar ítems con precio unitario menor o igual a cero", () => {
      const payload = {
        cliente_id: 1,
        equipos: [
          {
            tipo_equipo: "PC" as const,
            descripcion: "PC de escritorio",
            detalle: [
              {
                nombre_personalizado: "Mantenimiento preventivo",
                precio_unitario: 0,
                cantidad: 1,
              },
            ],
          },
        ],
      };

      const result = createOrderSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });
  });

  describe("updateOrderSchema", () => {
    it("debe aceptar una actualización que preserve equipos y detalle_suelto", () => {
      const payload = {
        id: 10,
        observaciones: "Actualizado con repuesto extra",
        equipos: [
          {
            tipo_equipo: "CELULAR" as const,
            descripcion: "Samsung A54",
            detalle: [
              {
                nombre_personalizado: "Cambio de batería",
                precio_unitario: 120,
                cantidad: 1,
              },
            ],
          },
        ],
        detalle_suelto: [
          {
            nombre_personalizado: "Cable de carga USB-C",
            precio_unitario: 25,
            cantidad: 2,
          },
        ],
      };

      const result = updateOrderSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });
  });

  describe("estadoOrderEnum", () => {
    it("debe validar correctamente los 7 estados operativos del ciclo de vida", () => {
      const estadosValidos = [
        "RECEPCIONADA",
        "EN_DIAGNOSTICO",
        "ESPERANDO_APROBACION",
        "EN_REPARACION",
        "COMPLETADA",
        "ENTREGADA",
        "ANULADA",
      ];

      for (const estado of estadosValidos) {
        expect(estadoOrderEnum.safeParse(estado).success).toBe(true);
      }

      expect(estadoOrderEnum.safeParse("EN_ESPERA").success).toBe(false);
      expect(estadoOrderEnum.safeParse("CANCELADA").success).toBe(false);
    });
  });
});
