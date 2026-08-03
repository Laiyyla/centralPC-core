import { router } from "../procedures/public.js";
import { authedProcedure } from "../procedures/authed.js";
import {
  createOrderSchema,
  listOrdersSchema,
} from "../schemas/order.schema.js";
import {
  orderTable,
  deviceTable,
  orderDetailTable,
  branchTable,
  catalogTable,
  eq,
  clientTable,
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
        try {
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
              if (item.item_id) {
                const [catalogItem] = await tx
                  .select()
                  .from(catalogTable)
                  .where(eq(catalogTable.id, item.item_id));
                if (catalogItem) {
                  nombreSnapshot = catalogItem.nombre;
                }
              }
              await tx.insert(orderDetailTable).values({
                order_id: orden.id,
                equipo_id: device.id,
                item_id: item.item_id ?? null,
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
              if (item.item_id) {
                const [catalogItem] = await tx
                  .select()
                  .from(catalogTable)
                  .where(eq(catalogTable.id, item.item_id));
                if (catalogItem) {
                  nombreSnapshot = catalogItem.nombre;
                }
              }
              await tx.insert(orderDetailTable).values({
                order_id: orden.id,
                equipo_id: null,
                item_id: item.item_id ?? null,
                nombre_snap: nombreSnapshot,
                precio_unit_snap: item.precio_unitario.toString(),
                cantidad: item.cantidad,
                subtotal: (item.precio_unitario * item.cantidad).toString(),
              });
            }
          }
          return orden;
        } catch (e) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Error al crear la orden, ${e}`,
          });
        }
      });
      return result;
    }),
  list: authedProcedure
    .input(listOrdersSchema)
    .query(async ({ ctx, input }) => {
      const { estado, cliente_id, fecha_desde, fecha_hasta, limit, offset } =
        input ?? { limit: 20, offset: 0 };
    }),
});
