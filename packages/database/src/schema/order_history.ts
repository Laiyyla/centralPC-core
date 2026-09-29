import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { orderTable } from "./orders.js";
import { usersTable } from "./users.js";

export const orderHistoryTable = pgTable("order_history", {
  id: serial().primaryKey(),
  order_id: integer()
    .references(() => orderTable.id)
    .notNull(),
  user_id: integer()
    .references(() => usersTable.id)
    .notNull(),
  accion: text("accion").notNull(),
  estado_anterior: text("estado_anterior"),
  estado_nuevo: text("estado_nuevo"),
  notas: text("notas"),
  fecha_registro: timestamp("fecha_registro").defaultNow().notNull(),
});
