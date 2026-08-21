# Segurança — Radar Unificando v2

## Medidas Implementadas

| Medida | Implementação |
|--------|---------------|
| Security Headers | `next.config.ts` (HSTS, X-Frame-Options, etc.) |
| CORS | `proxy.ts` (Access-Control headers) |
| Rate Limiting | `src/lib/infrastructure/security/rate-limiter.ts` |
| Env Validation | `src/lib/infrastructure/security/env.ts` |
| Auth | Auth.js v5 com JWT + bcrypt (cost=12) |
| Docker | `no-new-privileges`, resource limits, non-root user |
| SQL Injection | Prevenido pelo Prisma ORM (queries parametrizadas) |
| Validação de Upload | `api/upload/route.ts` — magic bytes `%PDF-` (rejeita arquivo renomeado), tamanho ≤ 5MB, arquivo vazio |
| Prompt Injection | `api/chat/route.ts` — sanitização de input + detecção de padrões + hardening do prompt |
| Validação de Tools | `src/lib/core/ai/tools/` — Zod schema por tool com limites de tamanho e regex |
| Token de Extensão | `extension-token.ts` — token 64-hex entregue 1x, apenas SHA-256 armazenado (`ExtensionToken`) |
| Origem da Extensão | `proxy.ts` — `Origin: chrome-extension://<id>` aceita somente se igual a `EXTENSION_ORIGIN` (nunca refletida) |

## Rate Limits por Operação

Dois sistemas:
- `src/lib/infrastructure/security/rate-limiter.ts` — **in-memory** (`pipelineLimiter`, `pipelineAutoLimiter`, `uploadLimiter`).
- `src/lib/infrastructure/rate-limit.ts` — **Redis** (`rate-limiter-flexible`) com fallback em memória (`chat`, `chat_daily`, `auth`, `general`, `register_daily`, `extension`).

| Operação | Janela | Limite | Backend | Chave |
|----------|--------|--------|---------|-------|
| Pipeline (`/api/pipeline`) | 5 min | 1 | in-memory | user_id / IP |
| Pipeline auto-sync (`/api/pipeline` com `auto:true`) | 5 min | 2 | in-memory | user_id / IP |
| Upload currículo (`/api/upload`) | 1 hora | 10 | in-memory | user_id / IP |
| Chat (`/api/chat`) | 1 min | 10 | Redis | user_id + IP |
| Chat diário (`/api/chat`) | 24 h | 50 | Redis | user_id + IP |
| Chat tokens/dia (`/api/chat`) | 24 h | 100k tokens | banco (`chat_usage`) | user_id + grupo por `resume_hash` |
| Chat tokens/mês (`/api/chat`) | mês calendário | 2M tokens | banco (`chat_usage`) | user_id + grupo por `resume_hash` |
| Chat tokens/IP/dia (`/api/chat`) | 24 h | 300k tokens | banco (`chat_usage.ip_hash`) | hash do IP |
| Chat concorrência (`/api/chat`) | — | 1 resposta ativa | Redis (`chat_lock`) | user_id |
| Registro (`/api/auth/register`) | 1 min | 5 | Redis | IP |
| Registro (`/api/auth/register`) | 24 h | 3 cadastros | Redis | IP |
| Extensão (`/api/extension/*`) | 1 min | 20 | Redis | user_id + IP |
| Análise ATS (`/api/ats/analyze`) | 24 h | 10 | Redis | user_id |
| Currículo adaptado (`/api/resume/generate`) | 24 h | 10 | Redis | user_id + IP |
| Busca de cursos (`/api/courses/search`) | 1 min | 60 | Redis | IP |
| Histórico chat (`/api/chat/history`) | 1 min | 60 | Redis | user_id |

## Limites de Conversa (Chat)

- **Thread**: máximo de 25 mensagens (`MAX_THREAD_MESSAGES`) → 400 `THREAD_LIMIT_REACHED`.
- **Contexto**: janela deslizante de 15 mensagens (`MAX_CONTEXT_MESSAGES`) enviadas ao LLM.
- **Tokens**: o `usage` real do provider é persistido em `chat_usage` e os tetos acima são verificados antes de cada chamada (429 `TOKEN_LIMIT_REACHED`). O header mostra Contexto/Hoje/Mês em tokens.

## Anti multi-conta

- **Limite de criação**: 3 cadastros por IP/dia (`register_daily`).
- **Hash de currículo**: `Profile.resume_hash` (SHA-256 do texto do currículo) — contas com o mesmo currículo **compartilham o teto de tokens** (a soma do grupo vale para todas).
- **Teto por IP**: 3x o individual (300k/dia) via `chat_usage.ip_hash` (hash do IP, LGPD-safe).

## Redação de PII (LGPD)

`src/lib/core/ai/pii-redactor.ts` remove CPF, CNPJ, RG, telefone e cartão de crédito
(`[CPF REDIGIDO]`, etc.) das mensagens do usuário, do POST de histórico e do botão
copiar da UI. O chat exibe badge "🔒 LGPD Sanitizado".

## Proteção contra Prompt Injection

Aplicada no `POST /api/chat` (`src/app/api/chat/route.ts`):

1. **Sanitização de input**: mensagens truncadas em 2000 chars, tags HTML (`<>`) removidas
2. **Detecção de padrões suspeitos**: regex para tentativas de jailbreak em PT e EN (`ignore instructions`, `system prompt`, `you are now`, `act as`, `developer mode`, etc. — `src/lib/core/ai/chat-guard.ts`). Gera log `[AI_LOG] suspicious_activity`
3. **Hardening do system prompt**: seção `SEGURANÇA E LIMITES` que proíbe revelar instruções internas, executar bypass e desviar do foco
4. **Validação de inputs das tools** via Zod (um schema por tool em `src/lib/core/ai/tools/`):
   - `search_jobs.query`: 2-200 chars, regex `[a-zA-Z0-9\s\-_.]`
   - `search_jobs`: máx 2 chamadas por mensagem (enforcement no closure do `createSearchJobsTool`)
   - `analyze_job_fit.jobTitle`: 1-200 chars
   - `analyze_job_fit.jobDescription`: 10-5000 chars
5. **Dados externos como dados**: descrições de vaga são truncadas em 800 chars e embrulhadas em `<untrusted_content>...</untrusted_content>` — o system prompt instrui tratá-las como conteúdo, nunca como comando.

## Autenticação da Extensão Chrome

- **Geração**: `/extensao/conectar` cria `randomBytes(32)` (64 hex) e persiste **somente** `sha256(token)` em `ExtensionToken.tokenHash`. O texto puro nunca vai ao banco.
- **Entrega**: via redirect do `launchWebAuthFlow` (`?token=...`) — o backend valida `redirect_uri` com `isSafeRedirectUri` (somente `https://*.chromiumapp.org`, evita open redirect) — ou manualmente na página.
- **Uso**: `Authorization: Bearer <token>` em `POST /api/extension/*`. Cada uso válido atualiza `ExtensionToken.lastUsedAt` (é isso que o `GET /api/extensao/status` lê para mostrar "conectado").
- **Revogação**: campo `revokedAt` no schema (sem UI ainda) — tokens revogados retornam 401.
- **CORS/origem**: o `proxy.ts` só adiciona `Access-Control-Allow-Origin` para origens da allowlist (self + `EXTENSION_ORIGIN`). `chrome-extension://<id>` **nunca** é refletida de volta.

## Variáveis de Ambiente Obrigatórias

```
DATABASE_URL=postgresql://...
AUTH_SECRET=<openssl rand -base64 64>
EXTENSION_ORIGIN=chrome-extension://<id-da-extensao>   # para a extensão Chrome
CRON_SECRET=<openssl rand -base64 32>                  # para a rotina de retenção (produção)
```

## Rotina de Retenção (LGPD)

`GET /api/cron/cleanup` exclui caches expirados (`generated_content_cache`) e chats inativos
(>`RETENTION_INACTIVE_CHAT_MONTHS` meses, default 12; mensagens removidas em cascata).
O Next não dispara a rotina sozinho — o cron do VPS deve chamá-la com o header
`x-cron-secret` (comparação com `timingSafeEqual`):

```bash
# /usr/local/bin/radar-cleanup.sh
#!/bin/bash
set -a; source /caminho/do/projeto/.env; set +a
curl -sS -H "x-cron-secret: $CRON_SECRET" https://radar.unificando.com.br/api/cron/cleanup
```

```bash
chmod +x /usr/local/bin/radar-cleanup.sh
crontab -e
# diariamente às 03:00
0 3 * * * /usr/local/bin/radar-cleanup.sh
```

Sem `CRON_SECRET` configurado, a rota responde 503 (fail-safe — nada é apagado).
`chat_usage` órfãos não são limpos por decisão de projeto (controle de orçamento de consumo).
