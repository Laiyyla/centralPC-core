import { catalogTable, eq } from "@central-pc/database";
import { UpdateItemInput } from "@central-pc/schemas";
import type { Database } from "../types.js";

export class UpdateCatalogService {
  constructor(private db: Database) {}

  async execute(input: UpdateItemInput) {
    const updateData: Record<string, any> = {};
    if (input.nombre !== undefined) updateData.nombre = input.nombre;
    if (input.precio_referencial !== undefined)
      updateData.precio_ref = input.precio_referencial;
    if (input.activo !== undefined) updateData.isActive = input.activo;
    const [updatedItem] = await this.db
      .update(catalogTable)
      .set(updateData)
      .where(eq(catalogTable.id, input.id))
      .returning();
    return updatedItem;
  }
}
