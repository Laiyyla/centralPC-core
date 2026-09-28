import { initTRPC, TRPCError } from "@trpc/server";
import type { Context } from "../context.js";
import {
  DomainError,
  NotFoundError,
  BadRequestError,
  ConflictError,
  ForbiddenError,
  TooManyRequestsError,
  UnauthorizedError,
} from "../errors/domain.errors.js";
import SuperJSON from "superjson";

const t = initTRPC.context<Context>().create({
  transformer: SuperJSON,
});

const errorHandlingMiddleware = t.middleware(async ({ next }) => {
  const result = await next();

  if (!result.ok) {
    const error = result.error.cause;

    if (error instanceof UnauthorizedError) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: error.message });
    }
    if (error instanceof ConflictError) {
      throw new TRPCError({ code: "CONFLICT", message: error.message });
    }
    if (error instanceof NotFoundError) {
      throw new TRPCError({ code: "NOT_FOUND", message: error.message });
    }
    if (error instanceof TooManyRequestsError) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: error.message,
      });
    }
    if (error instanceof ForbiddenError) {
      throw new TRPCError({ code: "FORBIDDEN", message: error.message });
    }
    if (error instanceof BadRequestError) {
      throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
    }

    // Si es un error no controlado de dominio o desconocido
    if (error instanceof DomainError) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error.message,
      });
    }
  }

  return result;
});

const baseProcedure = t.procedure.use(errorHandlingMiddleware);

export const publicProcedure = baseProcedure;

const isAuthedMiddleware = t.middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new UnauthorizedError(
      "No estás autenticado para realizar esta acción",
    );
  }

  return next({
    ctx: {
      user: ctx.user,
    },
  });
});

export const authedProcedure = baseProcedure.use(isAuthedMiddleware);

const isAdminMiddleware = t.middleware(async ({ ctx, next }) => {
  if (ctx.user?.rol !== "admin") {
    throw new ForbiddenError(
      "No tienes permisos de administrador para realizar esta acción",
    );
  }

  return next();
});

export const adminProcedure = authedProcedure.use(isAdminMiddleware);

export const router = t.router;
