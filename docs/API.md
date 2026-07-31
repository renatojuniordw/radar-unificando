# API — Radar Unificando v2

## Autenticação

Todas as rotas protegidas usam Auth.js v5 com JWT.

Headers para requisições autenticadas:
```
Cookie: next-auth.session-token=<token>
```

## Rotas

### Auth

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| POST | `/api/auth/register` | ❌ | Criar conta (name, email, password) |
| POST | `/api/auth/signin` | ❌ | Login (email, password) |
| GET | `/api/auth/session` | ❌ | Obter sessão atual |

### Pipeline

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| POST | `/api/pipeline` | ❌ | Iniciar pipeline (companies[], queries[]) |
| GET | `/api/pipeline/stream?runId=` | ❌ | SSE — eventos de progresso em tempo real |
| GET | `/api/pipeline/:runId` | ❌ | Status de uma execução |

### Vagas

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/api/vagas` | ❌ | Listar vagas (filtros: plataforma, cargo, search) |

### Perfil

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/api/profile` | ✅ | Obter perfil do usuário |
| PUT | `/api/profile` | ✅ | Atualizar perfil (skills, seniority, resumeText) |

### Match

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/api/match` | ✅ | Score de match entre perfil e vagas |

### Candidaturas

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/api/applications` | ✅ | Listar candidaturas |
| POST | `/api/applications` | ✅ | Criar candidatura (jobId, stage) |
| PATCH | `/api/applications/:id` | ✅ | Mover estágio (stage) |
| DELETE | `/api/applications/:id` | ✅ | Remover candidatura |

### Chat

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| POST | `/api/chat` | ✅ | Stream de resposta do assistente (SSE) |
| GET | `/api/chat/history?chatId=` | ✅ | Carregar histórico de uma conversa |
| POST | `/api/chat/history` | ✅ | Salvar histórico (body: `{ chatId, messages }`) |
| DELETE | `/api/chat/history?chatId=` | ✅ | Apagar histórico de uma conversa |

**Segurança do chat:**
- Rate limit: 20 mensagens/min por usuário (retorna `429` ao exceder)
- Input sanitizado (truncado em 2000 chars, tags HTML removidas)
- Tentativas de prompt injection geram log `[AI_LOG] suspicious_activity`

**Exemplo (chat streaming):**
```bash
curl -X POST http://localhost:3000/api/chat \
  -H 'Content-Type: application/json' \
  -H 'Cookie: next-auth.session-token=<token>' \
  -d '{"messages":[{"role":"user","content":"Busque vagas de Data Analyst"}]}'
```

### Export

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/export?format=csv` | ❌ | Exportar vagas em CSV |

### Health

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/api/health` | ❌ | Health check do servidor + banco |

## Exemplos

```bash
# Pipeline — todas as vagas
curl -X POST http://localhost:3000/api/pipeline \
  -H 'Content-Type: application/json' \
  -d '{"companies":[],"queries":[]}'

# Pipeline — vagas de uma empresa específica
curl -X POST http://localhost:3000/api/pipeline \
  -H 'Content-Type: application/json' \
  -d '{"companies":["Globo"],"queries":[]}'

# Pipeline — busca por cargo em todas empresas
curl -X POST http://localhost:3000/api/pipeline \
  -H 'Content-Type: application/json' \
  -d '{"companies":[],"queries":["Agile Coach"]}'

# Pipeline — cargo + empresa específica
curl -X POST http://localhost:3000/api/pipeline \
  -H 'Content-Type: application/json' \
  -d '{"companies":["Globo"],"queries":["Agile Coach"]}'

# SSE
curl http://localhost:3000/api/pipeline/stream?runId=<id>

# Vagas com filtro
curl http://localhost:3000/api/vagas?plataforma=Gupy&search=Analista

# Perfil (autenticado)
curl http://localhost:3000/api/profile \
  -H 'Cookie: next-auth.session-token=<token>'
```
