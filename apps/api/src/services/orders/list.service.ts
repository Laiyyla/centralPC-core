import { ListOrdersInput } from "@central-pc/schemas";
import {
  orderTable,
  eq,
  and,
  gte,
  lte,
  isNull,
} from "@central-pc/database";
import type { Database } from "../types.js";

export class ListOrdersService {
  constructor(private db: Database) {}

  async execute(input: ListOrdersInput) {
    const {
      estado,
      cliente_id,
      encargado_id,
      solo_sin_asignar,
      fecha_desde,
      fecha_hasta,
      limit = 20,
      offset = 0,
    } = input ?? { limit: 20, offset: 0 };

    const conditions = [];

    if (estado) {
      conditions.push(eq(orderTable.estado, estado));
    }
    if (cliente_id) {
      conditions.push(eq(orderTable.cliente_id, cliente_id));
    }
    if (solo_sin_asignar) {
      conditions.push(isNull(orderTable.encargado_id));
    } else if (encargado_id) {
      conditions.push(eq(orderTable.encargado_id, encargado_id));
    }
    if (fecha_desde) {
      conditions.push(gte(orderTable.fecha_emision, new Date(fecha_desde)));
    }
    if (fecha_hasta) {
      conditions.push(lte(orderTable.fecha_emision, new Date(fecha_hasta)));
    }

    const orders = await this.db.query.orderTable.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: {
        client: {
          columns: {
            id: true,
            nombre: true,
            telefono: true,
          },
        },
        user: {
          columns: {
            id: true,
            nombre: true,
          },
        },
        encargado: {
          columns: {
            id: true,
            nombre: true,
          },
        },
      },
      orderBy: (orders, { desc }) => [desc(orders.fecha_emision)],
      limit,
      offset,
    });

    return orders.map((orden) => ({
      id: orden.id,
      correlativo: orden.correlativo,
      estado: orden.estado,
      fecha_emision: orden.fecha_emision,
      total: orden.total,
      observaciones: orden.observaciones,
      cliente: orden.client ?? null,
      usuario_creador: orden.user ?? null,
      encargado: orden.encargado ?? null,
    }));
  }
}
