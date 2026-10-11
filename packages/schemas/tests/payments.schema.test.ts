import { describe, it, expect } from "vitest";
import {
  createPaymentSchema,
  anularPagoSchema,
  metodoPagoEnum,
} from "../payments.schema.js";

describe("Payment Schemas Validation", () => {
  describe("createPaymentSchema", () => {
    it("debe aceptar un pago válido con monto positivo y método soportado", () => {
      const payload = {
        order_id: 15,
        metodo: "yape" as const,
        monto: 50.0,
      };

      const result = createPaymentSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it("debe rechazar montos negativos o en cero", () => {
      const conCero = {
        order_id: 15,
        metodo: "efectivo" as const,
        monto: 0,
      };
      expect(createPaymentSchema.safeParse(conCero).success).toBe(false);

      const negativo = {
        order_id: 15,
        metodo: "efectivo" as const,
        monto: -20,
      };
      expect(createPaymentSchema.safeParse(negativo).success).toBe(false);
    });

    it("debe aceptar todos los métodos de pago configurados", () => {
      const metodos = ["efectivo", "yape", "plin", "transferencia", "tarjeta"];

      for (const metodo of metodos) {
        const payload = {
          order_id: 1,
          metodo,
          monto: 10,
        };
        expect(createPaymentSchema.safeParse(payload).success).toBe(true);
      }
    });

    it("debe rechazar métodos de pago no autorizados", () => {
      const payload = {
        order_id: 1,
        metodo: "bitcoin",
        monto: 100,
      };
      expect(createPaymentSchema.safeParse(payload).success).toBe(false);
    });
  });

  describe("anularPagoSchema", () => {
    it("debe requerir un motivo obligatorio no vacío para anulación", () => {
      expect(
        anularPagoSchema.safeParse({ id: 1, motivo: "Error de digitación en caja" })
          .success,
      ).toBe(true);

      expect(anularPagoSchema.safeParse({ id: 1, motivo: "" }).success).toBe(
        false,
      );
    });
  });
});
