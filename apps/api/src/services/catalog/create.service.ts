import { catalogTable, eq, and } from "@central-pc/database";
import { CreateItemInput } from "@central-pc/schemas";
import type { Database } from "../types.js";
import { ConflictError } from "../../errors/domain.errors.js";

export class CreateCatalogService {
  constructor(private db: Database) {}

  async execute(input: CreateItemInput) {
    const existingItem = await this.db
      .select()
      .from(catalogTable)
      .where(
        and(
          eq(catalogTable.nombre, input.nombre),
          eq(catalogTable.tipo_item, input.tipo),
        ),
      );

    if (existingItem.length > 0) {
      throw new ConflictError("El item ya Existe");
    }
    const [newItem] = await this.db
      .insert(catalogTable)
      .values({
        nombre: input.nombre,
        precio_ref: input.precio_referencial,
        tipo_item: input.tipo,
      })
      .returning();
    return newItem;
  }
}
