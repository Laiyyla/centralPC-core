import { CreateClientInput } from "@central-pc/schemas";
import type { Database } from "../types.js";
import { clientTable } from "@central-pc/database";

export class CreateClientService {
  constructor(private db: Database) {}

  async execute(input: CreateClientInput) {
    const [newClient] = await this.db
      .insert(clientTable)
      .values({
        nombre: input.nombre,
        telefono: input.telefono,
        dni: input.dni || null,
        ruc: input.ruc || null,
      })
      .returning();
    return newClient;
  }
}
