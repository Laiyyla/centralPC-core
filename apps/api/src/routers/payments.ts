import { router } from "../procedures/public.js";
import { authedProcedure } from "../procedures/authed.js";
import { adminProcedure } from "../procedures/admin.js";
import {
  createPaymentSchema,
  anularPagoSchema,
  getPagoByIdSchema,
} from "@central-pc/schemas";
import { paymentTable, orderTable, eq, sql, and } from "@central-pc/database";
import { TRPCError } from "@trpc/server";

export const paymentsRouter = router({
  create: authedProcedure
    .input(createPaymentSchema)
    .mutation(async ({ ctx, input }) => {
      const [orden] = await ctx.db
        .select()
        .from(orderTable)
        .where(eq(orderTable.id, input.order_id));
      if (!orden) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Orden no Encontrada",
        });
      }
      if (orden.estado === "ANULADA") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No se pueden registrar pagos en una orden Anulada",
        });
      }

      const pagosExistentes = await ctx.db
        .select({ totalPagado: sql`sum(${paymentTable.monto})` })
        .from(paymentTable)
        .where(
          and(
            eq(paymentTable.order_id, input.order_id),
            eq(paymentTable.estado, "ACTIVO"),
          ),
        );
      const totalPagado = Number(pagosExistentes[0]?.totalPagado ?? 0);
      const nuevoTotal = totalPagado + input.monto;

      if (nuevoTotal > Number(orden.total)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `El pago excede el total de la orden. El restante por pagar es: S/.${(Number(orden.total) - totalPagado).toFixed(2)}`,
        });
      }

      const [pago] = await ctx.db
        .insert(paymentTable)
        .values({
          order_id: input.order_id,
          metodo: input.metodo,
          monto: input.monto.toString(),
          fecha_pago: input.fecha_pago
            ? new Date(input.fecha_pago)
            : new Date(),
          estado: "ACTIVO",
        })
        .returning();

      return pago;
    }),
  listByOrder: authedProcedure
    .input(getPagoByIdSchema)
    .query(async ({ ctx, input }) => {
      const pagos = await ctx.db
        .select()
        .from(paymentTable)
        .where(eq(paymentTable.order_id, input.order_id));
      return pagos;
    }),
  anular: adminProcedure
    .input(anularPagoSchema)
    .mutation(async ({ ctx, input }) => {
      const [pago] = await ctx.db
        .select()
        .from(paymentTable)
        .where(eq(paymentTable.id, input.id));
      if (!pago) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Pago no Encontrado",
        });
      }
      if (pago.estado === "ANULADO") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "El pago especificado ya fue anulado",
        });
      }
      const [pagoActualizado] = await ctx.db
        .update(paymentTable)
        .set({
          estado: "ANULADO",
          fecha_anulacion: new Date(),
          motivo_anulacion: input.motivo,
          usuario_anulacion_id: ctx.user.id,
        })
        .where(eq(paymentTable.id, input.id))
        .returning();

      return pagoActualizado;
    }),
});
