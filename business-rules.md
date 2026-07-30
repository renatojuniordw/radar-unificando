# Mapped Business Rules — Phase 1

## ScoringEngine (scoring-engine.ts)

### Expected Behavior
**Input → Output/Side-Effect:**
- When `CandidateProfile` + `JobRequirements` provided, returns `MatchResult` with totalScore 0-1, breakdown, matchedSkills, missingMandatory, evidence
- When all mandatory skills match, `missingMandatory` is empty
- When no mandatory skills match, `matchedSkills` is empty and `missingMandatory` contains all required skills
- When requirements have empty arrays, that dimension scores 1.0 (neutral)
- `totalScore` is weighted average of all breakdown dimensions

### Validations and Rules
1. **Skill matching (mandatory)**: If `profile.skills` contains a substring match (case-insensitive, `includes`) against `requirements.mandatorySkills`[i], it counts as matched. Weight: 0.30.
2. **Skill matching (desirable)**: Same substring logic. Weight: 0.15.
3. **Text matching (responsibilities/domain)**: Split `texts[i]` by space; if any word is found (case-insensitive `includes`) in concatenated profile skills, count as match. Weight: 0.15.
4. **Seniority matching**: Both values mapped to index in [junior, pleno, senior, lead, manager, head, director]. Score = max(0, 1 - abs(diff) * 0.25). Unknown levels → score 0.5. Weight: 0.10.
5. **List matching (education/languages)**: Case-insensitive `includes` match. Weight: 0.05 each.
6. **Logistics matching**: Start at 1.0, subtract 0.3 if `requiredRemote=true` and `profileRemote=false`. Subtract 0.3 if both locations are non-empty and profile doesn't include required location. Clamp at 0. Weight: 0.05.
7. **Behavioral**: Always returns score 1.0. Weight: 0.05.
8. **Total calculation**: Sum of (score[i] * weight[i]) / sum(weights). Returns 0 if totalWeight is 0.
9. **Evidence generation**: If `matchedSkills.length > 0`, adds line. If `missingMandatory.length > 0`, adds top-3 missing. Always adds total score percentage.

### Mapped Edge Cases
- **Empty profile skills []**: All skill/lists score 0. Only behavioral/logistics contribute.
- **Empty requirements (all arrays empty)**: All dimensions score 1.0 → totalScore = 1.0.
- **Seniority unknown**: Both profile.seniority and required.seniority unknown → score 0.5.
- **Seniority same level**: diff=0 → score 1.0.
- **Seniority max diff**: e.g. junior vs director → diff=6 → score = max(0, 1-6*0.25) = 0.
- **Location empty strings**: If profileLoc="" or requiredLoc="", no penalty applied (condition checks both truthy).
- **Remote preference**: requiredRemote=true, profileRemote=false → score -= 0.3. If both remote/preferred align, no penalty.
- **Zero weights total**: Edge case where breakdown has 0 total weight → returns 0.
- **Case sensitivity**: All matching uses `.toLowerCase()`.
- **Substring matching**: "python" matches "python", "python3", "data python analysis". But "data analysis" in profile matches "data" or "analysis" as separate tokens.

### Expected Error Scenarios
- None — no exceptions thrown. All edge cases handled gracefully.

### State Transitions (If Applicable)
- N/A — pure computation class

### Critical Dependencies
- No external dependencies. Pure computation.
- Depends on `CandidateProfile`, `JobRequirements`, `ScoreBreakdown`, `MatchResult` types from `types.ts`.

---

## SkillTaxonomy (skill-taxonomy.ts)

### Expected Behavior
**Input → Output/Side-Effect:**
- `findMatchingSkills(text)`: Given a string, returns deduplicated array of all known skills found (case-insensitive substring match) across all taxonomy categories.

### Validations and Rules
1. **Taxonomy lookup**: For each (category → skills[]) entry, iterate skills. If `text.toLowerCase().includes(skill.toLowerCase())`, add to results.
2. **Deduplication**: Returns `[...new Set(found)]`.
3. **Overlapping patterns**: "sql" matches both database category and also appears inside "sqlite" match. "python" matches programming.
4. **Multi-word skills**: "power bi", "machine learning", "google analytics" — matched if the exact multi-word string appears in text.

### Mapped Edge Cases
- **Empty string**: Returns [].
- **Short text**: "sql" → returns ["sql"].
- **Overlapping categories**: "power bi" exists in bi_tools only, not duplicated.
- **Partial word match**: "aws" in "awslambda" matches because `includes("aws")` is true (but this is probably intended as broad match).

### Expected Error Scenarios
- None — pure function, no throws.

---

## ResumeAdapter (resume-adapter.ts)

### Expected Behavior
**Input → Output/Side-Effect:**
- `adapt(profile, requirements, match)`: Returns a formatted resume adaptation string with 4-5 sections.
- If `match.missingMandatory.length > 0`, generates opening with compensation note.
- If `match.missingMandatory.length === 0`, generates standard opening.

### Validations and Rules
1. **Opening without gaps**: Generates "Seniority de Domain com X+ anos..." using profile.seniority (or "profissional" if empty) and requirements.domain (or "Dados e Analytics" if empty).
2. **Opening with gaps**: Same as above, plus compensation paragraph mentioning top-3 missing mandatory skills.
3. **Skills section**: Groups all unique skills from requirements.mandatorySkills + desirableSkills + profile.skills. Creates two sublists: matched (intersection) and extra (profile-only, not matched).
4. **Experience section**: "X anos de experiência na área de domain/Dados, com histórico de entrega..."
5. **Education section**: Only included if `profile.education.length > 0`.
6. **Closing**: Mentions first 4 mandatory skills.

### Mapped Edge Cases
- **Empty profile skills**: `generateSkillsSection` produces grouped lists — matched will be empty (since no profile skills) + extra empty (since no profile-only skills). Outputs empty skill lines with just the header.
- **Empty mandatory skills**: Closing generates empty skills mention.
- **Empty domain**: Falls back to "Dados e Analytics" / "Dados".
- **Empty seniority**: Falls back to "profissional".

### Expected Error Scenarios
- None — pure string generation.

---

## State Machine (state-machine.ts)

### Expected Behavior
**Input → Output/Side-Effect:**
- `canTransition(from, to)`: Returns boolean if transition allowed.
- `getStageLabel(stage)`: Returns Portuguese label string.
- `getAllowedTransitions(stage)`: Returns array of allowed next stages.
- `getStageGroups()`: Returns Record<string, Stage[]> grouping stages by phase.
- `InvalidStatusTransition`: Error class with message "Transição inválida: {from} → {to}" and name "InvalidStatusTransition".

### Validations and Rules
1. **18 defined stages**: discovered, analyzed, prioritized, documents_pending, ready_to_apply, applied, recruiter_contacted, response_received, hr_interview, technical_interview, manager_interview, case_study, final_stage, offer, hired, rejected, withdrawn, no_response.
2. **Terminal stages**: 'hired' and 'withdrawn' have empty transitions (no outgoing).
3. **Stage labels**: All 18 stages have Portuguese labels defined in STAGE_LABELS.
4. **Stage groups**: 5 groups — triagem (3), preparacao (2), aplicacao (3), entrevistas (5), resultado (5).
5. **Transition matrix**: Fully defined for all 18 stages (see ALLOWED_TRANSITIONS in code).
6. **Fallback label**: `getStageLabel` returns the raw stage string if not found in STAGE_LABELS.

### Mapped Edge Cases
- **Unknown stage**: `canTransition` with invalid stage returns false (ALLOWED_TRANSITIONS[stage] is undefined → false).
- **Unknown stage in getStageLabel**: Returns the input string itself.
- **Unknown stage in getAllowedTransitions**: Returns [].
- **rejected → withdrawn**: Allowed (rejected has 1 outgoing).
- **hired → anything**: Disallowed (terminal).
- **withdrawn → anything**: Disallowed (terminal).

### Expected Error Scenarios
- `InvalidStatusTransition(from, to)` is thrown explicitly in PATCH route; it's an Error subclass with custom name.

---

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

## AnonymousStorage (storage/local-storage.ts)

### Expected Behavior
- CRUD operations for vagas, companies, run, stats in localStorage under `ru_anon_*` keys.
- All methods guard against SSR (`typeof window === 'undefined'`).

### Validations and Rules
1. All getters return null/[] if window is undefined (SSR guard).
2. All setters silently ignore on SSR or on QuotaExceededError.
3. `addVagas`: Merges existing + new, deduplicating by link.
4. `clear`: Removes all `ru_anon_*` keys.
5. JSON parse failures return default values ([] or {} or null).

---

## ⚠️ Assumptions Section (Phase 2)
- **ASSUMPTION 1**: Pipeline steps that call external APIs are tested with mocked `fetch`/`companyDiscovery`/`gupyMcpClient` — we don't make real HTTP calls in unit tests.
- **ASSUMPTION 2**: `company-discover.ts` uses Node's global `fetch` — tests will mock it.
- **ASSUMPTION 3**: `save-step.ts` depends on `jobRepository.createMany` — mocked in unit tests.
- **ASSUMPTION 4**: `SkillExtractor`'s `extractByNER` with model loading is too heavy for unit tests — mocked/stubbed. Focus on taxonomy+bullet+regex extraction.
- **ASSUMPTION 5**: `GupyMcpClient` MCP endpoint is external — mocked fetch.

## ⚠️ Assumptions Section (Phase 1)
- **ASSUMPTION 1**: `findMatchingSkills` from `skill-taxonomy.ts` is used by API routes to extract skills from job descriptions — its output is implicitly trusted as source of job requirements skills.
- **ASSUMPTION 2**: The `ResumeAdapter` formatting logic (markdown bold `**`, line breaks) is intentionally not validated in unit tests — it's formatting-only. We test the structure/logic, not exact formatting strings.
- **ASSUMPTION 3**: `DedupEngine` methods preserve order (first occurrence wins) — this matches standard Map behavior.
- **ASSUMPTION 4**: The `ScoringEngine`'s `calcLogisticsMatch` behavior when both locations are empty: condition `if (requiredLoc && profileLoc && ...)` means no penalty when either is empty. Confirmed via code reading.
