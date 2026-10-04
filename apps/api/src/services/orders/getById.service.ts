import { GetOrderByIdInput } from "@central-pc/schemas";
import { orderTable, eq } from "@central-pc/database";
import type { Database } from "../types.js";
import { NotFoundError } from "../../errors/domain.errors.js";

export class GetOrderByIdService {
  constructor(private db: Database) {}

  async execute(input: GetOrderByIdInput) {
    const orden = await this.db.query.orderTable.findFirst({
      where: eq(orderTable.id, input.id),
      with: {
        client: true,
        user: {
          columns: {
            id: true,
            nombre: true,
            user_name: true,
            rol: true,
          },
        },
        encargado: {
          columns: {
            id: true,
            nombre: true,
            user_name: true,
            rol: true,
          },
        },
        devices: true,
        details: true,
        payments: true,
        history: {
          with: {
            user: {
              columns: {
                id: true,
                nombre: true,
                user_name: true,
                rol: true,
              },
            },
          },
          orderBy: (history, { desc }) => [desc(history.fecha_registro)],
        },
      },
    });

    if (!orden) {
      throw new NotFoundError("Orden no encontrada");
    }

    const { devices, details, client, user, encargado, history, ...orderData } = orden;

    const equiposConDetalle = devices.map((equipo) => ({
      ...equipo,
      detalle: details.filter((d) => d.equipo_id === equipo.id),
    }));
    const detalleSuelto = details.filter((d) => d.equipo_id === null);

    return {
      ...orderData,
      cliente: client ?? null,
      usuario_creador: user ?? null,
      encargado: encargado ?? null,
      equipos: equiposConDetalle,
      detalle_suelto: detalleSuelto,
      pagos: orden.payments,
      historial: history ?? [],
    };
  }
}
