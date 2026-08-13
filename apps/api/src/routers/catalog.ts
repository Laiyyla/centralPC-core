import { router } from "../procedures/public.js";
import { authedProcedure } from "../procedures/authed.js";
import {
  createItemSchema,
  updateItemSchema,
  listItemsSchema,
  getByIdSchema,
  toggleActiveSchema,
  createComboSchema,
} from "../schemas/catalog.schema.js";
import { catalogTable, eq, and, combo_components } from "@central-pc/database";
import { TRPCError } from "@trpc/server";

export const catalogRouter = router({
  create: authedProcedure
    .input(createItemSchema)
    .mutation(async ({ ctx, input }) => {
      const [newItem] = await ctx.db
        .insert(catalogTable)
        .values({
          nombre: input.nombre,
          precio_ref: input.precio_referencial,
          tipo_item: input.tipo,
        })
        .returning();
      return newItem;
    }),
  list: authedProcedure.input(listItemsSchema).query(async ({ ctx, input }) => {
    const { tipo, includeInactive } = input ?? {
      tipo: undefined,
      includeInactive: false,
    };
    const conditions = [];

    if (!includeInactive) {
      conditions.push(eq(catalogTable.isActive, true));
    }
    if (tipo) {
      conditions.push(eq(catalogTable.tipo_item, tipo));
    }
    if (conditions.length > 0) {
      return await ctx.db
        .select()
        .from(catalogTable)
        .where(and(...conditions));
    } else {
      return await ctx.db.select().from(catalogTable);
    }
  }),
  //No tengo idea de como hacer esa consulta dinamica :C
  getById: authedProcedure
    .input(getByIdSchema)
    .query(async ({ ctx, input }) => {
      const [item] = await ctx.db
        .select()
        .from(catalogTable)
        .where(eq(catalogTable.id, input.id));
      if (!item) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Item no Encontrado",
        });
      }
      return item;
    }),
  update: authedProcedure
    .input(updateItemSchema)
    .mutation(async ({ ctx, input }) => {
      const updateData: Partial<Omit<typeof input, "id">> = {};
      if (input.nombre !== undefined) updateData.nombre = input.nombre;
      if (input.precio_referencial !== undefined)
        updateData.precio_referencial = input.precio_referencial;
      if (input.activo !== undefined) updateData.activo = input.activo;
      const [updatedItem] = await ctx.db
        .update(catalogTable)
        .set(updateData)
        .where(eq(catalogTable.id, input.id))
        .returning();
      return updatedItem;
    }),
  toggleActive: authedProcedure
    .input(toggleActiveSchema)
    .mutation(async ({ ctx, input }) => {
      const [toggledActive] = await ctx.db
        .update(catalogTable)
        .set({
          isActive: input.activo,
        })
        .where(eq(catalogTable.id, input.id))
        .returning();
      return toggledActive;
    }),
  createCombo: authedProcedure
    .input(createComboSchema)
    .mutation(async ({ ctx, input }) => {
      const componentesMap = new Map<number, number>();

      for (const c of input.componentes) {
        const actual = componentesMap.get(c.componente_item_id) ?? 0;
        componentesMap.set(c.componente_item_id, actual + c.cantidad);
      }
      const componentesConsolidados = Array.from(componentesMap.entries()).map(
        ([componente_item_id, cantidad]) => ({ componente_item_id, cantidad }),
      );
      const result = await ctx.db.transaction(async (tx) => {
        const [combo] = await tx
          .insert(catalogTable)
          .values({
            nombre: input.nombre,
            precio_ref: input.precio_referencial.toString(),
            tipo_item: "combo",
            isActive: true,
          })
          .returning();

        for (const c of componentesConsolidados) {
          const [item] = await tx
            .select()
            .from(catalogTable)
            .where(eq(catalogTable.id, c.componente_item_id));
          if (!item) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: `Componente con el ID ${c.componente_item_id} no encontrado en el catalogo`,
            });
          }
          if (item.tipo_item === "combo") {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `No se pueden anidar combos, el item "${item.nombre}" es un combo`,
            });
          }
          await tx.insert(combo_components).values({
            combo_id: combo.id,
            comp_id: c.componente_item_id,
            cantidad: c.cantidad,
          });
        }
        return combo;
      });
      return result;
    }),
});
