import { TRPCError } from "@trpc/server";
import { publicProcedure } from "./public.js";

export const authedProcedure = publicProcedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Unauthorized action, inicia sesion para poder continuar",
    });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});
