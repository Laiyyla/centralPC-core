import { catalogTable, inArray, combo_components } from "@central-pc/database";
import type { Database } from "../types.js";
import { CreateComboInput } from "@central-pc/schemas";
import { BadRequestError, NotFoundError } from "../../errors/domain.errors.js";

export class CreateComboService {
  constructor(private db: Database) {}

  async execute(input: CreateComboInput) {
    const componentesMap = new Map<number, number>();

    for (const c of input.componentes) {
      const actual = componentesMap.get(c.componente_item_id) ?? 0;
      componentesMap.set(c.componente_item_id, actual + c.cantidad);
    }
    const componentesConsolidados = Array.from(componentesMap.entries()).map(
      ([componente_item_id, cantidad]) => ({ componente_item_id, cantidad }),
    );
    const compIds = componentesConsolidados.map((c) => c.componente_item_id);

    const result = await this.db.transaction(async (tx) => {
      const catalogItems =
        compIds.length > 0
          ? await tx
              .select()
              .from(catalogTable)
              .where(inArray(catalogTable.id, compIds))
          : [];

      const catalogItemsMap = new Map(
        catalogItems.map((item) => [item.id, item]),
      );

      for (const c of componentesConsolidados) {
        const item = catalogItemsMap.get(c.componente_item_id);
        if (!item) {
          throw new NotFoundError(
            `Componente con el ID ${c.componente_item_id} no encontrado en el catalogo`,
          );
        }
        if (item.tipo_item === "combo") {
          throw new BadRequestError(
            `No se pueden anidar combos, el item "${item.nombre}" es un combo`,
          );
        }
      }

      const [combo] = await tx
        .insert(catalogTable)
        .values({
          nombre: input.nombre,
          precio_ref: input.precio_referencial.toString(),
          tipo_item: "combo",
          isActive: true,
        })
        .returning();

      if (componentesConsolidados.length > 0) {
        await tx.insert(combo_components).values(
          componentesConsolidados.map((c) => ({
            combo_id: combo.id,
            comp_id: c.componente_item_id,
            cantidad: c.cantidad,
          })),
        );
      }

      return combo;
    });
    return result;
  }
}
