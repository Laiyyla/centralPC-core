import { router } from "../procedures/public.js";
import { authedProcedure } from "../procedures/authed.js";
import { adminProcedure } from "../procedures/admin.js";
import {
  createOrderSchema,
  getOrderByIdSchema,
  listOrdersSchema,
  anularOrderSchema,
} from "../schemas/order.schema.js";
import {
  orderTable,
  deviceTable,
  orderDetailTable,
  branchTable,
  catalogTable,
  eq,
  clientTable,
  gte,
  lte,
  and,
  desc,
} from "@central-pc/database";
import { TRPCError } from "@trpc/server";

export const ordersRouter = router({
  create: authedProcedure
    .input(createOrderSchema)
    .mutation(async ({ ctx, input }) => {
      const sucursalId = Number(process.env.SUCURSAL_ID);
      if (!sucursalId) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Sucursal no configurada",
        });
      }
      const result = await ctx.db.transaction(async (tx) => {
        const [branch] = await tx
          .select()
          .from(branchTable)
          .where(eq(branchTable.id, sucursalId))
          .for("update");
        if (!branch) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Sucursal no Encontrada",
          });
        }
        const nuevoCorrelativo = branch.ultimo_correlativo + 1;

        await tx
          .update(branchTable)
          .set({ ultimo_correlativo: nuevoCorrelativo })
          .where(eq(branchTable.id, sucursalId));

        let totalCalculado = 0;
        for (const equipo of input.equipos) {
          for (const item of equipo.detalle) {
            totalCalculado += item.precio_unitario * item.cantidad;
          }
        }
        if (input.detalle_suelto) {
          for (const item of input.detalle_suelto) {
            totalCalculado += item.precio_unitario * item.cantidad;
          }
        }
        if (input.cliente_id) {
          const [cliente] = await tx
            .select()
            .from(clientTable)
            .where(eq(clientTable.id, input.cliente_id));
          if (!cliente) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "El cliente no existe",
            });
          }
        }
        const [orden] = await tx
          .insert(orderTable)
          .values({
            sucursal_id: sucursalId,
            correlativo: nuevoCorrelativo,
            cliente_id: input.cliente_id ?? null,
            user_id: ctx.user.id,
            estado: "EMITIDA",
            total: totalCalculado.toString(),
            observaciones: input.observaciones ?? null,
          })
          .returning();
        for (const equipo of input.equipos) {
          const [device] = await tx
            .insert(deviceTable)
            .values({
              order_id: orden.id,
              tipo_equipo: equipo.tipo_equipo,
              descripcion: equipo.descripcion,
              observaciones: equipo.observaciones ?? null,
            })
            .returning();
          for (const item of equipo.detalle) {
            let nombreSnapshot =
              item.nombre_personalizado ?? "Item personalizado";
            let itemIdFinal: number | null = null;

            if (item.item_id) {
              const [catalogItem] = await tx
                .select()
                .from(catalogTable)
                .where(eq(catalogTable.id, item.item_id));
              if (!catalogItem) {
                throw new TRPCError({
                  code: "BAD_REQUEST",
                  message: `El item con ID ${item.item_id} no existe en el Catalogo`,
                });
              }
              if (!catalogItem.isActive) {
                throw new TRPCError({
                  code: "BAD_REQUEST",
                  message: `El item ${catalogItem.nombre} esta desactivado del catalogo`,
                });
              }
              ((nombreSnapshot = catalogItem.nombre),
                (itemIdFinal = catalogItem.id));
            }
            await tx.insert(orderDetailTable).values({
              order_id: orden.id,
              equipo_id: device.id,
              item_id: itemIdFinal,
              nombre_snap: nombreSnapshot,
              precio_unit_snap: item.precio_unitario.toString(),
              cantidad: item.cantidad,
              subtotal: (item.precio_unitario * item.cantidad).toString(),
            });
          }
        }
        if (input.detalle_suelto) {
          for (const item of input.detalle_suelto) {
            let nombreSnapshot =
              item.nombre_personalizado ?? "Item personalizado";
            let itemIdFinal: number | null = null;

            if (item.item_id) {
              const [catalogItem] = await tx
                .select()
                .from(catalogTable)
                .where(eq(catalogTable.id, item.item_id));
              if (!catalogItem) {
                throw new TRPCError({
                  code: "BAD_REQUEST",
                  message: `El item con el ID ${item.item_id} no existe en el catalogo`,
                });
              }
              if (!catalogItem.isActive) {
                throw new TRPCError({
                  code: "BAD_REQUEST",
                  message: `El item: ${catalogItem.nombre} esta desactivado del Catalogo`,
                });
              }
              ((nombreSnapshot = catalogItem.nombre),
                (itemIdFinal = catalogItem.id));
            }
            await tx.insert(orderDetailTable).values({
              order_id: orden.id,
              equipo_id: null,
              item_id: itemIdFinal,
              nombre_snap: nombreSnapshot,
              precio_unit_snap: item.precio_unitario.toString(),
              cantidad: item.cantidad,
              subtotal: (item.precio_unitario * item.cantidad).toString(),
            });
          }
        }
        return orden;
      });
      return result;
    }),
  list: authedProcedure
    .input(listOrdersSchema)
    .query(async ({ ctx, input }) => {
      const { estado, cliente_id, fecha_desde, fecha_hasta, limit, offset } =
        input ?? { limit: 20, offset: 0 };
      const conditions = [];

      if (estado) {
        conditions.push(eq(orderTable.estado, estado));
      }
      if (cliente_id) {
        conditions.push(eq(orderTable.cliente_id, cliente_id));
      }
      if (fecha_desde) {
        conditions.push(gte(orderTable.fecha_emision, new Date(fecha_desde)));
      }
      if (fecha_hasta) {
        conditions.push(lte(orderTable.fecha_emision, new Date(fecha_hasta)));
      }
      if (conditions.length > 0) {
        return await ctx.db
          .select()
          .from(orderTable)
          .where(and(...conditions))
          .orderBy(desc(orderTable.fecha_emision))
          .limit(limit)
          .offset(offset);
      } else {
        return await ctx.db
          .select()
          .from(orderTable)
          .orderBy(desc(orderTable.fecha_emision))
          .limit(limit)
          .offset(offset);
      }
    }),
  getById: authedProcedure
    .input(getOrderByIdSchema)
    .query(async ({ ctx, input }) => {
      const [orden] = await ctx.db
        .select()
        .from(orderTable)
        .where(eq(orderTable.id, input.id));
      if (!orden) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Orden no encontrada",
        });
      }
      let cliente = null;
      if (orden.cliente_id) {
        const [c] = await ctx.db
          .select()
          .from(clientTable)
          .where(eq(clientTable.id, orden.cliente_id));
        cliente = c ?? null;
      }
      const equipos = await ctx.db
        .select()
        .from(deviceTable)
        .where(eq(deviceTable.order_id, orden.id));
      const detalles = await ctx.db
        .select()
        .from(orderDetailTable)
        .where(eq(orderDetailTable.order_id, orden.id));
      const equiposConDetalle = equipos.map((equipo) => ({
        ...equipo,
        detalle: detalles.filter((d) => d.equipo_id === equipo.id),
      }));
      const detalleSuelto = detalles.filter((d) => d.equipo_id === null);
      return {
        ...orden,
        cliente,
        equipos: equiposConDetalle,
        detalle_suelto: detalleSuelto,
      };
    }),
  anular: adminProcedure
    .input(anularOrderSchema)
    .mutation(async ({ ctx, input }) => {
      const [orden] = await ctx.db
        .select()
        .from(orderTable)
        .where(eq(orderTable.id, input.id));
      if (!orden) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Orden Inexistente",
        });
      }
      if (orden.estado === "ANULADA") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "La orden ya esta anulada",
        });
      }
      const [ordenAnulada] = await ctx.db
        .update(orderTable)
        .set({
          estado: "ANULADA",
          fecha_anul: new Date(),
          user_anul: ctx.user.id,
          motivo_anul: input.motivo,
        })
        .where(eq(orderTable.id, orden.id))
        .returning();
      return ordenAnulada;
    }),
});
