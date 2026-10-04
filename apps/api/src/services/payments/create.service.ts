import { CreatePaymentInput } from "@central-pc/schemas";
import { orderTable, eq, sql, paymentTable, and } from "@central-pc/database";
import { Database } from "../types.js";
import { BadRequestError, NotFoundError } from "../../errors/domain.errors.js";

export class CreatePaymentService {
  constructor(private db: Database) {}

  async execute(input: CreatePaymentInput) {
    const result = await this.db.transaction(async (tx) => {
      const [orden] = await tx
        .select()
        .from(orderTable)
        .where(eq(orderTable.id, input.order_id))
        .for("update");

      if (!orden) {
        throw new NotFoundError("Orden no Encontrada");
      }
      if (orden.estado === "ANULADA") {
        throw new BadRequestError(
          "No se pueden registrar pagos en una orden Anulada",
        );
      }

      const pagosExistentes = await tx
        .select({ totalPagado: sql`sum(${paymentTable.monto})` })
        .from(paymentTable)
        .where(
          and(
            eq(paymentTable.order_id, input.order_id),
            eq(paymentTable.estado, "ACTIVO"),
          ),
        );
      const totalPagado = Number(pagosExistentes[0]?.totalPagado ?? 0);
      const nuevoTotal = totalPagado + input.monto;

      const nuevoTotalCents = Math.round(nuevoTotal * 100);
      const totalOrdenCents = Math.round(Number(orden.total) * 100);

      if (nuevoTotalCents > totalOrdenCents) {
        const restanteCents = totalOrdenCents - Math.round(totalPagado * 100);
        const restante = Math.max(0, restanteCents / 100);
        throw new BadRequestError(
          `El pago excede el total de la orden. El restante por pagar es: S/.${restante.toFixed(2)}`,
        );
      }

      const [pago] = await tx
        .insert(paymentTable)
        .values({
          order_id: input.order_id,
          metodo: input.metodo,
          monto: input.monto.toString(),
          fecha_pago: input.fecha_pago
            ? new Date(input.fecha_pago)
            : new Date(),
          estado: "ACTIVO",
        })
        .returning();

      return pago;
    });

    return result;
  }
}
