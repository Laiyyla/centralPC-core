import type { ServiceContext } from "./types.js";
import { AuthServices } from "./auth/index.js";
import { CatalogServices } from "./catalog/index.js";
import { ClientServices } from "./clients/index.js";
import { OrderServices } from "./orders/index.js";
import { PaymentsServices } from "./payments/index.js";

export class AppServices {
  private _auth?: AuthServices;
  private _catalog?: CatalogServices;
  private _clients?: ClientServices;
  private _orders?: OrderServices;
  private _payments?: PaymentsServices;

  constructor(private ctx: ServiceContext) {}

  get auth(): AuthServices {
    return (this._auth ??= new AuthServices(this.ctx));
  }

  get catalog(): CatalogServices {
    return (this._catalog ??= new CatalogServices(this.ctx));
  }

  get clients(): ClientServices {
    return (this._clients ??= new ClientServices(this.ctx));
  }

  get orders(): OrderServices {
    return (this._orders ??= new OrderServices(this.ctx));
  }

  get payments(): PaymentsServices {
    return (this._payments ??= new PaymentsServices(this.ctx));
  }
}

export function createServices(ctx: ServiceContext): AppServices {
  return new AppServices(ctx);
}

export * from "./types.js";
