import {
  pgTable,
  integer,
  serial,
  text,
  pgEnum,
  decimal,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { branchTable } from "./branches.js";
import { clientTable } from "./clients.js";
import { usersTable } from "./users.js";

export const estadoEnum = pgEnum("order_status", ["EMITIDA", "ANULADA"]);

export const orderTable = pgTable("orders", {
  id: serial().primaryKey(),
  sucursal_id: integer()
    .references(() => branchTable.id)
    .notNull(),
  correlativo: integer().notNull(),
  cliente_id: integer().references(() => clientTable.id),
  user_id: integer()
    .references(() => usersTable.id)
    .notNull(),
  fecha_emision: timestamp("fecha_emision").notNull().defaultNow(),
  estado: estadoEnum().notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  fecha_anul: timestamp("fecha_anulacion"),
  user_anul: integer().references(() => usersTable.id),
  motivo_anul: text("motivo_anulacion"),
  observaciones: text("observaciones"),
}, (table) => [
  index("idx_orders_cliente_id").on(table.cliente_id),
  index("idx_orders_fecha_emision").on(table.fecha_emision),
  index("idx_orders_estado").on(table.estado),
  index("idx_orders_sucursal_id").on(table.sucursal_id),
  index("idx_orders_user_id").on(table.user_id),
  uniqueIndex("unique_sucursal_correlativo").on(table.sucursal_id, table.correlativo),
]);

