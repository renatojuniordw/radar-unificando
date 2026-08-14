# Mapped Business Rules

> ⚠️ **Nota:** Este documento descreve apenas módulos que existem hoje no código.
> As seções originais de `ScoringEngine`, `SkillTaxonomy` e `State Machine`
> foram removidas — esses módulos **não foram implementados** na v2/redesign.
> O matching atual é `src/lib/core/matching/recommendation.ts` (token overlap) e a análise
> de fit é feita via chat IA (`job-analyzer.ts`). A **adaptação de currículo** (`ResumeAdapter`)
> foi re-implementada como tool `generate_resume` + `POST /api/resume/generate` (PDF).
> Os modelos `Application`/`ApplicationLog` existem apenas no schema Prisma, sem API nem UI.

## DedupEngine (dedup/index.ts)

### Expected Behavior
**Input → Output/Side-Effect:**
- `dedupByLink(jobs)`: Deduplicate by `job.link` field, or fallback to `"empresa-titulo_vaga"` if link is empty.
- `dedupByTitleAndCompany(jobs)`: Deduplicate by composite key `"empresa|titulo_vaga"` (case-insensitive, trimmed).
- `mergeSources(existing, incoming)`: Merge incoming into existing, skipping duplicates by link.

### Validations and Rules
1. **dedupByLink**: Uses Map keyed by `job.link || \`${empresa}-${titulo_vaga}\``. First occurrence wins.
2. **dedupByTitleAndCompany**: Uses Map keyed by normalized `"empresa|titulo_vaga"`. Both lowercased and trimmed.
3. **mergeSources**: Adds all existing to merged array, tracks existing links in Set. For each incoming job, adds if link not in set.

### Mapped Edge Cases
- **Empty link + empty empresa/titulo**: Key becomes `"undefined-undefined"` — these collapse to single entry.
- **All jobs have same link**: Only first kept.
- **Empty arrays**: Returns [].

### Expected Error Scenarios
- None.

---

---

## ProgressEmitter (progress-emitter.ts)

### Expected Behavior
**Input → Output/Side-Effect:**
- `on(runId, listener)`: Registers listener for runId, immediately replays any buffered events, returns unsubscribe function.
- `emit(runId, event)`: Sends event to all listeners for runId, or buffers if no listeners (up to MAX_BUFFERED=500).
- `removeAll(runId)`: Removes all listeners and buffers for runId.

### Validations and Rules
1. **Listener registration**: Adds listener to set, returns unsubscribe function that removes listener and cleans up empty maps.
2. **Buffer replay**: On registration, if buffer exists, replays all buffered events before returning. Then deletes buffer.
3. **Emit with listeners**: Iterates all listeners and calls each with event.
4. **Emit without listeners**: Buffers event up to 500 events. Silently drops if buffer full.
5. **removeAll**: Deletes both listeners map entry and buffer map entry.
6. **Unsubscribe cleanup**: After removing listener, if the set becomes empty, deletes both the listeners entry and buffer entry.

### Mapped Edge Cases
- **Multiple listeners for same runId**: All receive events.
- **Buffer overflow**: Events beyond 500 are silently dropped.
- **Re-subscribing after unsubscribe**: Creates fresh listener, gets buffered events if any were emitted in between.
- **No events emitted**: Empty buffer, no listeners called.
- **Emitting after removeAll**: Creates new buffer since map entries were deleted.

### Expected Error Scenarios
- No errors thrown — all operations are safe.

---

## DiscoveryStep (pipeline/steps/discovery-step.ts)

### Expected Behavior
**Input → Output/Side-Effect:**
- Calls `companyDiscovery.discover(companies)`, emits progress events, returns number of discovered companies.

### Validations and Rules
1. **Success path**: Returns discovered.length, emits step_start then step_complete.
2. **Empty result**: Returns 0, emits step_complete with "Nenhuma nova empresa descoberta".
3. **Error path**: Emits step_warn with error message, returns 0. Never throws.

---

## GupyStep (pipeline/steps/gupy-step.ts)

### Expected Behavior
**Input → Output/Side-Effect:**
- If `isLoggedIn`: tries MCP (gupyMcpClient.searchJobs) for each query, falls back to REST on failure.
- If `!isLoggedIn`: uses REST API directly.
- Returns array of JobData.

### Validations and Rules
1. **MCP mode**: Iterates GUPY_QUERIES, calls `gupyMcpClient.searchJobs(query, 100)`, emits step_progress for each.
2. **REST fallback**: If MCP throws, calls `scrapeGupyRest(runId, companies)`.
3. **REST mode**: Direct fetch to Gupy REST API, filters only remote jobs, maps to JobData format.
4. **Remote filtering**: Only includes jobs where `j.isRemoteWork === true` or workplaceType includes "remote"/"remoto".
5. **REST error handling**: Individual query failures caught and skipped (continue). Entire step returns results array even if partially failed.
6. **inferRole**: Normalizes title (remove accents, lowercase), matches against known role patterns.

### Mapped Edge Cases
- **All REST queries fail**: Returns empty array.
- **MCP fails on first query**: Falls back to REST for all queries.
- **Company name list filtering**: Jobs from companies in the `companies` array get `na_lista: 'Sim'`, others get 'Não'.

---

## InHireStep (pipeline/steps/inhire-step.ts)

### Expected Behavior
Calls `inhireScraper.searchJobs(companies)`, labels each job with na_lista based on companies list, emits progress events.

### Validations and Rules
1. Success: Returns labeled jobs array, emits step_complete with count.
2. Error: Emits step_warn, returns [].

---

## SaveStep (pipeline/steps/save-step.ts)

### Expected Behavior
Deduplicates jobs by link (limit 200), maps to Prisma.JobCreateManyInput, calls `jobRepository.createMany`, emits progress events.

### Validations and Rules
1. **Dedup + limit**: Applies `dedupEngine.dedupByLink(jobs)`, then slices to 200.
2. **Field mapping**: Maps JobData fields to Prisma schema field names (camelCase).
3. **Repository call**: Returns `inserted` count from `jobRepository.createMany`.

---

## InHireScraper (scrapers/inhire-scraper.ts)

### Expected Behavior
- `searchJobs(companies?)`: Fetches jobs from InHire API for given companies (or all).
- `searchCompany(name)`: Fetches jobs for single company.
- Normalizes raw InHire responses to JobData format.

### Validations and Rules
1. **Endpoint construction**: If companies provided, creates per-company endpoints; otherwise single `/vagas?limit=100`.
2. **Fetch + normalize**: Each result mapped through `normalize(j)`.
3. **normalize**: Sets na_lista='Não' always (in step, overwritten), infers cargo_categoria via inferRole.
4. **Remote detection**: Checks if `j.local?.toLowerCase()` includes "remoto" or "remote".
5. **inferRole**: Same pattern matching as Gupy, with additional catch-all "dados" → 'Analista de Dados'.
6. **Error handling**: Per-endpoint fetch failures caught (continue). Entire method returns [] on catastrophic failure.

### Mapped Edge Cases
- **API returns non-array**: Tries `data.vagas || data.data || []`.
- **Empty company results**: Returns [].
- **not ok response**: Returns [].

---

## GupyMcpClient (mcp/gupy-client.ts)

### Expected Behavior
- `searchJobs(query, limit)`: Calls Gupy MCP endpoint with JSON-RPC, parses response, normalizes to JobData[].

### Validations and Rules
1. **JSON-RPC request**: POST with jsonrpc, method "tools/call", params name "search_jobs", arguments query + limit.
2. **Response parsing**: Finds text content in result.content array, JSON parses it.
3. **normalizeJobs**: Maps raw job fields to JobData format using `company || empresa`, `title || name`, etc.
4. **Error handling**: HTTP error → throw. MCP error → throw. Parse failure → return [].
5. **inferRole**: Same pattern as gupy-step.

### Mapped Edge Cases
- **Empty result content**: Returns [].
- **No text content entry**: Returns [].
- **Malformed JSON in content**: Returns [].

---

## CompanyDiscovery (discovery/company-discovery.ts)

### Expected Behavior
- `discover(knownCompanies)`: Searches Wayback Machine and Urlscan for career pages, deduplicates results.

### Validations and Rules
1. **Parallel search**: Wayback and Urlscan searched via Promise.allSettled.
2. **Wayback search**: Generates target URLs (5 variants per company), queries CDX API with timeout 5s.
3. **Urlscan search**: Queries urlscan.io API for each company (up to 5), filters for carreira/trabalhe.
4. **URL generation**: `variants(slug)` — creates Gupy, Hire.tech, carreiras, trabalheconosco, jobs URLs. Slug truncated to 20 chars.
5. **Dedup**: Deduplicates results by company name (case-insensitive trimmed).
6. **Error resilience**: Individual search failures caught gracefully (empty result for that search). Top-level method returns whatever succeeded.

### Mapped Edge Cases
- **Empty input companies**: API calls still made with [] — will generate no targets/results.
- **All searches fail**: Returns [].
- **Wayback succeeds, Urlscan fails**: Returns wayback results only.
- **Urlscan returns no matching URLs**: Empty results filtered.

---

## SkillExtractor (ai/skill-extractor.ts)

### Expected Behavior
- Singleton pattern via `getInstance()`.
- `extractSkills(text)`: Uses taxonomy + NER (optional) to extract skills, experience, seniority, education.
- `loadModel()`: Loads NER model from Xenova/transformers (idempotent, guarded by loading flag).

### Validations and Rules
1. **Taxonomy extraction**: Matches text against built-in taxonomy categories (same structure as skill-taxonomy but slightly different sets).
2. **NER extraction**: Loads model, runs token-classification, filters MISC entities with score > 0.7.
3. **NER resilience**: If model fails, returns [] silently.
4. **Bullet extraction**: Parses bullet points from text, matches against known patterns (100+ patterns list).
5. **Experience extraction**: Regex patterns for anos + experiência/experience. Valid range 0-40. Returns null if not found.
6. **Seniority extraction**: Keyword matching against level words (junior, pleno, senior, etc.) — returns level value or null.
7. **Education extraction**: Pattern matching for common degree mentions, returns labels in English.

### Mapped Edge Cases
- **Empty text**: Taxonomy returns [], NER returns [], experience null, seniority null, education [].
- **Bullet text with no known patterns**: Returns taxonomy results only.
- **Experience outside 0-40**: Rejected (null).
- **Seniority multiple matches**: First matching level in loop order wins.
- **Duplicate education**: Deduplicated via Set.

---

---

## RateLimiter (security/rate-limiter.ts)

### Expected Behavior
**Input → Output/Side-Effect:**
- `check(key)`: Returns `{ allowed: boolean, remaining: number, resetAt: number }`.
- First call for a key: creates entry with count=1, allowed=true.
- Subsequent calls within window: increments count, allowed=true until maxRequests exceeded.

### Validations and Rules
1. **First request**: Creates entry with count=1, resetAt = now + windowMs, allowed=true, remaining = maxRequests-1.
2. **Within window**: Increments count. If count <= maxRequests, allowed=true. Once count > maxRequests, allowed=false.
3. **Window expiration**: If `now > entry.resetAt`, resets entry (count=1, new resetAt).
4. **remaining calculation**: `Math.max(0, maxRequests - entry.count)`.

### Mapped Edge Cases
- **Exact boundary**: At maxRequests, allowed is true. At maxRequests+1, allowed is false.
- **Window expiration exactly at boundary**: Next request after expiry starts new window.
- **Multiple keys**: Tracked independently.
- **Remaining count**: Never negative (clamped at 0).

---

## EnvValidator (security/env.ts)

### Expected Behavior
- `validateEnv()`: Checks for DATABASE_URL and AUTH_SECRET. Logs error if missing. Warns if AUTH_SECRET is default value.

### Validations and Rules
1. Missing env vars → console.error with message listing missing vars.
2. Default AUTH_SECRET value → console.warn with security warning.

---

## browserStorage (storage/browser-storage.ts)

### Expected Behavior
- Async CRUD operations for anonymous vagas, cooldown, last run timestamp, filters, chat id and chat messages in IndexedDB (DB `radar-unificando`, store `kv`).
- All methods guard against SSR/IndexedDB-unavailable (`typeof window === 'undefined' || typeof indexedDB === 'undefined'`).
- One-time backfill from legacy `ru_anon_vagas` / `ru_cooldown_end` localStorage keys (flag `migrated_v1`).
- Chaves: `anon_vagas`, `cooldown_end`, `last_run_at`, `filters`, `chat_id`, `chat_messages`, `migrated_v1`.

### Validations and Rules
1. All getters resolve to null/[] if window or indexedDB is undefined (SSR/unavailable guard).
2. All operations silently fail if IndexedDB is unavailable (private mode, SSR).
3. `clear`: Removes anonymous data only (vagas + cooldown), preserving filters and chat.
4. Reads return default values on missing keys or errors ([] or null).
5. `ensureMigration`: best-effort, idempotent via `migrated_v1` flag.
6. `setLastRunAt`: Grava timestamp da última busca; usado pelo auto-sync de 15 min em `useJobSearch`.

---

## ⚠️ Assumptions Section (Phase 2)
- **ASSUMPTION 1**: Pipeline steps that call external APIs are tested with mocked `fetch`/`companyDiscovery`/`gupyMcpClient` — we don't make real HTTP calls in unit tests.
- **ASSUMPTION 2**: `company-discover.ts` uses Node's global `fetch` — tests will mock it.
- **ASSUMPTION 3**: `save-step.ts` depends on `jobRepository.createMany` — mocked in unit tests.
- **ASSUMPTION 4**: `SkillExtractor`'s `extractByNER` with model loading is too heavy for unit tests — mocked/stubbed. Focus on taxonomy+bullet+regex extraction.
- **ASSUMPTION 5**: `GupyMcpClient` MCP endpoint is external — mocked fetch.

## ⚠️ Assumptions Section (fases históricas)
- **ASSUMPTION 1**: `SkillExtractor`'s NER model loading is mocked/stubbed in unit tests (heavy); tests focus on taxonomy + bullet + regex extraction.
- **ASSUMPTION 2**: `DedupEngine` methods preserve order (first occurrence wins) — this matches standard Map behavior.
- **ASSUMPTION 3**: `recommendation.ts` (`buildProfileTokens` cap 10 tokens, `rankJobsByProfile` overlap score 0–1) is a pure function tested without LLM dependency.
