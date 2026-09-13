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
  const order = await db.query.orderTable.findFirst({
    where: eq(orderTable.id, orderId),
    with: {
      client: true,
      branch: true,
      devices: true,
      details: true,
    },
  });

  if (!order) {
    throw new Error(`La orden con con ID ${orderId} no existe`);
  }

  const { client, branch, devices, details, ...orderData } = order;

  const fullOrder = {
    ...orderData,
    client: client || null,
    branch: branch || null,
    devices,
    details,
  };

  const pdfStream = await renderToStream(
    <OrderPdfTemplate order={fullOrder} />,
  );

  return {
    stream: pdfStream,
    correlativo: order.correlativo,
  };
}
