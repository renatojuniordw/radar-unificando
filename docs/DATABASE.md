# Database — Radar Unificando v2

## PostgreSQL 16 via Drizzle ORM

### Schema (8 tabelas)

| Tabela | Descrição |
|--------|-----------|
| users | id, email, passwordHash, name, createdAt |
| sessions | id, userId, expiresAt (Auth.js) |
| profiles | id, userId, skills[], experience, seniority, resumeText |
| jobs | id, userId, source, empresa, titulo, link, descricao, skillsRequired |
| match_scores | id, userId, jobId, score, breakdown JSON, createdAt |
| applications | id, userId, jobId, stage, notes, createdAt |
| new_companies | id, userId, nome, totalVagas, url (InHire discovery) |
| pipeline_runs | id, userId, status, stats |

### Migrations

```bash
npm run db:generate   # Gera migration
npm run db:push       # Aplica ao banco
npm run db:studio     # Drizzle Studio (GUI)
```

### Seed

`src/lib/infrastructure/db/seed.ts` contém dados iniciais para desenvolvimento.
