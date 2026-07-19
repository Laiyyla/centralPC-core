import { pgTable, serial, integer, varchar, decimal } from "drizzle-orm/pg-core";
import { deviceTable } from "./devices.js";
import { orderTable } from "./orders.js";
import { catalogTable } from "./catalog.js"

export const orderDetailTable = pgTable('order_detail', {
  id: serial().primaryKey(),
  order_id: integer().references(()=>orderTable.id).notNull(),
  equipo_id: integer().references(() => deviceTable.id),
  item_id: integer().references(() => catalogTable.id),
  nombre_snap: varchar({ length: 255 }).notNull(),
  precio_unit_snap: decimal({ precision: 10, scale: 2 }).notNull(),
  cantidad: integer().notNull(),
  subtotal: decimal({precision:10, scale:2}).notNull()
})
