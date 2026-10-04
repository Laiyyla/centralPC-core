import { UpdateOrderInput } from "@central-pc/schemas";
import type { Database } from "../types.js";
import {
  BadRequestError,
  NotFoundError,
} from "../../errors/domain.errors.js";
import {
  catalogTable,
  orderTable,
  orderDetailTable,
  deviceTable,
  orderHistoryTable,
  eq,
  inArray,
} from "@central-pc/database";

interface UpdateOrderContext {
  userId: number;
  userRole?: string;
}

export class UpdateOrderService {
  constructor(private db: Database) {}

  async execute(input: UpdateOrderInput, ctx: UpdateOrderContext) {
    const orden = await this.db.query.orderTable.findFirst({
      where: eq(orderTable.id, input.id),
    });

    if (!orden) {
      throw new NotFoundError("Orden no encontrada");
    }

    const isAdmin = ctx.userRole === "admin";
    const isEncargado = orden.encargado_id === ctx.userId;
    if (!isAdmin && !isEncargado) {
      throw new BadRequestError(
        "Solo el técnico asignado o un administrador pueden editar esta orden",
      );
    }

    const estadosEditables = [
      "RECEPCIONADA",
      "EN_DIAGNOSTICO",
      "ESPERANDO_APROBACION",
      "EN_REPARACION",
    ];

    if (!estadosEditables.includes(orden.estado)) {
      throw new BadRequestError(
        `La orden en estado ${orden.estado} no permite edición`,
      );
    }


    // Recopilar todos los IDs del catálogo requeridos
    const catalogItemIds: number[] = [];
    for (const equipo of input.equipos) {
      for (const item of equipo.detalle) {
        if (item.item_id) catalogItemIds.push(item.item_id);
      }
    }
    if (input.detalle_suelto) {
      for (const item of input.detalle_suelto) {
        if (item.item_id) catalogItemIds.push(item.item_id);
      }
    }

    return await this.db.transaction(async (tx) => {
      // Pre-cargar ítems del catálogo
      const catalogItems =
        catalogItemIds.length > 0
          ? await tx
              .select()
              .from(catalogTable)
              .where(inArray(catalogTable.id, catalogItemIds))
          : [];

      const catalogMap = new Map(catalogItems.map((item) => [item.id, item]));

      // Validar existencia y estado activo de ítems
      for (const itemId of catalogItemIds) {
        const catalogItem = catalogMap.get(itemId);
        if (!catalogItem) {
          throw new BadRequestError(
            `El item con ID ${itemId} no existe en el Catálogo`,
          );
        }
        if (!catalogItem.isActive) {
          throw new BadRequestError(
            `El item ${catalogItem.nombre} está desactivado en el catálogo`,
          );
        }
      }

      // Calcular nuevo total
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

      // Actualizar datos generales de la orden
      await tx
        .update(orderTable)
        .set({
          observaciones: input.observaciones ?? orden.observaciones,
          total: totalCalculado.toFixed(2),
        })
        .where(eq(orderTable.id, orden.id));

      // Eliminar detalles previos y equipos previos
      await tx
        .delete(orderDetailTable)
        .where(eq(orderDetailTable.order_id, orden.id));
      await tx
        .delete(deviceTable)
        .where(eq(deviceTable.order_id, orden.id));

      // Insertar nuevos equipos y sus detalles
      for (const equipoData of input.equipos) {
        const [nuevoEquipo] = await tx
          .insert(deviceTable)
          .values({
            order_id: orden.id,
            tipo_equipo: equipoData.tipo_equipo,
            descripcion: equipoData.descripcion,
            observaciones: equipoData.observaciones,
          })
          .returning();

        for (const item of equipoData.detalle) {
          const catalogItem = item.item_id ? catalogMap.get(item.item_id) : null;
          await tx.insert(orderDetailTable).values({
            order_id: orden.id,
            equipo_id: nuevoEquipo.id,
            item_id: item.item_id ?? null,
            nombre_snap:
              item.nombre_personalizado ?? catalogItem?.nombre ?? "Item personalizado",
            cantidad: item.cantidad,
            precio_unit_snap: item.precio_unitario.toFixed(2),
            subtotal: (item.precio_unitario * item.cantidad).toFixed(2),
          });
        }
      }

      // Insertar detalle suelto si existe
      if (input.detalle_suelto) {
        for (const item of input.detalle_suelto) {
          const catalogItem = item.item_id ? catalogMap.get(item.item_id) : null;
          await tx.insert(orderDetailTable).values({
            order_id: orden.id,
            equipo_id: null,
            item_id: item.item_id ?? null,
            nombre_snap:
              item.nombre_personalizado ?? catalogItem?.nombre ?? "Item personalizado",
            cantidad: item.cantidad,
            precio_unit_snap: item.precio_unitario.toFixed(2),
            subtotal: (item.precio_unitario * item.cantidad).toFixed(2),
          });
        }
      }


      // Registrar auditoría de edición
      await tx.insert(orderHistoryTable).values({
        order_id: orden.id,
        user_id: ctx.userId,
        accion: "EDICION_DETALLE",
        estado_anterior: orden.estado,
        estado_nuevo: orden.estado,
        notas: input.observaciones ?? "Edición de equipos y detalles de la orden",
      });

      return { id: orden.id, total: totalCalculado };
    });
  }
}
