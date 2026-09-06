import { pgTable, varchar, serial, pgEnum, boolean, index } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("user_role", ["admin", "tecnico", "cajero"]);

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  nombre: varchar({ length: 255 }).notNull(),
  user_name: varchar({ length: 100 }).unique().notNull(),
  password_hash: varchar({ length: 255 }).notNull(),
  rol: roleEnum().notNull(),
  isActive: boolean().notNull().default(true),
}, (table) => [
  index("idx_users_is_active").on(table.isActive),
]);

