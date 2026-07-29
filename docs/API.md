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
| POST | `/api/pipeline` | ❌ | Iniciar pipeline (companies[], discoveryEnabled) |
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
# Pipeline
curl -X POST http://localhost:11010/api/pipeline \
  -H 'Content-Type: application/json' \
  -d '{"companies":["Ambev","Nubank"],"discoveryEnabled":true}'

# SSE
curl http://localhost:11010/api/pipeline/stream?runId=<id>

# Vagas com filtro
curl http://localhost:11010/api/vagas?plataforma=Gupy&search=Analista

# Perfil (autenticado)
curl http://localhost:11010/api/profile \
  -H 'Cookie: next-auth.session-token=<token>'
```
