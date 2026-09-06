import { pgTable, serial, pgEnum, text, integer, index } from "drizzle-orm/pg-core";
import { orderTable } from "./orders.js";

export const tipoEquipoEnum = pgEnum("device_type", [
  "PC",
  "LAPTOP",
  "IMPRESORA",
  "CELULAR",
  "OTROS",
]);

export const deviceTable = pgTable("devices", {
  id: serial().primaryKey(),
  order_id: integer()
    .references(() => orderTable.id, { onDelete: "cascade" })
    .notNull(),
  tipo_equipo: tipoEquipoEnum().notNull(),
  descripcion: text().notNull(),
  observaciones: text(),
}, (table) => [
  index("idx_devices_order_id").on(table.order_id),
  index("idx_devices_tipo_equipo").on(table.tipo_equipo),
]);

