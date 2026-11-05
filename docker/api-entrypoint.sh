#!/bin/sh
set -e

echo "==> Waiting for database availability..."
MAX_TRIES=15
COUNT=0

while [ $COUNT -lt $MAX_TRIES ]; do
  if node -e "
    const u = new URL(process.env.DATABASE_URL);
    const s = require('net').connect({port: u.port || 5432, host: u.hostname});
    s.on('connect', function() { s.end(); process.exit(0); });
    s.on('error', function() { process.exit(1); });
    setTimeout(function() { process.exit(1); }, 2000);
  " 2>/dev/null; then
    break
  fi
  COUNT=$((COUNT + 1))
  echo "  Database not ready... retry $COUNT/$MAX_TRIES"
  sleep 2
done

if [ $COUNT -eq $MAX_TRIES ]; then
  echo "==> ERROR: Could not connect to database after $MAX_TRIES attempts."
  exit 1
fi

echo "==> Database ready. Running migrations..."
pnpm --filter @central-pc/database db:migrate

echo "==> Migrations complete. Starting server..."
exec "$@"
