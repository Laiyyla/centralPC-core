import {
  pgTable,
  serial,
  varchar,
  boolean,
  integer,
} from "drizzle-orm/pg-core";

export const branchTable = pgTable("branches", {
  id: serial("id").primaryKey(),
  nombre: varchar({ length: 100 }).notNull(),
  serie: varchar({ length: 4 }).unique().notNull(),
  RUC: varchar({ length: 11 }).notNull(),
  ultimo_correlativo: integer().notNull().default(0),
  isActive: boolean().notNull().default(true),
});
