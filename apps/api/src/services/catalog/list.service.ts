import type { Database } from "../types.js";
import { ListItemsInput } from "@central-pc/schemas";
import { catalogTable, eq, and, sql, TRANSLATE_FROM, TRANSLATE_TO } from "@central-pc/database";

export class ListCatalogService {
  constructor(private db: Database) {}

  async execute(input: ListItemsInput) {
    const {
      search,
      tipo,
      includeInactive,
      limit = 50,
      offset = 0,
    } = input ?? {
      search: undefined,
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
    if (search && search.trim()) {
      const sanitized = search.trim().replace(/[%_\\]/g, "\\$&");
      const normalized = sanitized
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();

      conditions.push(
        sql`translate(lower(${catalogTable.nombre}), ${TRANSLATE_FROM}, ${TRANSLATE_TO}) ILIKE ${`%${normalized}%`}`
      );
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
