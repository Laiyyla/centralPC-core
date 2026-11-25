-- Constraint unique para evitar duplicados concurrentes en catálogo
ALTER TABLE "catalog_items"
  ADD CONSTRAINT "uq_catalog_nombre_tipo" UNIQUE ("nombre", "tipo_item");

-- Extensión pg_trgm para índices de búsqueda parcial
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Índice GIN para búsqueda ILIKE con wildcard en nombre normalizado
CREATE INDEX "idx_catalog_nombre_trgm"
  ON "catalog_items" USING GIN (
    translate(lower("nombre"), 'áéíóúàèìòùäëïöüñÁÉÍÓÚÑ', 'aeiouaeiouaeiounAEIOUN') gin_trgm_ops
  );
