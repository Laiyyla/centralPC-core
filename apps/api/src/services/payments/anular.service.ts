import { AnularPagoInput } from "@central-pc/schemas";
import { paymentTable, eq } from "@central-pc/database";
import { Database } from "../types.js";
import { BadRequestError, NotFoundError } from "../../errors/domain.errors.js";

interface AnularPagoContext {
  userId: number;
}

export class AnularPagoService {
  constructor(private db: Database) {}

  async execute(input: AnularPagoInput, ctx: AnularPagoContext) {
    const [pago] = await this.db
      .select()
      .from(paymentTable)
      .where(eq(paymentTable.id, input.id));
    if (!pago) {
      throw new NotFoundError("Pago no Encontrado");
    }
    if (pago.estado === "ANULADO") {
      throw new BadRequestError("El pago especificado ya fue anulado");
    }
    const [pagoActualizado] = await this.db
      .update(paymentTable)
      .set({
        estado: "ANULADO",
        fecha_anulacion: new Date(),
        motivo_anulacion: input.motivo,
        usuario_anulacion_id: ctx.userId,
      })
      .where(eq(paymentTable.id, input.id))
      .returning();

    return pagoActualizado;
  }
}
