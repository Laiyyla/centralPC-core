import { TRPCError } from "@trpc/server";
import { authedProcedure } from "./authed.js";

export const adminProcedure = authedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user.rol !== "admin") {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Acción no autorizada. Se requieren permisos de administrador",
    });
  }

  return next({
    ctx,
  });
});
