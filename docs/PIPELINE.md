# Pipeline — Radar Unificando v2

## Visão Geral

O pipeline busca vagas em Gupy e InHire, processa e salva no PostgreSQL. Antes de buscar,
as queries são **expandidas** (mapa curado + IA cacheada) e os resultados passam por
filtros de **relevância** (design físico) e **frescor** (vagas antigas).

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

## Expansão de Queries (híbrida)

Antes de buscar, cada query é expandida em variantes de busca (sinônimos PT/EN, cargos
equivalentes) por `src/lib/core/pipeline/query-expansion/service.ts`:

```
expandQueries(queries)
  ├─ dedupeQueries(input)          → colapsa "UI/UX Designer" ↔ "UX/UI Designer"
  ├─ por query: mapa curado → cache → LLM (fail-open)
  ├─ dedupe do resultado expandido
  └─ slice(0, 30) — originais sempre primeiro
```

- **Mapa curado** (`map.ts`): ~15 cargos comuns → variantes determinísticas (custo zero).
- **Cache global** (`cache.ts`): Redis (`query_expansion:v1:<sha256>`, TTL 30 dias) com
  fallback em memória — cada query expande via LLM **uma única vez**.
- **LLM** (`ai/query-expansion.ts` + `prompts/query-expansion.ts`): gera 1–6 variantes
  equivalentes; `sanitizeVariants` descarta lixo (ex.: "Analista de Dados jobs", "2026").
- **Fail-open**: Redis fora, LLM fora ou qualquer erro → segue com as queries originais.
  O pipeline **nunca** quebra por causa da expansão.
- **Single-flight**: duas execuções concorrentes (manual + auto-sync) não duplicam a
  chamada à LLM para a mesma query.

## Fluxo

1. **Cache SWR** — `pipelineCache` (in-memory): hit fresco (< 5 min) devolve resultados
   direto; hit stale (5–30 min) devolve e revalida em background; > 30 min expira.
2. **Expansão de queries** — híbrida (mapa + IA cacheada), aplicada antes da busca.
3. **Gupy MCP** (logados + com queries) — MCP oficial da Gupy (JSON-RPC), **paginado**
   (offset 0→500, página de 100), fallback para REST em falha.
4. **Gupy REST** (todos os casos) — API pública Gupy com parâmetros `jobName` e/ou `careerPageName`.
5. **InHire** — `inhire-scraper.ts` (GET `api.inhire.app/job-posts/public/pages`, header `X-Inhire-Client: web-inhire`), só vagas `published`.
6. **Filtros de qualidade** — `filterIrrelevantDesignJobs` (design físico: moda/industrial)
   + `filterFreshJobs` (postedAt > 20 dias descartado; sem data mantém).
7. **Merge + Save** — `DedupEngine.mergeSources` + `dedupByLink`, cap `slice(0, 200)`, `createMany` com `skipDuplicates`.
8. **Ordenação** — `sortJobsByRecency` (postedAt/detectedAt, mais recente primeiro) antes de cachear/emitir.

> O `discovery-step.ts` (descoberta de empresas) **é executado para usuários logados**
> (`pipeline-runner.ts`: `discoveryEnabled !== false && isLoggedIn`), registrando novas
> empresas em `NewCompany`/`CompanyPresence`.

## Filtros de Qualidade

### Relevância (`relevance-filter.ts`)

A busca por substring da Gupy (`jobName`) retorna falsos positivos — ex.: "designer de
produto" traz vagas de moda/industrial. `filterIrrelevantDesignJobs(jobs, queries)`
descarta vagas cujo título tem marcador de **design físico** (estamparia, moda, têxtil,
calçados, industrial, automotivo, mobiliário, etc.) quando a busca é de design e o domínio
do marcador **não foi buscado** explicitamente (ex.: `designer industrial` mantém vagas com
"industrial"). O filtro usa as **queries originais** (não expandidas) — uma alucinação da
LLM não "destrava" vagas de outra área.

### Frescor (`freshness.ts`)

`MAX_JOB_AGE_DAYS = 20` — vagas publicadas há mais de 20 dias são descartadas. Vaga sem
data ou com data inválida é mantida (fail-open). Aplicado em Gupy e InHire.

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
pipeline_complete → Pipeline finalizado (inclui `jobs` para TODOS os usuários)
pipeline_error   → Pipeline falhou
```

> O evento `pipeline_complete` carrega `jobs` (as vagas encontradas) para **todos** os
> usuários — logados também veem os resultados da busca na UI (antes, só anônimos
> recebiam as vagas inline e logados recarregavam a lista recomendada por perfil).

## MCP vs REST

| Tipo | Fonte | Autenticação |
|------|-------|-------------|
| Gupy MCP | `candidates.mcp.api.gupy.io/mcp` | Público (recomendado) |
| Gupy REST | `employability-portal.gupy.io/api/v1/jobs` | Público |

Logados com queries tentam MCP primeiro. Se falhar, fallback para REST.
Anônimos ou sem queries sempre usam REST.

**Paginação:** o MCP valida `limit` com máximo 100 (`too_big, maximum: 100`) — a chamada
usa `limit=100` e pagina via `offset` (0→500), igual ao REST (`MAX_PER_SEARCH = 500`,
`PAGE_SIZE = 100`). Antes, o MCP fazia 1 chamada por query (máx. 100 vagas) e usuários
logados recebiam menos resultados que anônimos.
