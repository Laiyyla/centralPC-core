import { pgTable, serial, integer } from "drizzle-orm/pg-core";
import { catalogTable } from "./catalog.js";

export const combo_components = pgTable('combo_comp', {
  id: serial().primaryKey(),
  combo_id: integer("combo_id").notNull().references(()=>catalogTable.id),
  comp_id: integer("comp_id").notNull().references(() => catalogTable.id),
  cantidad: integer().notNull()
})
