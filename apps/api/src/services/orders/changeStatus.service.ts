import { ChangeOrderStatusInput } from "@central-pc/schemas";
import type { Database } from "../types.js";
import { orderTable, orderHistoryTable, eq } from "@central-pc/database";
import { BadRequestError, NotFoundError } from "../../errors/domain.errors.js";

interface ChangeStatusContext {
  userId: number;
  userRole?: string;
}

export class ChangeOrderStatusService {
  constructor(private db: Database) {}

  async execute(input: ChangeOrderStatusInput, ctx: ChangeStatusContext) {
    const [orden] = await this.db
      .select()
      .from(orderTable)
      .where(eq(orderTable.id, input.id));

    if (!orden) {
      throw new NotFoundError("Orden no encontrada");
    }

    const isAdmin = ctx.userRole === "admin";
    const isEncargado = orden.encargado_id === ctx.userId;
    if (!isAdmin && !isEncargado) {
      throw new BadRequestError(
        "Solo el técnico asignado o un administrador pueden cambiar el estado de esta orden",
      );
    }

    if (orden.estado === "ANULADA") {
      throw new BadRequestError("No se puede cambiar el estado de una orden anulada");
    }


    if (orden.estado === input.estado) {
      return orden;
    }

    return await this.db.transaction(async (tx) => {
      const [ordenActualizada] = await tx
        .update(orderTable)
        .set({
          estado: input.estado,
        })
        .where(eq(orderTable.id, orden.id))
        .returning();

      await tx.insert(orderHistoryTable).values({
        order_id: orden.id,
        user_id: ctx.userId,
        accion: "CAMBIO_ESTADO",
        estado_anterior: orden.estado,
        estado_nuevo: input.estado,
        notas: input.notas ?? `Estado actualizado a ${input.estado}`,
      });

      return ordenActualizada;
    });
  }
}
