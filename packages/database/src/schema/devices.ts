import { pgTable, serial, pgEnum, text, integer } from "drizzle-orm/pg-core";
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
    .references(() => orderTable.id)
    .notNull(),
  tipo_equipo: tipoEquipoEnum().notNull(),
  descripcion: text().notNull(),
  observaciones: text(),
});
