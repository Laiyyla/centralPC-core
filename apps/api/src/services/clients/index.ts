import type { ServiceContext } from "../types.js";
import { CreateClientService } from "./create.service.js";
import { GetClientByIdService } from "./getById.service.js";
import { ListClientService } from "./list.service.js";
import { SearchClientService } from "./search.service.js";

export class ClientServices {
  readonly create: CreateClientService;
  readonly list: ListClientService;
  readonly getById: GetClientByIdService;
  readonly search: SearchClientService;

  constructor(ctx: ServiceContext) {
    this.create = new CreateClientService(ctx.db);
    this.list = new ListClientService(ctx.db);
    this.getById = new GetClientByIdService(ctx.db);
    this.search = new SearchClientService(ctx.db);
  }
}
