import type { getDb } from "@central-pc/database";
import type { FastifyRequest, FastifyReply } from "fastify";

export type Database = ReturnType<typeof getDb>;

export interface ServiceContext {
  db: Database;
  req: FastifyRequest;
  res: FastifyReply;
}
