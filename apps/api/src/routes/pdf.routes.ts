import { FastifyInstance } from "fastify";
import { generateOrderPdfStream } from "../services/pdf/order-pdf.service.js";

export async function pdfRoutes(fastify: FastifyInstance) {
  fastify.get("/api/orders/:id/pdf", async (req, res) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .send({ error: "No autorizado: Inicia sesion Porfavor" });
    }

    const token = authHeader.substring(7);

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
