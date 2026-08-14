#!/bin/sh
set -e

# Aplica apenas migrations versionadas (seguro em produção). `db push --accept-data-loss`
# permite remover colunas/tabelas não previstas e pode causar perda irreversível de dados
# se o schema mudar inadvertidamente (relatório item 4.8).
echo "[entrypoint] Aplicando migrations do Prisma (migrate deploy)..."
if [ -f "./node_modules/.bin/prisma" ]; then
  ./node_modules/.bin/prisma migrate deploy
fi

exec "$@"
