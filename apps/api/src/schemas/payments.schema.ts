import { z } from "zod";

export const metodoPagoEnum = z.enum([
  "efectivo",
  "yape",
  "plin",
  "tansferencia",
  "tarjeta",
]);

export const createPaymentSchema = z.object({
  order_id: z.number(),
  metodo: metodoPagoEnum,
  monto: z.number().positive(),
  fecha_pago: z.iso.date().optional(),
});

export const anularPagoSchema = z.object({
  id: z.number(),
  motivo: z.string().min(1),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type AnularPagoInput = z.infer<typeof anularPagoSchema>;
