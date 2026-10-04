import { anularOrdenInput } from "@central-pc/schemas";
import type { Database } from "../types.js";
import { orderTable, eq } from "@central-pc/database";
import { BadRequestError, NotFoundError } from "../../errors/domain.errors.js";

interface AnularOrderContext {
  userId: number;
}

export class AnularOrderService {
  constructor(private db: Database) {}

  async execute(input: anularOrdenInput, ctx: AnularOrderContext) {
    const [orden] = await this.db
      .select()
      .from(orderTable)
      .where(eq(orderTable.id, input.id));
    if (!orden) {
      throw new NotFoundError("Orden Inexistente");
    }
    if (orden.estado === "ANULADA") {
      throw new BadRequestError("La orden ya esta anulada");
    }
    const [ordenAnulada] = await this.db
      .update(orderTable)
      .set({
        estado: "ANULADA",
        fecha_anul: new Date(),
        user_anul: ctx.userId,
        motivo_anul: input.motivo,
      })
      .where(eq(orderTable.id, orden.id))
      .returning();
    return ordenAnulada;
  }
}
