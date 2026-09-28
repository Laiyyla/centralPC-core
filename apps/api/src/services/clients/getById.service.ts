import { GetClientByIdInput } from "@central-pc/schemas";
import type { Database } from "../types.js";
import { clientTable, eq } from "@central-pc/database";
import { NotFoundError } from "../../errors/domain.errors.js";

export class GetClientByIdService {
  constructor(private db: Database) {}

  async execute(input: GetClientByIdInput) {
    const client = await this.db.query.clientTable.findFirst({
      where: eq(clientTable.id, input.id),
      // No se me ocurre el como capturar en una constante el cliente que esta buscando y luego pasarlo por el handler de errores
      //CORRECION, GUARDA LAS COSAS EN VARIABLES PARA LUEGO USARLAS, NO TE LIMITES EN RAZONAMIENTO
      with: {
        orders: true,
      },
    });

    if (!client) {
      throw new NotFoundError("Cliente no Encontrado");
    }

    return client;
  }
}
