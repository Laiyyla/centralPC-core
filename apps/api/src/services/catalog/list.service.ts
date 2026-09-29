import type { Database } from "../types.js";
import { ListItemsInput } from "@central-pc/schemas";
import { catalogTable, eq, and } from "@central-pc/database";

export class ListCatalogService {
  constructor(private db: Database) {}

  async execute(input: ListItemsInput) {
    const {
      tipo,
      includeInactive,
      limit = 50,
      offset = 0,
    } = input ?? {
      tipo: undefined,
      includeInactive: false,
      limit: 50,
      offset: 0,
    };
    const conditions = [];

    if (!includeInactive) {
      conditions.push(eq(catalogTable.isActive, true));
    }
    if (tipo) {
      conditions.push(eq(catalogTable.tipo_item, tipo));
    }
    const query = this.db
      .select()
      .from(catalogTable)
      .limit(limit)
      .offset(offset);

    if (conditions.length > 0) {
      return await query.where(and(...conditions));
    } else {
      return await query;
    }
  }
}
