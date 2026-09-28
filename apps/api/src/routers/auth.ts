import {
  router,
  publicProcedure,
  authedProcedure,
} from "../procedures/index.js";
import { registerSchema, loginSchema } from "@central-pc/schemas";

export const authRouter = router({
  register: publicProcedure
    .input(registerSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.auth.login.execute(input);
    }),
  login: publicProcedure.input(loginSchema).mutation(async ({ ctx, input }) => {
    return await ctx.services.auth.login.execute(input);
  }),
  me: authedProcedure.query(async ({ ctx }) => {
    return {
      id: ctx.user.id,
      nombre: ctx.user.nombre,
      rol: ctx.user.rol,
    };
  }),
});
