import { FastifyInstance } from "fastify";
import { generateOrderPdfStream } from "../services/pdf/order-pdf.service.js";

export async function pdfRoutes(fastify: FastifyInstance) {
  fastify.get("/api/orders/:id/pdf", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const queryToken = (req.query as { token?: string }).token;

      const token = authHeader?.startsWith("Bearer ")
        ? authHeader.substring(7)
        : queryToken;

      if (!token) {
        res
          .status(401)
          .send({ error: "No autorizado: Inicia sesion Porfavor" });
      }

      await fastify.jwt.verify(token);

      const { id } = req.params as { id: number };
      const { stream, correlativo } = await generateOrderPdfStream(id);

      res.raw.setHeader("Content-Type", "application/pdf");
      res.raw.setHeader(
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
