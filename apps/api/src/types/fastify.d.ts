import "@fastify/jwt";

declare module "fastify" {
  interface FastifyRequest {
    jwtVerify(): Promise<unknown>;
  }
  interface FastifyReply{
    jwtSign(payload: unknown, options ?: unknown): Promise<string>
  }
}
