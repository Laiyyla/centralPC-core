import { pgTable, serial, integer, index, uniqueIndex } from "drizzle-orm/pg-core";
import { catalogTable } from "./catalog.js";

export const combo_components = pgTable("combo_comp", {
  id: serial().primaryKey(),
  combo_id: integer("combo_id")
    .notNull()
    .references(() => catalogTable.id, { onDelete: "cascade" }),
  comp_id: integer("comp_id")
    .notNull()
    .references(() => catalogTable.id, { onDelete: "cascade" }),
  cantidad: integer().notNull(),
}, (table) => [
  index("idx_combo_comp_combo_id").on(table.combo_id),
  index("idx_combo_comp_comp_id").on(table.comp_id),
  uniqueIndex("unique_combo_component").on(table.combo_id, table.comp_id),
]);

