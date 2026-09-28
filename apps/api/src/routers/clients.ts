import { router, authedProcedure } from "../procedures/index.js";
import {
  createClientSchema,
  searchClientSchema,
  getClientByIdSchema,
  listClientsSchema,
} from "@central-pc/schemas";

export const clientsRouter = router({
  create: authedProcedure
    .input(createClientSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.clients.create.execute(input);
    }),
  list: authedProcedure
    .input(listClientsSchema)
    .query(async ({ ctx, input }) => {
      return await ctx.services.clients.list.execute(input);
    }),
  getById: authedProcedure
    .input(getClientByIdSchema)
    .query(async ({ ctx, input }) => {
      return await ctx.services.clients.getById.execute(input);
    }),
  search: authedProcedure
    .input(searchClientSchema)
    .query(async ({ ctx, input }) => {
      return await ctx.services.clients.search.execute(input);
    }),
});
