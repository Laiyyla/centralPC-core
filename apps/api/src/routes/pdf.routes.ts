import { FastifyInstance } from "fastify";
import { generateOrderPdfStream } from "../services/pdf/order-pdf.service.js";

export async function pdfRoutes(fastify: FastifyInstance) {
  fastify.get("/api/orders/:id/pdf", async (req, res) => {
    const authHeader = req.headers.authorization;
    const queryToken = (req.query as { token?: string })?.token;

    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.substring(7)
      : queryToken;

    if (!token) {
      return res
        .status(401)
        .send({ error: "No autorizado: Inicia sesion Porfavor" });
    }

    try {
      await fastify.jwt.verify(token);
    } catch {
      return res
        .status(401)
        .send({ error: "No autorizado: Token invalido o expirado" });
    }

    const { id } = req.params as { id: string };
    const orderId = Number(id);
    if (isNaN(orderId)) {
      return res.status(400).send({ error: "ID de orden invalido" });
    }

    try {
      const { stream, correlativo } = await generateOrderPdfStream(orderId);

      res.header("Content-Type", "application/pdf");
      res.header(
        "Content-Disposition",
        `inline; filename="orden-${correlativo}.pdf"`,
      );
      return res.send(stream);
    } catch (e: any) {
      req.log.error(e);
      return res
        .status(400)
        .send({ error: e.message || "Error al generar el PDF" });
    }
  });
}
