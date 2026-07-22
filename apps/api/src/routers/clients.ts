import { router } from "../procedures/public.js";
import { authedProcedure } from "../procedures/authed.js";
import {
  createClientSchema,
  searchClientSchema,
  getByIdSchema,
} from "../schemas/clients.schema.js";
import { clientTable, eq, or, ilike } from "@central-pc/database";
import { TRPCError } from "@trpc/server";

//RECUERDA QUE ASYNC SIEMPRE LLEVA AWAIT, SON PROMESAS, NO SEAS LOCO

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
  list: authedProcedure.query(async ({ ctx }) => {
    return await ctx.db.select().from(clientTable);
  }),
  getById: authedProcedure
    .input(getByIdSchema)
    .query(async ({ ctx, input }) => {
      const [client] = await ctx.db
        .select()
        .from(clientTable)
        .where(eq(clientTable.id, input.id));
      // No se me ocurre el como capturar en una constante el cliente que esta buscando y luego pasarlo por el handler de errores
      //CORRECION, GUARDA LAS COSAS EN VARIABLES PARA LUEGO USARLAS, NO TE LIMITES EN RAZONAMIENTO
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
      const clients = await ctx.db
        .select()
        .from(clientTable)
        .where(
          or(
            ilike(clientTable.nombre, `%${input.query}%`),
            ilike(clientTable.telefono, `%${input.query}%`),
          ),
        ).limit(input.limit)

      return clients


      // Tampoco se me ocurre el como hacer bien la consular AIUDAAA
      //CORRECCION: Al parecer la forma de hacer eso es mas verbal que estructural asi que it is what it is
    }),
});
