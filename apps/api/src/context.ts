import type { CreateFastifyContextOptions } from "@trpc/server/adapters/fastify";
import "@fastify/jwt";
import "@fastify/cookie";

import { getDb } from "@central-pc/database";
import type { roleEnum } from "@central-pc/database";
import { createServices } from "./services/index.js";

type UserPayload = {
  id: number;
  nombre: string;
  rol: (typeof roleEnum.enumValues)[number]; //no se como colocarle el enum de los roles que estableci
  //Correccion: importa el tipo desde el workspace, joder ts lo es todo
};

export async function createContext({ req, res }: CreateFastifyContextOptions) {
  const authHeader = req.headers["authorization"];
  let token: string | undefined = req.cookies?.token;

  if (!token && authHeader && typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
    token = authHeader.slice(7);
  }

  let user: UserPayload | null = null;

  if (token) {
    try {
      const payload = await req.jwtVerify({ onlyCookie: false });
      user = payload as UserPayload;
    } catch {
      user = null;
    }
  }
  const db = getDb();

  const services = createServices({ db, req, res });

  return {
    db,
    user,
    req,
    res,
    services,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
