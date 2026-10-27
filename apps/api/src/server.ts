import fastify from "fastify";
import { fastifyTRPCPlugin } from "@trpc/server/adapters/fastify";
import SuperJSON from "superjson";
import fastifyCors from "@fastify/cors";
import fastifyHelmet from "@fastify/helmet";
import fastifyJwt from "@fastify/jwt";
import fastifyCookie from "@fastify/cookie";
import { appRouter } from "./routers/_app.js";
import { createContext } from "./context.js";
import { pdfRoutes } from "./routes/pdf.routes.js";
import { env } from "./env.js";

const app = fastify({
  logger: {
    level: "info",
    ...(env.NODE_ENV !== "production" && {
      transport: {
        target: "pino-pretty",
        options: {
          translateTime: "SYS:standard",
          ignore: "pid,hostname",
        },
      },
    }),
    redact: [
      "req.headers.authorization",
      "req.headers.cookie",
      "body.password",
    ],
  },
});

async function main() {
  await app.register(fastifyHelmet, {
    contentSecurityPolicy: false, // Allows flexible API & PDF rendering
  });

  const allowedOrigins = env.CORS_ORIGIN;

  await app.register(fastifyCors, {
    origin: allowedOrigins,
    credentials: true,
  });

  await app.register(fastifyCookie, {
    secret: env.COOKIE_SECRET,
  });

  await app.register(fastifyJwt, {
    secret: env.JWT_SECRET,
    cookie: {
      cookieName: "token",
      signed: false,
    },
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

  app.get("/health", async () => ({ status: "ok" }));

  const PORT = Number(env.SERVER_PORT);

  await app.listen({ port: PORT, host: "0.0.0.0" });

  app.log.info(`Server running on port: ${PORT}`);
}

main().catch((e) => {
  app.log.error(e);
  process.exit(1);
});
