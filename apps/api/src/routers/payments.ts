import {
  router,
  adminProcedure,
  authedProcedure,
} from "../procedures/index.js";
import {
  createPaymentSchema,
  anularPagoSchema,
  getPagoByIdSchema,
} from "@central-pc/schemas";

export const paymentsRouter = router({
  create: authedProcedure
    .input(createPaymentSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.payments.create.execute(input);
    }),
  listByOrder: authedProcedure
    .input(getPagoByIdSchema)
    .query(async ({ ctx, input }) => {
      return await ctx.services.payments.listByOrder.execute(input);
    }),
  anular: adminProcedure
    .input(anularPagoSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.payments.anular.execute(input, {
        userId: ctx.user.id,
      });
    }),
});
