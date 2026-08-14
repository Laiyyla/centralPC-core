import { router } from "../procedures/public.js";
import { authRouter } from "./auth.js";
import { clientsRouter } from "./clients.js";
import { catalogRouter } from "./catalog.js";
import { ordersRouter } from "./orders.js";
import { paymentsRouter } from "./payments.js";
export const appRouter = router({
  auth: authRouter,
  clients: clientsRouter,
  catalog: catalogRouter,
  orders: ordersRouter,
  payments: paymentsRouter,
});

export type AppRouter = typeof appRouter;
