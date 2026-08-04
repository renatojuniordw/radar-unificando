# Test Report — Radar Unificando

## Status da Suíte (ago 2026)

| Métrica | Valor |
|---------|-------|
| Test Files | 45 (10 falhando · 35 passando) |
| Testes | 232 (30 falhando · 202 passando) |
| Framework | Vitest (`npm run test`) |
| E2E | Playwright (`npm run test:e2e`, `e2e/fluxos-principais.spec.ts`) |

> ⚠️ **Nota:** As 30 falhas atuais são **pré-existentes** e não relacionadas aos módulos
> documentados aqui — decorrem de trabalho em andamento não commitado (rate limiter Redis em
> `src/lib/rate-limit.ts`, rotas `register`/`chat` e `.agents/hooks`). Os arquivos falhando:
> `api-auth-register`, `api-pipeline`, `gupy-client`, `gupy-step`, `inhire-scraper`,
> `recommendation`, `.agents/hooks/tests/antigravity`, `coverage/di-container`,
> `coverage/header-footer-full`, `coverage/seo-pages`.

## Inventário Real de Testes

| Arquivo | Módulo | Status |
|---------|--------|--------|
| `dedup-engine.test.ts` | Dedup | ✅ |
| `progress-emitter.test.ts` | Pipeline | ✅ |
| `discovery-step.test.ts` | Pipeline | ✅ |
| `gupy-step.test.ts` | Pipeline | ❌ (pré-existente) |
| `inhire-step.test.ts` | Pipeline | ✅ |
| `save-step.test.ts` | Pipeline | ✅ |
| `inhire-scraper.test.ts` | Scraper | ❌ (pré-existente) |
| `gupy-client.test.ts` | MCP | ❌ (pré-existente) |
| `mcp-gupy-validator.test.ts` | MCP | ✅ |
| `company-discovery.test.ts` | Discovery | ✅ |
| `recommendation.test.ts` | Matching | ❌ (pré-existente) |
| `skill-extractor.test.ts` | AI | ✅ |
| `pii-redactor.test.ts` | AI (PII) | ✅ |
| `chat-thread-limit.test.ts` | AI (limites) | ✅ |
| `rate-limiter.test.ts` | Security | ✅ |
| `rate-limit.test.ts` | Security (Redis) | ❌ (pré-existente) |
| `env-validator.test.ts` | Security | ✅ |
| `browser-storage.test.ts` | Storage (IndexedDB) | ✅ |
| `api-health.test.ts` | API | ✅ |
| `api-empresas.test.ts` | API | ❌ (pré-existente) |
| `api-auth-register.test.ts` | API | ❌ (pré-existente) |
| `api-pipeline.test.ts` | API | ❌ (pré-existente) |
| `api-export.test.ts` | API | ❌ (pré-existente) |
| `api-profile.test.ts` | API | ❌ (pré-existente) |
| `api-vagas.test.ts` | API | ❌ (pré-existente) |
| `middleware.test.ts` | API | ❌ (pré-existente) |
| `chat-sidebar.test.tsx` | UI | ✅ |
| `profile-ai-preview.test.tsx` | UI | ✅ |
| `confirm-dialog.test.tsx` | UI | ✅ |
| `error-boundary.test.tsx` | UI | ✅ |
| `snackbar-hook.test.tsx` | UI | ✅ |
| `coverage/*` (13 arquivos) | Cobertura | Misto |

## Matriz de Rastreabilidade (Teste → Regra)

| Test ID | Name | Rule (business-rules.md) | Type | Status |
|---------|------|--------------------------|------|--------|
| T001 | dedup_by_link_keeps_first | DedupEngine Rule 1 | Unit | ✅ |
| T002 | merge_sources_skips_duplicates | DedupEngine Rule 3 | Unit | ✅ |
| T003 | progress_emitter_buffers_and_replays | ProgressEmitter Rule 2,4 | Unit | ✅ |
| T004 | rate_limiter_blocks_after_limit | RateLimiter Rule 1,2,3 | Unit | ✅ |
| T005 | env_validator_logs_missing_vars | EnvValidator Rule 1 | Unit | ✅ |
| T006 | browser_storage_round_trip | browserStorage Rule 2 | Unit | ✅ |
| T007 | browser_storage_migrates_legacy_keys | browserStorage Rule 5 | Unit | ✅ |
| T008 | recommendation_ranks_by_profile | recommendation (token overlap) | Unit | ❌ (pré-existente) |
| T009 | pii_redactor_hides_pii | PII redactor | Unit | ✅ |

## Módulos por Complexidade/Risco

| Módulo | Risco | Razão |
|--------|-------|-------|
| SkillExtractor | 🔴 ALTO | Regex + taxonomy + NER — extração frágil |
| Pipeline Steps | 🔴 ALTO | Orquestração de APIs externas + DB |
| API Routes | 🔴 ALTO | Integração com auth + DB — segurança crítica |
| RateLimiter | 🟡 MÉDIO | Configuração errada = DoS |
| DedupEngine | 🟡 MÉDIO | Qualidade de dados — duplicatas afetam UX |
| browserStorage | 🟢 BAIXO | Wrapper IndexedDB (idb) |
| UI Components | 🟢 BAIXO | Presentacionais — sem lógica de negócio |

## Bugs Corrigidos Durante o Processo

| Arquivo | Bug | Correção |
|---------|-----|----------|
| `skill-extractor.ts` | Regex `anos?\s*of` não casava "years of experience" | Alterado para `years?\s*of` |

## Próximas Iterações (Recomendado)

- **E2E (Playwright)**: atualizar `e2e/fluxos-principais.spec.ts` — ainda referencia textos antigos da UI ("EXECUTAR BUSCA", "PROGRESSO"); o botão atual é "BUSCAR VAGAS EM TEMPO REAL".
- **Cobertura**: suíte tem falhas pré-existentes a corrigir (rate-limit Redis, register, chat) antes de mirar 100%.
- **Integração real**: repositories com banco de testes PostgreSQL.
