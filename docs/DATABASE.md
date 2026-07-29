# Database — Radar Unificando v2

## PostgreSQL + Prisma ORM

### Schema (9 models)

| Model | Tabela | Descrição |
|-------|--------|-----------|
| User | `users` | id, email, passwordHash, name, createdAt |
| Session | `sessions` | id, userId, expiresAt |
| Profile | `profiles` | id, userId, skills[], experience, seniority, resumeText |
| Job | `jobs` | id, userId, source, empresa, titulo, link, score |
| Application | `applications` | id, userId, jobId, stage, score, breakdown |
| NewCompany | `new_companies` | id, userId, nome, totalVagas |
| PipelineRun | `pipeline_runs` | id, userId, status, stats |
| CompanyPresence | `company_presence` | id, userId, empresa, presenca gupy/inhire |

### Comandos

```bash
npm run db:migrate   # Rodar migrations
npm run db:seed      # Popular dados iniciais
npm run db:studio    # Prisma Studio (GUI)
npm run db:generate  # Gerar Prisma Client
```

### Schema

Definido em `prisma/schema.prisma`.
