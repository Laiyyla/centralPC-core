import { SearchClientInput } from "@central-pc/schemas";
import type { Database } from "../types.js";
import { clientTable, or, ilike } from "@central-pc/database";

export class SearchClientService {
  constructor(private db: Database) {}

  async execute(input: SearchClientInput) {
    const sanitizedQuery = input.query.replace(/[%_\\]/g, "\\$&");
    const clients = await this.db
      .select()
      .from(clientTable)
      .where(
        or(
          ilike(clientTable.nombre, `%${sanitizedQuery}%`),
          ilike(clientTable.telefono, `%${sanitizedQuery}%`),
        ),
      )
      .limit(input.limit);

    return clients;
  }
}
