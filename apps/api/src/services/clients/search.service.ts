import { SearchClientInput } from "@central-pc/schemas";
import type { Database } from "../types.js";
import { clientTable, or, ilike, sql, TRANSLATE_FROM, TRANSLATE_TO } from "@central-pc/database";

export class SearchClientService {
  constructor(private db: Database) {}

  async execute(input: SearchClientInput) {
    const sanitizedQuery = input.query.replace(/[%_\\]/g, "\\$&");
    const normalizedQuery = sanitizedQuery
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase();
    const pattern = `%${normalizedQuery}%`;

    const clients = await this.db
      .select()
      .from(clientTable)
      .where(
        or(
          sql`translate(lower(${clientTable.nombre}), ${TRANSLATE_FROM}, ${TRANSLATE_TO}) ILIKE ${pattern}`,
          ilike(clientTable.telefono, `%${sanitizedQuery}%`),
          ilike(clientTable.dni, `%${sanitizedQuery}%`),
          ilike(clientTable.ruc, `%${sanitizedQuery}%`),
        ),
      )
      .limit(input.limit);

    return clients;
  }
}
