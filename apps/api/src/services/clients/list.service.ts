import { ListClientsInput } from "@central-pc/schemas";
import type { Database } from "../types.js";
import { clientTable } from "@central-pc/database";

export class ListClientService {
  constructor(private db: Database) {}

  async execute(input: ListClientsInput) {
    const { limit = 50, offset = 0 } = input ?? {};
    return await this.db.select().from(clientTable).limit(limit).offset(offset);
  }
}
