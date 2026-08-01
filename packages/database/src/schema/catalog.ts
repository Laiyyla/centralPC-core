import {
  pgTable,
  serial,
  varchar,
  decimal,
  pgEnum,
  boolean,
} from "drizzle-orm/pg-core";

export const catalogEnum = pgEnum("item_type", [
  "servicio",
  "producto",
  "combo",
]);

export const catalogTable = pgTable("catalog_items", {
  id: serial("id").primaryKey(),
  tipo_item: catalogEnum().notNull(),
  nombre: varchar({ length: 255 }).notNull(),
  precio_ref: decimal("precio_referencial", {
    precision: 10,
    scale: 2,
  }).notNull(),
  isActive: boolean().notNull().default(true),
});
