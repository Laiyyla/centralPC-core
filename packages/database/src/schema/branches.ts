import { pgTable, serial, varchar, boolean } from "drizzle-orm/pg-core";

export const branchTable = pgTable('branches', {
  id: serial('id').primaryKey(),
  nombre: varchar({ length: 100 }).notNull(),
  serie: varchar({ length: 4}).unique().notNull(),
  RUC: varchar({ length: 11 }).notNull(),
  isActive: boolean().notNull().default(true)
})
