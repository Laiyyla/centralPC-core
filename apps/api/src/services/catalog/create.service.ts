import { catalogTable } from "@central-pc/database";
import { CreateItemInput } from "@central-pc/schemas";
import type { Database } from "../types.js";
import { ConflictError } from "../../errors/domain.errors.js";

export class CreateCatalogService {
  constructor(private db: Database) {}

  async execute(input: CreateItemInput) {
    const [result] = await this.db
      .insert(catalogTable)
      .values({
        nombre: input.nombre,
        precio_ref: input.precio_referencial,
        tipo_item: input.tipo,
      })
      .onConflictDoNothing({
        target: [catalogTable.nombre, catalogTable.tipo_item],
      })
      .returning();

    if (!result) {
      throw new ConflictError("Ya existe un ítem con ese nombre y tipo");
    }

    return result;
  }
}
