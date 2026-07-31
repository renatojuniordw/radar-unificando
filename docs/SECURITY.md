# Segurança — Radar Unificando v2

## Medidas Implementadas

| Medida | Implementação |
|--------|---------------|
| Security Headers | `next.config.ts` (HSTS, X-Frame-Options, etc.) |
| CORS | `middleware.ts` (Access-Control headers) |
| Rate Limiting | `src/lib/infrastructure/security/rate-limiter.ts` |
| Env Validation | `src/lib/infrastructure/security/env.ts` |
| Auth | Auth.js v5 com JWT + bcrypt (cost=12) |
| Docker | `no-new-privileges`, resource limits, non-root user |
| SQL Injection | Prevenido pelo Prisma ORM (queries parametrizadas) |
| Prompt Injection | `api/chat/route.ts` — sanitização de input + detecção de padrões + hardening do prompt |
| Validação de Tools | `chat-tools.ts` — Zod schema com limites de tamanho e regex |

## Rate Limits por Operação

| Operação | Janela | Limite | Chave |
|----------|--------|--------|-------|
| Pipeline | 5 min | 1 | user_id |
| Login | 1 min | 5 | IP |
| API geral | 1 min | 60 | IP |
| Upload currículo | 1 hora | 10 | user_id |
| Export CSV | 1 min | 10 | user_id |
| Chat | 1 min | 20 | user_id + IP |

## Proteção contra Prompt Injection

Aplicada no `POST /api/chat` (`src/app/api/chat/route.ts`):

1. **Sanitização de input**: mensagens truncadas em 2000 chars, tags HTML (`<>`) removidas
2. **Detecção de padrões suspeitos**: regex para tentativas de jailbreak (`ignore instructions`, `system prompt`, `reveal instructions`, `bypass rules`). Gera log `[AI_LOG] suspicious_activity`
3. **Hardening do system prompt**: seção `SEGURANÇA E LIMITES` que proíbe revelar instruções internas, executar bypass e desviar do foco
4. **Validação de inputs das tools** via Zod (`src/lib/core/ai/chat-tools.ts`):
   - `search_jobs.query`: 2-200 chars, regex `[a-zA-Z0-9\s\-_.]`
   - `analyze_job_fit.jobTitle`: 1-200 chars
   - `analyze_job_fit.jobDescription`: 10-5000 chars

## Variáveis de Ambiente Obrigatórias

```
DATABASE_URL=postgresql://...
AUTH_SECRET=<openssl rand -base64 64>
```
