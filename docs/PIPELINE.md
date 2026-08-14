# Pipeline — Radar Unificando v2

## Visão Geral

O pipeline busca vagas em Gupy e InHire, processa e salva no PostgreSQL.

## Parâmetros

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `companies` | `string[]` | Empresas para filtrar (Gupy usa `careerPageName` na API) |
| `queries` | `string[]` | Palavras-chave de cargo para buscar |

### Comportamento por combinação

| companies | queries | Gupy | InHire |
|-----------|---------|------|--------|
| `[]` | `[]` | Todas as vagas (sem filtro) | Nada |
| `["Globo"]` | `[]` | Todas as vagas da Globo | Nada |
| `[]` | `["Agile Coach"]` | Agile Coach em todas empresas | Agile Coach (match substring) |
| `["Globo"]` | `["Agile Coach"]` | Agile Coach só na Globo | Nada (Globo não tem InHire) |
| `["Globo","Porto"]` | `["Agile Coach"]` | Agile Coach na Globo + Porto | InHire não consultado |
| `["Globo"]` | `["Engenheiro","Analista"]` | Engenheiro + Analista na Globo | Conforme empresa tiver InHire |

> Nota: Gupy não expõe filtro por empresa na API. O parâmetro `companies` é passado como `careerPageName` na URL da API REST (`employability-portal.gupy.io/api/v1/jobs?careerPageName=Globo`). Um filtro adicional case-insensitive (`filterByCompany`) é aplicado como segurança.

## Fluxo

1. **Gupy MCP** (logados + com queries) — usa MCP oficial da Gupy (JSON-RPC), limite 500 vagas/query; fallback para REST em falha
2. **Gupy REST** (todos os casos) — API pública Gupy com parâmetros `jobName` e/ou `careerPageName`
3. **InHire** — `inhire-scraper.ts` (GET `api.inhire.app/job-posts/public/pages`, header `X-Inhire-Client: web-inhire`), só vagas `published`
4. **Merge + Save** — `DedupEngine.mergeSources` + `dedupByLink`, cap `slice(0, 200)`, `createMany` com `skipDuplicates`

> O `discovery-step.ts` (descoberta de empresas) **é executado para usuários logados**
> (`pipeline-runner.ts`: `discoveryEnabled !== false && isLoggedIn`), registrando novas
> empresas em `NewCompany`/`CompanyPresence`.

## Rate Limit e Cooldown

- `POST /api/pipeline` retorna `{ runId, cooldownSeconds? }`.
- **Busca manual**: máx. 1 execução a cada 5 min por usuário (ou IP anônimo). Ao exceder, retorna 429 com `retryAfter`. O cooldown é persistido no IndexedDB (`cooldown_end`) e conta regressiva na UI.
- **Auto-sync** (`auto: true`, refresh silencioso ao entrar): usa limiter próprio (2/5min), retorna `cooldownSeconds: 0` e **não** consome a cota da busca manual — o usuário pode buscar imediatamente. O client pula o auto-sync quando não há filtros salvos.

## Estrutura

A pipeline roda inline no `POST /api/pipeline`, em background (fire-and-forget).

Eventos SSE são emitidos via `ProgressEmitter`:
```
step_start       → Iniciando etapa
step_progress    → Progresso parcial (ex: "3/5 buscas")
step_complete    → Etapa concluída
step_warn        → Etapa concluída com fallback
step_error       → Etapa falhou
pipeline_complete → Pipeline finalizado
pipeline_error   → Pipeline falhou
```

## MCP vs REST

| Tipo | Fonte | Autenticação |
|------|-------|-------------|
| Gupy MCP | `candidates.mcp.api.gupy.io/mcp` | Público (recomendado) |
| Gupy REST | `employability-portal.gupy.io/api/v1/jobs` | Público |

Logados com queries tentam MCP primeiro. Se falhar, fallback para REST.
Anônimos ou sem queries sempre usam REST.
