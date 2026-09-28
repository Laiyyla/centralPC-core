import { catalogTable, eq } from "@central-pc/database";
import { GetByIdInput } from "@central-pc/schemas";
import type { Database } from "../types.js";
import { NotFoundError } from "../../errors/domain.errors.js";

export class GetByIdService {
  constructor(private db: Database) {}

  async execute(input: GetByIdInput) {
    const [item] = await this.db
      .select()
      .from(catalogTable)
      .where(eq(catalogTable.id, input.id));
    if (!item) {
      throw new NotFoundError("Item no Encontrado");
    }
    return item;
  }
}
