# Contribuindo — Radar Unificando v2

## Setup Dev

```bash
# 1. Clone
git clone git@github.com:renatojuniordw/radar-unificando.git
cd radar-unificando

# 2. Env
cp .env.example .env
# Preencha DATABASE_URL e AUTH_SECRET (e EXTENSION_ORIGIN se for usar a extensão Chrome)

# 3. Instalar
npm install

# 4. Banco
npx prisma migrate dev
npx prisma db seed

# 5. Rodar
npm run dev
```

> **Portas locais (Docker):** app `11010`, PostgreSQL `11011`, Redis `11012` — ajuste `DATABASE_URL` no `.env` conforme a porta do postgres.
> **Build sem derrubar o dev:** `NEXT_DIST_DIR=.next-check npm run build` (o `next build` padrão compartilha o `.next` com o dev e corrompe o cache).

## Branch Strategy

```
main ← feat/*  (ex.: feat/radar-unificando-extension)
```

Toda feature nova começa com um branch `feat/*` a partir de `main` e volta via PR.

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Dev server |
| `npm run build` | Build produção |
| `npm run lint` | Lint (ESLint flat config — `eslint.config.mjs`) |
| `npm run test` | Suíte Vitest (unit/integration) |
| `npm run test:e2e` | Playwright (spec em `e2e/`) |
| `npm run test:coverage` | Cobertura Vitest |
| `npm run db:migrate` | Migrations Prisma |
| `npm run db:seed` | Seed dados iniciais |
| `npm run db:studio` | Prisma Studio (GUI) |

## PR Template

- Título descritivo (ex: "feat: adiciona upload de currículo")
- Descrição do que foi feito
- Screenshots se aplicável
- Checklist de verificação
