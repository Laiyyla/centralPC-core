-- packages/database/src/migrations/002_add_indexes.sql

-- Índices para clients
CREATE INDEX IF NOT EXISTS idx_clients_telefono ON clients(telefono);
CREATE INDEX IF NOT EXISTS idx_clients_dni ON clients(dni);

-- Índices para orders
CREATE INDEX IF NOT EXISTS idx_orders_cliente_id ON orders(cliente_id);
CREATE INDEX IF NOT EXISTS idx_orders_fecha_emision ON orders(fecha_emision);
CREATE INDEX IF NOT EXISTS idx_orders_estado ON orders(estado);
CREATE INDEX IF NOT EXISTS idx_orders_sucursal_id ON orders(sucursal_id);

-- Índices para payments
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);

-- Índices para catalog
CREATE INDEX IF NOT EXISTS idx_catalog_tipo_item ON catalog_items(tipo_item);
CREATE INDEX IF NOT EXISTS idx_catalog_is_active ON catalog_items(isActive);
