import type { ServiceContext } from "./types.js";
import { AuthServices } from "./auth/index.js";
import { CatalogServices } from "./catalog/index.js";
import { ClientServices } from "./clients/index.js";
import { OrderServices } from "./orders/index.js";
import { PaymentsServices } from "./payments/index.js";

export class AppServices {
  readonly auth: AuthServices;
  readonly catalog: CatalogServices;
  readonly clients: ClientServices;
  readonly orders: OrderServices;
  readonly payments: PaymentsServices;

  constructor(ctx: ServiceContext) {
    this.auth = new AuthServices(ctx);
    this.catalog = new CatalogServices(ctx);
    this.clients = new ClientServices(ctx);
    this.orders = new OrderServices(ctx);
    this.payments = new PaymentsServices(ctx);
  }
}

export function createServices(ctx: ServiceContext): AppServices {
  return new AppServices(ctx);
}

export * from "./types.js";
