import { renderToStream } from "@react-pdf/renderer";
import {
  getDb,
  eq,
  orderTable,
  branchTable,
  clientTable,
  deviceTable,
  orderDetailTable,
} from "@central-pc/database";
import { OrderPdfTemplate } from "./templates/orderTemplate.js";
import { detalleItemSchema } from "@central-pc/schemas";

const db = getDb();

export async function generateOrderPdfStream(orderId: number) {
  const orderData = await db.query.orderTable.findFirst({
    where: eq(orderTable.id, orderId),
    with: {
      branchTable: true,
      clientTable: true,
      deviceTable: true,
      detalleItemSchema: true,
      orderDetailTable: true,
    },
  });
  if (!orderData) {
    throw new Error(`La orden con el ID ${orderId} no existe`);
  }
}
