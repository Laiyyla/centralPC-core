import { pgTable, varchar, serial } from "drizzle-orm/pg-core";

export const clientTable = pgTable("clients", {
  id: serial("id").primaryKey(),
  nombre: varchar({ length: 255 }).notNull(),
  telefono: varchar({ length: 20 }).notNull(),
  dni: varchar({ length: 8 }),
  ruc: varchar({ length: 11 }),
});
