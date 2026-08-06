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
| POST | `/api/auth/register` | ❌ | Criar conta (name, email, password ≥ 8). Rate limit: 5/min (Redis). 409 em e-mail duplicado |
| POST | `/api/auth/forgot-password` | ❌ | Solicitar link de recuperação (`{email}`). Sempre `{success:true}` (anti-enumeração). Envia e-mail via SMTP ou loga no console em dev. Rate limit: 5/min |
| POST | `/api/auth/reset-password` | ❌ | Redefinir senha (`{token, password}`). 400 se link inválido/expirado. Rate limit: 5/min |
| POST | `/api/auth/callback/credentials` | ❌ | Login (email, password) — rota do NextAuth |
| GET | `/api/auth/session` | ❌ | Obter sessão atual — rota do NextAuth |
| GET/POST | `/api/auth/[...nextauth]` | ❌ | Handlers do NextAuth |

### Pipeline

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| POST | `/api/pipeline` | ❌ | Iniciar pipeline (`{companies[], queries[]}`). Rate limit: 1/5min por usuário (ou IP anônimo). Retorna `{runId, cooldownSeconds?}` |
| GET | `/api/pipeline/stream?runId=` | ❌ | SSE — eventos de progresso em tempo real |
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
| POST | `/api/chat` | ✅ | Stream de resposta do assistente (SSE). Rate limit: 10/min + 50/dia (Redis). Thread: 25 mensagens (400 `THREAD_LIMIT_REACHED`) |
| GET | `/api/chat/history?chatId=` | ✅ | Carregar histórico de uma conversa |
| POST | `/api/chat/history` | ✅ | Salvar histórico (body: `{ chatId, messages }`, PII sanitizado) |
| DELETE | `/api/chat/history?chatId=` | ✅ | Apagar histórico de uma conversa |
| GET | `/api/chat/conversations` | ✅ | Listar conversas (id, título, última mensagem, data) |

**Segurança do chat:**
- Rate limits: 10 mensagens/min + 50/dia por usuário (retorna `429` ao exceder)
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
