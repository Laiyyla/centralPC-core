import { router } from "../procedures/public.js";
import { authedProcedure } from "../procedures/authed.js";
import {
  createClientSchema,
  searchClientSchema,
  getClientByIdSchema,
  listClientsSchema,
} from "@central-pc/schemas";
import { clientTable, eq, or, ilike } from "@central-pc/database";
import { TRPCError } from "@trpc/server";

export const clientsRouter = router({
  create: authedProcedure
    .input(createClientSchema)
    .mutation(async ({ ctx, input }) => {
      const [newClient] = await ctx.db
        .insert(clientTable)
        .values({
          nombre: input.nombre,
          telefono: input.telefono,
          dni: input.dni || null,
          ruc: input.ruc || null,
        })
        .returning();
      return newClient;
    }),
  list: authedProcedure
    .input(listClientsSchema)
    .query(async ({ ctx, input }) => {
      const { limit = 50, offset = 0 } = input ?? {};
      return await ctx.db
        .select()
        .from(clientTable)
        .limit(limit)
        .offset(offset);
    }),
  getById: authedProcedure
    .input(getClientByIdSchema)
    .query(async ({ ctx, input }) => {
      const client = await ctx.db.query.clientTable.findFirst({
        where: eq(clientTable.id, input.id),
        // No se me ocurre el como capturar en una constante el cliente que esta buscando y luego pasarlo por el handler de errores
        //CORRECION, GUARDA LAS COSAS EN VARIABLES PARA LUEGO USARLAS, NO TE LIMITES EN RAZONAMIENTO
        with: {
          orders: true,
        },
      });

      if (!client) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Cliente no Encontrado",
        });
      }

      return client;
    }),
  search: authedProcedure
    .input(searchClientSchema)
    .query(async ({ ctx, input }) => {
      const sanitizedQuery = input.query.replace(/[%_\\]/g, "\\$&");
      const clients = await ctx.db
        .select()
        .from(clientTable)
        .where(
          or(
            ilike(clientTable.nombre, `%${sanitizedQuery}%`),
            ilike(clientTable.telefono, `%${sanitizedQuery}%`),
          ),
        )
        .limit(input.limit);

      return clients;
    }),
});
