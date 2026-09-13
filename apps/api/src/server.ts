import dotenv from "dotenv";
import fastify from "fastify";
import { fastifyTRPCPlugin } from "@trpc/server/adapters/fastify";
import SuperJSON from "superjson";
import fastifyCors from "@fastify/cors";
import fastifyHelmet from "@fastify/helmet";
import fastifyJwt from "@fastify/jwt";
import { appRouter } from "./routers/_app.js";
import { createContext } from "./context.js";
import { pdfRoutes } from "./routes/pdf.routes.js";

dotenv.config();

const app = fastify({
  logger: {
    level: "info",
    transport: {
      target: "pino-pretty",
      options: {
        translateTime: "SYS:standard",
        ignore: "pid,hostname",
      },
    },
    redact: ["req.headers.authorization", "body.password"],
  },
});

async function main() {
  await app.register(fastifyHelmet, {
    contentSecurityPolicy: false, // Allows flexible API & PDF rendering
  });

  const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim())
    : ["http://localhost:5173", "http://localhost:3000"];

  await app.register(fastifyCors, {
    origin: allowedOrigins,
    credentials: true,
  });

  await app.register(fastifyJwt, {
    secret: process.env.JWT_SECRET || "fraseSuperSecretaDeJWT",
  });

  await app.register(fastifyTRPCPlugin, {
    prefix: "trpc/",
    trpcOptions: {
      router: appRouter,
      createContext,
      transformer: SuperJSON,
    },
  });

  await app.register(pdfRoutes);

  const PORT = Number(process.env.SERVER_PORT);

  await app.listen({ port: PORT, host: "0.0.0.0" });

  app.log.info(`Server running on port: ${PORT}`);
}

main().catch((e) => {
  app.log.error(e);
  process.exit(1);
});
