# Pipeline — Radar Unificando v2

## Visão Geral

O pipeline busca vagas remotas em Gupy e InHire, processa e salva no PostgreSQL.

## Fluxo

1. **Gupy MCP** (logados) — usa MCP oficial da Gupy (JSON-RPC)
2. **Gupy REST** (anônimos + fallback) — usa API pública Gupy
3. **Merge** — salva vagas no banco (ignora duplicatas)

## Estrutura

A pipeline roda inline no `POST /api/pipeline`, em background (fire-and-forget).

Eventos SSE são emitidos via `ProgressEmitter`:
```
step_start  → Iniciando etapa
step_progress → Progresso parcial (ex: "3/13 queries")
step_complete → Etapa concluída
step_warn   → Etapa concluída com fallback
step_error  → Etapa falhou
pipeline_complete → Pipeline finalizado
pipeline_error → Pipeline falhou
```

## MCP vs REST

| Tipo | Fonte | Autenticação |
|------|-------|-------------|
| Gupy MCP | `candidates.mcp.api.gupy.io/mcp` | Público (recomendado) |
| Gupy REST | `employability-portal.gupy.io/api/v1/jobs` | Público |

Logados tentam MCP primeiro. Se falhar, fallback para REST.
Anônimos sempre usam REST.
