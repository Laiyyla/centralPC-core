import { GetPagoByIdInput } from "@central-pc/schemas";
import { paymentTable, eq } from "@central-pc/database";
import { Database } from "../types.js";

export class ListPaymentByOrderService {
  constructor(private db: Database) {}
  async execute(input: GetPagoByIdInput) {
    const pagos = await this.db
      .select()
      .from(paymentTable)
      .where(eq(paymentTable.order_id, input.order_id));
    return pagos;
  }
}
