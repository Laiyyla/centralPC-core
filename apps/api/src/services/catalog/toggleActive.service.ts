import { catalogTable, eq } from "@central-pc/database";
import { ToggleActiveInput } from "@central-pc/schemas";
import type { Database } from "../types.js";

export class ToggleActiveService {
  constructor(private db: Database) {}

  async execute(input: ToggleActiveInput) {
    const [toggledActive] = await this.db
      .update(catalogTable)
      .set({
        isActive: input.activo,
      })
      .where(eq(catalogTable.id, input.id))
      .returning();
    return toggledActive;
  }
}
