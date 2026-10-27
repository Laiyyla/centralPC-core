#!/bin/sh
set -e

echo "==> Running database migrations..."
pnpm --filter @central-pc/database db:migrate

echo "==> Migrations completed successfully. Starting application..."
exec "$@"
