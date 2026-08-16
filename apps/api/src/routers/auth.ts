import { TRPCError } from "@trpc/server";
import { router, publicProcedure } from "../procedures/public.js";
import { registerSchema, loginSchema } from "@central-pc/schemas";
import bcrypt from "bcrypt";

import { usersTable, eq } from "@central-pc/database";
import { authedProcedure } from "../procedures/authed.js";
import { checkRateLimit } from "../utils/rate-limites.js";

export const authRouter = router({
  register: publicProcedure
    .input(registerSchema)
    .mutation(async ({ ctx, input }) => {
      const existingUser = await ctx.db
        .select()
        .from(usersTable)
        .where(eq(usersTable.user_name, input.user_name));

      if (existingUser.length > 0) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "El nombre de usuario ya esta en uso",
        });
      }

      const hashedPassword = await bcrypt.hash(input.password, 10);

      const [newUser] = await ctx.db
        .insert(usersTable)
        .values({
          nombre: input.nombre,
          user_name: input.user_name,
          password_hash: hashedPassword,
          rol: input.rol,
        })
        .returning();
      const { password_hash, ...userWithoutPassword } = newUser;
      return userWithoutPassword;
    }),
  login: publicProcedure.input(loginSchema).mutation(async ({ ctx, input }) => {
    const identifier = input.user_name;
    const { allowed, remaining } = checkRateLimit(identifier);

    if (!allowed) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message:
          "Demasiados intentos fallidos, intente nuevamente en 15 minutos",
      });
    }

    const [user] = await ctx.db
      .select()
      .from(usersTable)
      .where(eq(usersTable.user_name, input.user_name));

    if (!user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Credenciales Invalidas",
      });
    }

    if (!user.isActive) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Usuario Desactivado",
      });
    }
    const isValid = await bcrypt.compare(input.password, user.password_hash);

    if (!isValid) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Credenciales Invalidas",
      });
    }

    const token = await ctx.res.jwtSign(
      {
        id: user.id,
        nombre: user.nombre,
        rol: user.rol,
      },
      { expiresIn: "7d" },
    );

    return {
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        rol: user.rol,
      },
    };
  }),
  me: authedProcedure.query(async ({ ctx }) => {
    return {
      id: ctx.user.id,
      nombre: ctx.user.nombre,
      rol: ctx.user.rol,
    };
  }),
});
