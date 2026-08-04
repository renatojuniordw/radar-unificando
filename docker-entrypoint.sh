#!/bin/sh
set -e

echo "[entrypoint] Verificando e sincronizando esquema do banco de dados (Prisma db push)..."
if [ -f "./node_modules/.bin/prisma" ]; then
  ./node_modules/.bin/prisma db push --accept-data-loss || echo "[entrypoint] Prisma db push finalizado com aviso."
fi

exec "$@"
