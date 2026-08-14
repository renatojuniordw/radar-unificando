# API — Radar Unificando v2

## Autenticação

Todas as rotas protegidas usam Auth.js v5 (credentials) com JWT.

Headers para requisições autenticadas:
```
Cookie: next-auth.session-token=<token>
```

Base URL local: `http://localhost:11010`.

## Rotas

### Auth

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| POST | `/api/auth/register` | ❌ | Criar conta (name, email, password ≥ 8). Rate limits: 5/min + 3/dia por IP (Redis). 409 em e-mail duplicado |
| POST | `/api/auth/forgot-password` | ❌ | Solicitar link de recuperação (`{email}`). Sempre `{success:true}` (anti-enumeração). Envia e-mail via Resend ou loga no console em dev. Rate limits: 3/min + 10/dia por IP e 3/hora por e-mail |
| POST | `/api/auth/reset-password` | ❌ | Redefinir senha (`{token, password}`). 400 se link inválido/expirado. Rate limit: 5/min |
| POST | `/api/auth/callback/credentials` | ❌ | Login (email, password) — rota do NextAuth |
| GET | `/api/auth/session` | ❌ | Obter sessão atual — rota do NextAuth |
| GET/POST | `/api/auth/[...nextauth]` | ❌ | Handlers do NextAuth |

### Pipeline

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| POST | `/api/pipeline` | ❌ | Iniciar pipeline (`{companies[], queries[], auto?}`). `auto:true` = auto-sync silencioso: usa limiter próprio (2/5min) e retorna `cooldownSeconds: 0` (não bloqueia a busca manual). Busca manual: rate limit 1/5min por usuário (ou IP anônimo) e retorna `{runId, cooldownSeconds}`. |
| GET | `/api/pipeline/stream?runId=` | ❌ | SSE — eventos de progresso em tempo real. O evento `pipeline_complete` carrega `jobs` (vagas encontradas) para **todos** os usuários (logados e anônimos) |
| GET | `/api/pipeline/:runId` | ❌ | Status de uma execução (404 se não existir) |

### Vagas

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/api/vagas` | ❌ | Listar vagas. `recomendado=1` → ranqueadas por perfil (máx. 30); senão filtros `plataforma`, `cargo`, `search` (máx. 200). Anônimo usa UUID zero |

### Perfil

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/api/profile` | ✅ | Obter perfil do usuário |
| PUT | `/api/profile` | ✅ | Atualizar perfil (skills, seniority, currentRole, area, education, resumeText, resumeMarkdown) |

### Chat

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| POST | `/api/chat` | ✅ | Stream de resposta do assistente (SSE). Rate limits: 10/min + 50/dia (Redis) + tetos de tokens diário/mensal/IP (banco `chat_usage`, 429 `TOKEN_LIMIT_REACHED`) + lock de concorrência (1 resposta ativa). Thread: 25 mensagens (400 `THREAD_LIMIT_REACHED`) |
| GET | `/api/chat/history?chatId=` | ✅ | Carregar histórico de uma conversa |
| POST | `/api/chat/history` | ✅ | Salvar histórico (body: `{ chatId, messages }`, PII sanitizado) |
| DELETE | `/api/chat/history?chatId=` | ✅ | Apagar histórico de uma conversa |
| GET | `/api/chat/conversations` | ✅ | Listar conversas (id, título, última mensagem, data) |
| GET | `/api/chat/usage` | ✅ | Uso do usuário: interações do dia + tokens do dia/mês e tetos (`dailyTokens`, `monthlyTokens`, `isTokenLimitReached`, etc.) |
| GET | `/api/chat/context?chatId=` | ✅ | Tokens de contexto da última chamada (`{ contextTokens }`) — tamanho real da janela enviada |
| POST | `/api/ats/analyze` | ✅ | Análise ATS do currículo do usuário. Body: `{ jobDescription? }`. Retorna `{ heuristics, analysis, cached }` (score 0-100, checklist, keywords faltando, recomendações). 400 se não houver currículo. Rate limit próprio |
| POST | `/api/courses/search` | ❌ (limitado por IP) | Busca dinâmica de cursos. Body: `{ query }` (1-80 chars). Prioriza a API Impact (Udemy, máx. 12), com cache Redis (1h) e fallback para o catálogo curado local. Retorna `{ courses, source }` (`source` ∈ `impact\|curated`) |
| POST | `/api/resume/generate` | ✅ | Gera currículo adaptado à vaga em PDF. Body: `{ jobTitle, jobDescription?, jobCompany?, jobLocation? }`. Retorna `{ resume, resumeMarkdown, pdfBase64 }`. Veracidade garantida (`enforceVeracity`). Rate limit diário (`resume_daily`). 400 sem currículo importado |

**Exemplo de resposta do GET `/api/chat/usage`:**
```json
{
  "count": 8, "limit": 50, "remaining": 42, "isDailyLimitReached": false,
  "dailyTokens": 12480, "dailyTokenLimit": 100000, "dailyTokenRemaining": 87520,
  "monthlyTokens": 312000, "monthlyTokenLimit": 2000000, "monthlyTokenRemaining": 1688000,
  "isTokenLimitReached": false
}
```

**Segurança do chat:**
- Rate limits: 10 mensagens/min + 50/dia por usuário (retorna `429` ao exceder)
- Tetos de tokens: 100k/dia, 2M/mês, 300k/IP/dia — verificados antes da chamada (429 `TOKEN_LIMIT_REACHED`); soma considera contas com o mesmo `resume_hash`
- Lock de concorrência: 1 resposta em andamento por usuário (429)
- Input sanitizado (truncado em 2000 chars, tags HTML removidas)
- Redação de PII (CPF, CNPJ, RG, telefone, cartão) → `[CPF REDIGIDO]`
- Tentativas de prompt injection geram log `[AI_LOG] suspicious_activity` (400)

**Exemplo (chat streaming):**
```bash
curl -X POST http://localhost:11010/api/chat \
  -H 'Content-Type: application/json' \
  -H 'Cookie: next-auth.session-token=<token>' \
  -d '{"messages":[{"role":"user","content":"Busque vagas de Data Analyst"}]}'
```

### Extensão Chrome

A extensão se autentica com um **token de extensão** (Bearer) — não usa cookie de sessão. O token é gerado na página `/extensao/conectar`, entregue via `launchWebAuthFlow` ou copiado manualmente, e armazenado pela extensão em `chrome.storage.local`. O backend guarda apenas o hash SHA-256 do token. Rate limit compartilhado do perfil `extension`: **20 req/min** por usuário+IP.

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| POST | `/api/extension/analyze` | Bearer token | Análise ATS da vaga aberta na extensão. Body: `{ jobDescription, jobTitle? }` (jobDescription truncado em 8000 chars; jobTitle em 200 — melhora o match dos cursos). Retorna `{ heuristics, analysis, cached, courses }`. `courses` é um array (máx. 3) de `{ titulo, plataforma, skill, preco, url }` com links de afiliado (Udemy), presente apenas quando há `missingKeywords` (senão `[]`). 401 token inválido/revogado, 400 sem currículo importado, 429 rate limit |
| POST | `/api/extension/feedback` | Bearer token | Feedback de utilidade. Body: `{ rating: boolean, comment? }` (comentário truncado em 1000 chars). Retorna `{ ok: true }` |
| GET | `/api/extensao/status` | Sessão (cookie) | Status de conexão da extensão para o usuário logado: `{ connected: boolean, lastUsedAt: Date \| null }` — usado pelo polling da página `/extensao/conectar` |

### Tracking de cursos (afiliado)

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| POST | `/api/track/course-click` | ❌ (público, limitado por IP) | Registra clique em link de curso de afiliado. Body: `{ courseId, skill?, platform?, origin, url? }` — `origin` ∈ `web\|chat\|sidebar\|cursos\|extension`. Grava em `CourseClick` (analytics). Rate limit: perfil `general` (60/min por IP). |

**Exemplo (análise pela extensão):**
```bash
curl -X POST http://localhost:11010/api/extension/analyze \
  -H 'Authorization: Bearer <token-da-extensao>' \
  -H 'Content-Type: application/json' \
  -d '{"jobDescription":"Vaga de Desenvolvedor(a) Full Stack..."}'
```

Resposta (trecho — `courses` só aparece quando há `missingKeywords`):
```json
{
  "heuristics": { "checks": [], "score": 80 },
  "analysis": { "score": 75, "missingKeywords": ["Kubernetes"], "...": "..." },
  "cached": false,
  "courses": [
    {
      "titulo": "Docker e Kubernetes na Prática",
      "plataforma": "Udemy",
      "skill": "docker",
      "preco": "R$ 27,90",
      "url": "https://www.udemy.com/course/docker-e-kubernetes-de-forma-pratica-e-direta/"
    }
  ]
}
```

> Nota: as chamadas da extensão vêm de `Origin: chrome-extension://<id>`. O `middleware.ts` só aceita a origem se estiver configurada em `EXTENSION_ORIGIN` (nunca refletida).

### Upload de currículo

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| POST | `/api/upload` | ✅ | Multipart `file` (PDF ≤ 5MB, ≤ 20 páginas) ou `text` (colado). Valida magic bytes `%PDF-` (rejeita arquivo renomeado). **Assíncrono**: retorna `{jobId}` na hora; a extração roda em background. Rate limit: 10/hora |
| GET | `/api/upload/:jobId` | ✅ | Status do job de upload: `processing` / `completed` (com `result`) / `failed` (com `error`). 404 se não existir ou pertencer a outro usuário |

**Fluxo assíncrono do upload:** o POST valida o arquivo, faz o parsing do PDF (rápido, ~3s) e responde imediatamente com `{jobId}`. A extração de skills via LLM roda em background e o cliente faz polling em `GET /api/upload/:jobId` a cada 2s até `completed`/`failed`. Isso elimina o 504 do nginx — a resposta HTTP não fica mais presa na chamada LLM (que pode levar 30-90s).

**Cache por hash:** o mesmo currículo (mesmo conteúdo) não re-chama a LLM dentro de 1h — o resultado é servido do cache in-memory (`resume-extraction-cache.ts`).

```bash
# 1. Enviar o currículo (retorna jobId na hora)
curl -X POST http://localhost:11010/api/upload \
  -H 'Cookie: next-auth.session-token=<token>' \
  -F 'file=@Profile.pdf'

# 2. Polling do status
curl http://localhost:11010/api/upload/<jobId> \
  -H 'Cookie: next-auth.session-token=<token>'
# → {"status":"completed","result":{"skills":[...],"count":22,...}}
```

### Export

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/export?format=csv` | ❌ | Exportar até 500 vagas em CSV (default, com BOM) ou `format=json` |

### Health

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/api/health` | ❌ | Health check do servidor + banco (`SELECT 1`) |

## Exemplos

```bash
# Pipeline — todas as vagas
curl -X POST http://localhost:11010/api/pipeline \
  -H 'Content-Type: application/json' \
  -d '{"companies":[],"queries":[]}'

# Pipeline — busca por cargo em todas empresas
curl -X POST http://localhost:11010/api/pipeline \
  -H 'Content-Type: application/json' \
  -d '{"companies":[],"queries":["Agile Coach"]}'

# SSE
curl http://localhost:11010/api/pipeline/stream?runId=<id>

# Vagas recomendadas (autenticado + perfil mínimo)
curl http://localhost:11010/api/vagas?recomendado=1 \
  -H 'Cookie: next-auth.session-token=<token>'

# Vagas com filtro
curl http://localhost:11010/api/vagas?plataforma=Gupy&search=Analista

# Perfil (autenticado)
curl http://localhost:11010/api/profile \
  -H 'Cookie: next-auth.session-token=<token>'

# Export JSON
curl http://localhost:11010/export?format=json
```
