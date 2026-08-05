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
| Validação de Upload | `api/upload/route.ts` — magic bytes `%PDF-` (rejeita arquivo renomeado), tamanho ≤ 5MB, arquivo vazio |
| Prompt Injection | `api/chat/route.ts` — sanitização de input + detecção de padrões + hardening do prompt |
| Validação de Tools | `chat-tools.ts` — Zod schema com limites de tamanho e regex |

## Rate Limits por Operação

Dois sistemas:
- `src/lib/infrastructure/security/rate-limiter.ts` — **in-memory** (`pipelineLimiter`, `uploadLimiter`).
- `src/lib/rate-limit.ts` — **Redis** (`rate-limiter-flexible`) com fallback em memória (`chat`, `chat_daily`, `auth`).

| Operação | Janela | Limite | Backend | Chave |
|----------|--------|--------|---------|-------|
| Pipeline (`/api/pipeline`) | 5 min | 1 | in-memory | user_id / IP |
| Upload currículo (`/api/upload`) | 1 hora | 10 | in-memory | user_id / IP |
| Chat (`/api/chat`) | 1 min | 10 | Redis | user_id + IP |
| Chat diário (`/api/chat`) | 24 h | 50 | Redis | user_id + IP |
| Registro (`/api/auth/register`) | 1 min | 5 | Redis | IP |

> `loginLimiter`, `apiLimiter` e `exportLimiter` estão definidos em `rate-limiter.ts`
> mas **não são usados** na produção hoje.

## Limites de Conversa (Chat)

- **Thread**: máximo de 25 mensagens (`MAX_THREAD_MESSAGES`) → 400 `THREAD_LIMIT_REACHED`.
- **Contexto**: janela deslizante de 15 mensagens (`MAX_CONTEXT_MESSAGES`) enviadas ao LLM.

## Redação de PII (LGPD)

`src/lib/core/ai/pii-redactor.ts` remove CPF, CNPJ, RG, telefone e cartão de crédito
(`[CPF REDIGIDO]`, etc.) das mensagens do usuário, do POST de histórico e do botão
copiar da UI. O chat exibe badge "🔒 LGPD Sanitizado".

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
