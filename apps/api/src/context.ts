import type { CreateFastifyContextOptions } from "@trpc/server/adapters/fastify";

import { getDb } from "@central-pc/database";
import type { roleEnum } from "@central-pc/database";

type UserPayload = {
  id: number;
  nombre: string;
  rol: (typeof roleEnum.enumValues)[number]; //no se como colocarle el enum de los roles que estableci
  //Correccion: importa el tipo desde el workspace, joder ts lo es todo
};

export async function createContext({ req, res }: CreateFastifyContextOptions) {
  const authHeader = req.headers["authorization"];

  let user: UserPayload | null = null;

  if (
    authHeader &&
    typeof authHeader === "string" &&
    authHeader.startsWith("Bearer ")
  ) {
    const token = authHeader.slice(7); //aqui tampoco tengo idea de como hacerle
    //Correccion: Bearer con .slice de 7 ya que se coloca el espacio para que solo tome el token

    try {
      const payload = await req.jwtVerify();
      user = payload as UserPayload;
    } catch {
      user = null;
    }
  }

  return {
    db: getDb(),
    user,
    req,
    res,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
