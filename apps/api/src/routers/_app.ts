import { router } from "../procedures/public.js";
import { authRouter } from "./auth.js";
import { clientsRouter } from "./clients.js";


export const appRouter = router({
  auth: authRouter,
  clients: clientsRouter
})

export type AppRouter = typeof appRouter;
