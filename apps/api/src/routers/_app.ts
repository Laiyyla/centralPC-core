import { router } from "../procedures/public.js";
import { authRouter } from "./auth.js";
import { clientsRouter } from "./clients.js";
import { catalogRouter } from "./catalog.js";

export const appRouter = router({
  auth: authRouter,
  clients: clientsRouter,
  catalog: catalogRouter,
});

export type AppRouter = typeof appRouter;
