import { router, authedProcedure } from "../procedures/index.js";
import {
  createItemSchema,
  updateItemSchema,
  listItemsSchema,
  getByIdSchema,
  toggleActiveSchema,
  createComboSchema,
} from "@central-pc/schemas";

export const catalogRouter = router({
  create: authedProcedure
    .input(createItemSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.catalog.create.execute(input);
    }),
  list: authedProcedure.input(listItemsSchema).query(async ({ ctx, input }) => {
    return await ctx.services.catalog.list.execute(input);
  }),
  getById: authedProcedure
    .input(getByIdSchema)
    .query(async ({ ctx, input }) => {
      return await ctx.services.catalog.getById.execute(input);
    }),
  update: authedProcedure
    .input(updateItemSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.catalog.update.execute(input);
    }),
  toggleActive: authedProcedure
    .input(toggleActiveSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.catalog.toggleActive.execute(input);
    }),
  createCombo: authedProcedure
    .input(createComboSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.catalog.createCombo.execute(input);
    }),
});
