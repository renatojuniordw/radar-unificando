# Database — Radar Unificando v2

## PostgreSQL + Prisma ORM

### Schema (12 models)

| Model | Tabela | Descrição |
|-------|--------|-----------|
| User | `users` | id, email, passwordHash, name, createdAt |
| Session | `sessions` | id, userId, expiresAt, createdAt |
| Profile | `profiles` | id, userId, skills, experienceYears, seniority, currentRole, area, education, resumeText, resumeMarkdown, parsedData, profileSource |
| Job | `jobs` | id, userId, source, empresa, plataforma, naLista, cargoCategoria, tituloVaga, tipo, local, link, nomeNaPlataforma, publicado, descricao, skillsRequired, score, alerta, detectadoEm |
| Chat | `chats` | id, userId, externalId, title, createdAt, updatedAt |
| ChatMessage | `chat_messages` | id, chatId, position, role, content, createdAt |
| GeneratedContentCache | `generated_content_cache` | id, userId, jobId, kind, cacheKey, content, createdAt, expiresAt |
| Application | `applications` | id, userId, jobId, stage, score, breakdown, notes, createdAt |
| ApplicationLog | `application_logs` | id, applicationId, userId, fromStage, toStage, createdAt |
| NewCompany | `new_companies` | id, userId, nome, totalVagas, urlCarreiras, createdAt |
| PipelineRun | `pipeline_runs` | id, userId, status, totalJobs, gupyJobs, inhireJobs, newCompaniesFound, discoveryEnabled, startedAt, finishedAt |
| CompanyPresence | `company_presence` | id, userId, empresa, temGupy, paginaGupy, temInhire, paginaInhire, totalVagasInhire |

> ⚠️ `Application` e `ApplicationLog` existem **apenas no schema** — não há API nem UI
> (kanban de candidaturas ficou no plano, não foi implementado).

### Comandos

```bash
npm run db:migrate   # Rodar migrations
npm run db:seed      # Popular dados iniciais
npm run db:studio    # Prisma Studio (GUI)
npm run db:generate  # Gerar Prisma Client
```

### Schema

Definido em `prisma/schema.prisma`.
