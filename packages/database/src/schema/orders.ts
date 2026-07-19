import { pgTable, integer, serial, text, pgEnum, decimal, timestamp } from "drizzle-orm/pg-core";
import { branchTable } from "./branches.js";
import { clientTable } from "./clients.js"
import {usersTable} from "./users.js"

export const estadoEnum = pgEnum('order_status', ['EMITIDA', "ANULADA"]);

export const orderTable = pgTable('orders', {
  id: serial().primaryKey(),
  sucursal_id: integer().references(() => branchTable.id).notNull(),
  correlativo: integer().notNull(),
  cliente_id: integer().references(() => clientTable.id),
  user_id: integer().references(() => usersTable.id).notNull(),
  fecha_emision: timestamp('fecha_emision').notNull().defaultNow(),
  estado: estadoEnum().notNull(),
  total: decimal('total', { precision: 10, scale: 2 }).notNull(),
  fecha_anul: timestamp('fecha_anulacion'),
  user_anul: integer().references(() => usersTable.id),
  motivo_anul: text('motivo_anulacion'),
  observaciones: text('observaciones')
})
