import { FastifyInstance } from "fastify";
import { generateOrderPdfStream } from "../services/pdf/order-pdf.service.js";

export async function pdfRoutes(fastify: FastifyInstance) {
  fastify.get<{ Params: { id: string } }>(
    "/api/orders/:id/pdf",
    {
      schema: {
        params: {
          type: "object",
          properties: {
            id: { type: "string", pattern: "^[0-9]+$" },
          },
          required: ["id"],
        },
      },
      preHandler: async (req, res) => {
        try {
          await req.jwtVerify({ onlyCookie: false });
        } catch {
          return res
            .status(401)
            .send({ error: "No autorizado: Token invalido o expirado" });
        }
      },
    },
    async (req, res) => {
      const orderId = Number(req.params.id);

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
    },
  );
}
