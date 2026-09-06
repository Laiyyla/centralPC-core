import {
  pgTable,
  serial,
  integer,
  varchar,
  decimal,
  index,
} from "drizzle-orm/pg-core";
import { deviceTable } from "./devices.js";
import { orderTable } from "./orders.js";
import { catalogTable } from "./catalog.js";

export const orderDetailTable = pgTable("order_detail", {
  id: serial().primaryKey(),
  order_id: integer()
    .references(() => orderTable.id, { onDelete: "cascade" })
    .notNull(),
  equipo_id: integer().references(() => deviceTable.id),
  item_id: integer().references(() => catalogTable.id),
  nombre_snap: varchar({ length: 255 }).notNull(),
  precio_unit_snap: decimal({ precision: 10, scale: 2 }).notNull(),
  cantidad: integer().notNull(),
  subtotal: decimal({ precision: 10, scale: 2 }).notNull(),
}, (table) => [
  index("idx_order_detail_order_id").on(table.order_id),
  index("idx_order_detail_equipo_id").on(table.equipo_id),
  index("idx_order_detail_item_id").on(table.item_id),
]);

