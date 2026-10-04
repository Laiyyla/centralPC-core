import type { ServiceContext } from "../types.js";
import { CreateOrderService } from "./create.service.js";
import { ListOrdersService } from "./list.service.js";
import { GetOrderByIdService } from "./getById.service.js";
import { AnularOrderService } from "./anular.service.js";
import { UpdateOrderService } from "./update.service.js";
import { ChangeOrderStatusService } from "./changeStatus.service.js";
import { AssignTechnicianService } from "./assignTechnician.service.js";

export class OrderServices {
  readonly create: CreateOrderService;
  readonly list: ListOrdersService;
  readonly getById: GetOrderByIdService;
  readonly anular: AnularOrderService;
  readonly update: UpdateOrderService;
  readonly changeStatus: ChangeOrderStatusService;
  readonly assignTechnician: AssignTechnicianService;

  constructor(ctx: ServiceContext) {
    this.create = new CreateOrderService(ctx.db);
    this.list = new ListOrdersService(ctx.db);
    this.getById = new GetOrderByIdService(ctx.db);
    this.anular = new AnularOrderService(ctx.db);
    this.update = new UpdateOrderService(ctx.db);
    this.changeStatus = new ChangeOrderStatusService(ctx.db);
    this.assignTechnician = new AssignTechnicianService(ctx.db);
  }
}
