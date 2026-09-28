import { CreateOrderInput } from "@central-pc/schemas";
import type { Database } from "../types.js";
import {
  BadRequestError,
  DomainError,
  NotFoundError,
} from "../../errors/domain.errors.js";
import {
  catalogTable,
  orderTable,
  branchTable,
  orderDetailTable,
  clientTable,
  deviceTable,
  eq,
  inArray,
} from "@central-pc/database";

export class CreateOrderService {
  constructor(private db: Database) {}

  async execute(input: CreateOrderInput) {
    const sucursalId = Number(process.env.SUCURSAL_ID);
    if (!sucursalId) {
      throw new DomainError("Sucursal no configurada");
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

    const result = await this.db.transaction(async (tx) => {
      // Pre-cargar todos los ítems del catálogo en una sola consulta
      const catalogItems =
        catalogItemIds.length > 0
          ? await tx
              .select()
              .from(catalogTable)
              .where(inArray(catalogTable.id, catalogItemIds))
          : [];

      const catalogMap = new Map(catalogItems.map((item) => [item.id, item]));

      // Validar existencia y estado activo de todos los ítems solicitados
      for (const itemId of catalogItemIds) {
        const catalogItem = catalogMap.get(itemId);
        if (!catalogItem) {
          throw new BadRequestError(
            `El item con ID ${itemId} no existe en el Catalogo`,
          );
        }
        if (!catalogItem.isActive) {
          throw new BadRequestError(
            `El item ${catalogItem.nombre} esta desactivado del catalogo`,
          );
        }
      }

      const [branch] = await tx
        .select()
        .from(branchTable)
        .where(eq(branchTable.id, sucursalId))
        .for("update");
      if (!branch) {
        throw new NotFoundError("Sucursal no Encontrada");
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
          throw new NotFoundError("El cliente no existe");
        }
      }
      const [orden] = await tx
        .insert(orderTable)
        .values({
          sucursal_id: sucursalId,
          correlativo: nuevoCorrelativo,
          cliente_id: input.cliente_id ?? null,
          user_id: this.user?.id,
          estado: "RECEPCIONADA",
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

        const deviceDetailsToInsert = equipo.detalle.map((item) => {
          let nombreSnapshot =
            item.nombre_personalizado ?? "Item personalizado";
          let itemIdFinal: number | null = null;

          if (item.item_id) {
            const catalogItem = catalogMap.get(item.item_id)!;
            nombreSnapshot = catalogItem.nombre;
            itemIdFinal = catalogItem.id;
          }

          return {
            order_id: orden.id,
            equipo_id: device.id,
            item_id: itemIdFinal,
            nombre_snap: nombreSnapshot,
            precio_unit_snap: item.precio_unitario.toString(),
            cantidad: item.cantidad,
            subtotal: (item.precio_unitario * item.cantidad).toString(),
          };
        });

        if (deviceDetailsToInsert.length > 0) {
          await tx.insert(orderDetailTable).values(deviceDetailsToInsert);
        }
      }

      if (input.detalle_suelto && input.detalle_suelto.length > 0) {
        const looseDetailsToInsert = input.detalle_suelto.map((item) => {
          let nombreSnapshot =
            item.nombre_personalizado ?? "Item personalizado";
          let itemIdFinal: number | null = null;

          if (item.item_id) {
            const catalogItem = catalogMap.get(item.item_id)!;
            nombreSnapshot = catalogItem.nombre;
            itemIdFinal = catalogItem.id;
          }

          return {
            order_id: orden.id,
            equipo_id: null,
            item_id: itemIdFinal,
            nombre_snap: nombreSnapshot,
            precio_unit_snap: item.precio_unitario.toString(),
            cantidad: item.cantidad,
            subtotal: (item.precio_unitario * item.cantidad).toString(),
          };
        });

        await tx.insert(orderDetailTable).values(looseDetailsToInsert);
      }
      return orden;
    });
    return result;
  }
}
