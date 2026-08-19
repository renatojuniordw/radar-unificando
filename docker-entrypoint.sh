#!/bin/sh
set -e

# Aplica apenas migrations versionadas (seguro em produção). `db push --accept-data-loss`
# permite remover colunas/tabelas não previstas e pode causar perda irreversível de dados
# se o schema mudar inadvertidamente (relatório item 4.8).
echo "[entrypoint] Aplicando migrations do Prisma (migrate deploy)..."
if [ -f "./node_modules/.bin/prisma" ]; then
  ./node_modules/.bin/prisma migrate deploy
fi

# Garante o usuário admin a partir de ADMIN_EMAIL/ADMIN_PASSWORD do .env.
# Idempotente: cria se não existir; se existir, garante apenas role='admin'
# (nunca sobrescreve a senha trocada pelo app); avisa e pula se as variáveis
# não estiverem definidas.
echo "[entrypoint] Garantindo usuário admin (seed)..."
if [ -f "./node_modules/.bin/tsx" ]; then
  ./node_modules/.bin/tsx prisma/seed.ts
fi

exec "$@"
