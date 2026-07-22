import dotenv from "dotenv";
import fastify from "fastify";
import { fastifyTRPCPlugin } from "@trpc/server/adapters/fastify";
import SuperJSON from "superjson";
import fastifyCors from "@fastify/cors";
import fastifyJwt from "@fastify/jwt";
import { appRouter } from "./routers/_app.js";
import { createContext } from "./context.js";

dotenv.config();

const app = fastify({
  logger: true,
});

async function main() {
  await app.register(fastifyCors, {
    origin: "http://localhost:5173", //NO SE SI CAMBIAR 127.0.0.0 por localhost quizá
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

  const PORT = Number(process.env.SERVER_PORT);

  await app.listen({ port: PORT, host: "0.0.0.0" });

  app.log.info(`Server running on port: ${PORT}`);
}

main().catch((e) => {
  app.log.error(e);
  process.exit(1);
});
