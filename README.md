# Radar Unificando

> Busca automática de vagas 100% remotas em **Gupy** e **InHire** para cargos de Dados, BI, Business e Growth.

Projeto original: [busca-vagas-gupy-inhire](https://github.com/anomalyco/busca-vagas-gupy-inhire)
Reescrito para web por: [Renato Bezerra](https://renatobezerra.com.br/)
Licença: MIT

---

## Stack

| Categoria | Tecnologia |
|-----------|-----------|
| Framework | Next.js 15 (App Router) |
| UI | MUI 7 + Tailwind v4 |
| Banco | PostgreSQL via Prisma ORM |
| Auth | Auth.js v5 (JWT + bcrypt) |
| Scraper Gupy | MCP oficial + REST fallback |
| AI | Transformers.js (browser) |

## Como Rodar

**Pré-requisito:** Docker instalado.

```bash
# Setup inicial
cp .env.example .env
# Preencha DATABASE_URL e AUTH_SECRET

# Subir banco + app
docker compose up
```

Abra [http://localhost:11010](http://localhost:11010)

## Desenvolvimento

```bash
npm install
npm run dev
```

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Dev server |
| `npm run build` | Build produção |
| `npm run db:migrate` | Migrations Prisma |
| `npm run db:seed` | Seed dados iniciais |
| `npm run db:studio` | Prisma Studio |

## Estrutura

```
src/
  app/            → Páginas + API routes
  components/     → Componentes UI
  hooks/          → Custom hooks
    lib/
      core/         → Domínio (matching, pipeline, scrapers)
      infrastructure/ → Infra (db, ui, security, repositories)
    auth.ts         → NextAuth config
```

## Documentação

Veja `docs/` para documentação detalhada.

## Créditos

- [@anomalyco](https://github.com/anomalyco) — scraper original Node.js + PowerShell
- [Renato Bezerra](https://renatobezerra.com.br/) — reescrita para Next.js + web
