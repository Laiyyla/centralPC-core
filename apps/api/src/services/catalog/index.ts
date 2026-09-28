import type { ServiceContext } from "../types.js";
import { CreateCatalogService } from "./create.service.js";
import { ListCatalogService } from "./list.service.js";
import { GetByIdService } from "./getById.service.js";
import { UpdateCatalogService } from "./update.service.js";
import { ToggleActiveService } from "./toggleActive.service.js";
import { CreateComboService } from "./createCombo.service.js";

export class CatalogServices {
  readonly create: CreateCatalogService;
  readonly list: ListCatalogService;
  readonly getById: GetByIdService;
  readonly update: UpdateCatalogService;
  readonly toggleActive: ToggleActiveService;
  readonly createCombo: CreateComboService;

  constructor(ctx: ServiceContext) {
    this.create = new CreateCatalogService(ctx.db);
    this.list = new ListCatalogService(ctx.db);
    this.getById = new GetByIdService(ctx.db);
    this.update = new UpdateCatalogService(ctx.db);
    this.toggleActive = new ToggleActiveService(ctx.db);
    this.createCombo = new CreateComboService(ctx.db);
  }
}
