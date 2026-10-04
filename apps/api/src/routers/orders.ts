import {
  router,
  adminProcedure,
  authedProcedure,
} from "../procedures/index.js";
import {
  createOrderSchema,
  getOrderByIdSchema,
  listOrdersSchema,
  anularOrderSchema,
  updateOrderSchema,
  changeOrderStatusSchema,
  assignTechnicianSchema,
} from "@central-pc/schemas";

export const ordersRouter = router({
  create: authedProcedure
    .input(createOrderSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.orders.create.execute(input, {
        userId: ctx.user.id,
      });
    }),
  list: authedProcedure
    .input(listOrdersSchema)
    .query(async ({ ctx, input }) => {
      return await ctx.services.orders.list.execute(input);
    }),
  getById: authedProcedure
    .input(getOrderByIdSchema)
    .query(async ({ ctx, input }) => {
      return await ctx.services.orders.getById.execute(input);
    }),
  update: authedProcedure
    .input(updateOrderSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.orders.update.execute(input, {
        userId: ctx.user.id,
        userRole: ctx.user.rol,
      });
    }),
  changeStatus: authedProcedure
    .input(changeOrderStatusSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.orders.changeStatus.execute(input, {
        userId: ctx.user.id,
        userRole: ctx.user.rol,
      });
    }),

  assignTechnician: authedProcedure
    .input(assignTechnicianSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.orders.assignTechnician.execute(input, {
        userId: ctx.user.id,
        userRole: ctx.user.rol,
      });
    }),

  anular: adminProcedure
    .input(anularOrderSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.orders.anular.execute(input, {
        userId: ctx.user.id,
      });
    }),
});
