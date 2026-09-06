import { pgTable, varchar, serial, index } from "drizzle-orm/pg-core";

export const clientTable = pgTable("clients", {
  id: serial("id").primaryKey(),
  nombre: varchar({ length: 255 }).notNull(),
  telefono: varchar({ length: 20 }).notNull(),
  dni: varchar({ length: 8 }),
  ruc: varchar({ length: 11 }),
}, (table) => [
  index("idx_clients_telefono").on(table.telefono),
  index("idx_clients_dni").on(table.dni),
  index("idx_clients_ruc").on(table.ruc),
]);

