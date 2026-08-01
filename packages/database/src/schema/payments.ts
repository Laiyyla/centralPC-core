import {
  pgTable,
  serial,
  integer,
  decimal,
  timestamp,
  pgEnum,
  text,
} from "drizzle-orm/pg-core";
import { orderTable } from "./orders.js";
import { usersTable } from "./users.js";

export const metodoPagoEnum = pgEnum("metodo_pago", [
  "efectivo",
  "yape",
  "plin",
  "tarjeta",
  "transferencia",
]);

export const estadoPagoEnum = pgEnum("estado_pago", ["ACTIVO", "ANULADO"]);

export const paymentTable = pgTable("payments", {
  id: serial().primaryKey(),
  order_id: integer()
    .references(() => orderTable.id)
    .notNull(),
  metodo: metodoPagoEnum().notNull(),
  monto: decimal({ precision: 10, scale: 2 }).notNull(),
  fecha_pago: timestamp().notNull().defaultNow(),
  estado: estadoPagoEnum().notNull().default("ACTIVO"),
  fecha_anulacion: timestamp(),
  usuario_anulacion_id: integer().references(() => usersTable.id),
  motivo_anulacion: text(),
});
