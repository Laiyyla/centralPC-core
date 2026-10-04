import type { ServiceContext } from "../types.js";
import { AnularPagoService } from "./anular.service.js";
import { CreatePaymentService } from "./create.service.js";
import { ListPaymentByOrderService } from "./listByOrder.service.js";

export class PaymentsServices {
  readonly create: CreatePaymentService;
  readonly listByOrder: ListPaymentByOrderService;
  readonly anular: AnularPagoService;

  constructor(ctx: ServiceContext) {
    this.create = new CreatePaymentService(ctx.db);
    this.listByOrder = new ListPaymentByOrderService(ctx.db);
    this.anular = new AnularPagoService(ctx.db);
  }
}
