# Database — Radar Unificando v2

## PostgreSQL + Prisma ORM

> **Porta local (Docker):** PostgreSQL exposto em `127.0.0.1:11011` (Redis em `11012`, app em `11010`) — escolhidas para não conflitar com outros projetos na máquina. Ajuste `DATABASE_URL` no `.env` conforme a porta.

### Schema (17 models)

| Model | Tabela | Descrição |
|-------|--------|-----------|
| User | `users` | id, email, passwordHash, name, role (default `user`), lastLoginAt, resetTokenHash, resetTokenExpiresAt, createdAt |
| Profile | `profiles` | id, userId, skills, experienceYears, seniority, currentRole, area, education, resumeText, resumeMarkdown, parsedData, profileSource, resumeHash |
| Job | `jobs` | id, userId, source, company, platform, onList, roleCategory, title, type, location, link, companyNameOnPlatform, postedAt, description, skillsRequired, score, alert, detectedAt, status, lastCheckedAt |
| Chat | `chats` | id, userId, externalId, title, createdAt, updatedAt |
| ChatMessage | `chat_messages` | id, chatId, position, role, content, createdAt |
| ChatUsage | `chat_usage` | id, userId, chatId, promptTokens, completionTokens, totalTokens, ipHash, createdAt — medição de consumo de tokens do chat |
| GeneratedContentCache | `generated_content_cache` | id, userId, jobId, kind, cacheKey, content, createdAt, expiresAt |
| ExtensionToken | `extension_tokens` | id, userId, tokenHash (SHA-256), createdAt, lastUsedAt, revokedAt — autenticação da extensão Chrome |
| ExtensionFeedback | `extension_feedback` | id, userId, rating (bool), comment, createdAt — feedback de utilidade enviado pela extensão |
| Application | `applications` | id, userId, jobId, stage, score, breakdown, notes, createdAt |
| ApplicationLog | `application_logs` | id, applicationId, userId, fromStage, toStage, createdAt |
| NewCompany | `new_companies` | id, userId, name, totalJobs, careersUrl, createdAt |
| PipelineRun | `pipeline_runs` | id, userId (nullable — `null` para anônimos), status, totalJobs, gupyJobs, inhireJobs, newCompaniesFound, discoveryEnabled, startedAt, finishedAt |
| ChatToolCall | `chat_tool_calls` | id, userId, chatId?, toolName, createdAt — uso das ferramentas de IA do chat (métrica "ferramentas mais utilizadas") |
| CompanyPresence | `company_presence` | id, userId, company, hasGupy, gupyPage, hasInhire, inhirePage, totalInhireJobs |
| PublicJob | `public_jobs` | id, link (unique), source, company, platform, roleCategory, title, type, location, postedAt, description, status, detectedAt, lastCheckedAt, expiresAt (TTL 7 dias), createdAt — pool público de vagas que alimenta as páginas SEO `/vagas` |
| CourseClick | `course_clicks` | id, userId?, courseId, skill?, platform?, origin, url?, ipHash, createdAt — tracking de cliques em cursos de afiliado |

> ⚠️ `Application` e `ApplicationLog` existem **apenas no schema** — não há API nem UI
> (kanban de candidaturas ficou no plano, não foi implementado).
>
> ℹ️ O campo `PipelineRun.discoveryEnabled` é `true` para usuários logados por padrão
> (`pipeline-runner.ts`: `options.discoveryEnabled !== false && isLoggedIn`) — o
> discovery-step roda em toda execução logada.
>
> ℹ️ Desde o painel admin, **toda** execução de busca grava um `PipelineRun`
> (logada ou anônima; `userId` `null` para anônimos) — alimenta as métricas de buscas por dia.
> `User.lastLoginAt` é atualizado a cada login (via `userRepository.updateLastLogin`).

### Comandos

```bash
npm run db:migrate   # Rodar migrations
npm run db:seed      # Popular dados iniciais
npm run db:studio    # Prisma Studio (GUI)
npm run db:generate  # Gerar Prisma Client
```

### Schema

Definido em `prisma/schema.prisma`.
