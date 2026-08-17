import { renderToStream } from "@react-pdf/renderer";
import {
  getDb,
  orderTable,
  clientTable,
  branchTable,
  deviceTable,
  orderDetailTable,
  eq,
} from "@central-pc/database";
import { OrderPdfTemplate } from "./templates/orderTemplate.js";

const db = getDb();

export async function generateOrderPdfStream(orderId: number) {
  const orderData = await db
    .select()
    .from(orderTable)
    .where(eq(orderTable.id, orderId))
    .limit(1);
  if (!orderData.length) {
    throw new Error(`La orden con con ID ${orderId} no existe`);
  }
  const order = orderData[0];

  const [clientData, branchData, devicesData, detailsData] = await Promise.all([
    order.cliente_id
      ? db
          .select()
          .from(clientTable)
          .where(eq(clientTable.id, order.cliente_id))
          .limit(1)
      : Promise.resolve([]),
    db
      .select()
      .from(branchTable)
      .where(eq(branchTable.id, order.sucursal_id))
      .limit(1),
    db.select().from(deviceTable).where(eq(deviceTable.order_id, orderId)),
    db
      .select()
      .from(orderDetailTable)
      .where(eq(orderDetailTable.order_id, orderId)),
  ]);

  const fullOrder = {
    ...order,
    client: clientData[0] || null,
    branch: branchData[0] || null,
    devices: devicesData,
    details: detailsData,
  };

  const pdfStream = await renderToStream(
    <OrderPdfTemplate order={fullOrder} />,
  );

  return {
    stream: pdfStream,
    correlativo: order.correlativo,
  };
}
