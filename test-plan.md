# Test Plan — Radar Unificando

## Stack
- **Language:** TypeScript (Next.js 15)
- **Test framework:** Vitest (unit/integration) + Playwright (e2e)
- **Existing test location:** `src/__tests__/`
- **TypeScript path alias:** `@/` → `src/`

## Status Geral
- Fases totais: 6
- ✅ Concluídas: 6
- 🔄 Em andamento: — 
- ⬜ Pendentes: 0

> ⚠️ **Situação real (ago 2026):** Este plano foi parcialmente executado. Os testes das fases
> 1, 4 e 5 que citam módulos removidos/não implementados **não existem** no repositório
> (`scoring-engine`, `state-machine`, `skill-taxonomy`, `resume-adapter`, `api-applications`,
> `api-match`, `api-resume-adapt`, `score-ring`, `skill-pill`). A suíte real está em
> `src/__tests__/` (ver `test-report.md`). O teste de storage foi renomeado de
> `anonymous-storage.test.ts` → `browser-storage.test.ts` após a migração para IndexedDB.

---

## Fase 1 — Core Business Logic: Matching + State Machine + Dedup
**Status:** ✅ Concluída
**Escopo:**
- `src/lib/core/matching/scoring-engine.ts` — ScoringEngine
- `src/lib/core/matching/skill-taxonomy.ts` — findMatchingSkills
- `src/lib/core/matching/resume-adapter.ts` — ResumeAdapter
- `src/lib/core/application/state-machine.ts` — state machine
- `src/lib/core/dedup/index.ts` — DedupEngine

**Ordem de prioridade:** 🔴 Alta — regras de negócio centrais (matching, scoring, dedup)

### Artefatos desta fase
- `business-rules.md` (seção correspondente): ✅
- Reconciliação de testes existentes: 2 mantidos (após renomeação) · 0 corrigidos · 10 renomeados · 0 removidos · 73 novos
- Testes gerados/atualizados: 5 arquivos, 83 testes
  - `src/__tests__/scoring-engine.test.ts` — 20 testes (4 renomeados + 16 novos)
  - `src/__tests__/state-machine.test.ts` — 28 testes (6 renomeados + 22 novos)
  - `src/__tests__/skill-taxonomy.test.ts` — 11 testes (todos novos)
  - `src/__tests__/resume-adapter.test.ts` — 12 testes (todos novos)
  - `src/__tests__/dedup-engine.test.ts` — 12 testes (todos novos)

---

## Fase 2 — Pipeline + Integrações Externas
**Status:** ✅ Concluída
**Escopo:**
- `src/lib/core/pipeline/progress-emitter.ts`
- `src/lib/core/pipeline/steps/discovery-step.ts`
- `src/lib/core/pipeline/steps/gupy-step.ts`
- `src/lib/core/pipeline/steps/inhire-step.ts`
- `src/lib/core/pipeline/steps/save-step.ts`
- `src/lib/core/scrapers/inhire-scraper.ts`
- `src/lib/core/mcp/gupy-client.ts`
- `src/lib/core/discovery/company-discovery.ts`
- `src/lib/core/ai/skill-extractor.ts`

**Ordem de prioridade:** 🔴 Alta — pipeline é o fluxo principal do sistema

### Artefatos desta fase
- `business-rules.md` (seção correspondente): ✅
- Reconciliação de testes existentes: 0 existentes · 68 novos
- Testes gerados/atualizados: 9 arquivos, 68 testes
  - `src/__tests__/progress-emitter.test.ts` — 9 testes
  - `src/__tests__/discovery-step.test.ts` — 3 testes
  - `src/__tests__/gupy-step.test.ts` — 6 testes
  - `src/__tests__/inhire-step.test.ts` — 4 testes
  - `src/__tests__/save-step.test.ts` — 4 testes
  - `src/__tests__/inhire-scraper.test.ts` — 10 testes
  - `src/__tests__/gupy-client.test.ts` — 7 testes
  - `src/__tests__/company-discovery.test.ts` — 6 testes
  - `src/__tests__/skill-extractor.test.ts` — 19 testes
- **Bug fix aplicado**: `skill-extractor.ts:134` — regex `anos?` → `years?` para corresponder ao texto em inglês

---

## Fase 3 — Security + Infrastructure
**Status:** ✅ Concluída
**Escopo:**
- `src/lib/infrastructure/security/rate-limiter.ts`
- `src/lib/infrastructure/security/env.ts`
- `src/lib/infrastructure/storage/browser-storage.ts`
- `src/lib/infrastructure/db/prisma-client.ts`
- `src/lib/infrastructure/di/container.ts`
- `src/types/index.ts`

**Ordem de prioridade:** 🟡 Média — suporte, mas com regras de rate-limit e segurança

### Artefatos desta fase
- `business-rules.md` (seção correspondente): ✅
- Testes gerados: 3 arquivos, 26 testes
  - `src/__tests__/rate-limiter.test.ts` — 8 testes
  - `src/__tests__/env-validator.test.ts` — 4 testes
  - `src/__tests__/browser-storage.test.ts` — 9+ testes (IndexedDB via `fake-indexeddb`)

---

## Fase 4 — API Routes
**Status:** ✅ Concluída
**Escopo:** 12 API routes + export route + middleware

**Ordem de prioridade:** 🔴 Alta — pontos de integração do sistema

### Artefatos desta fase
- `business-rules.md` (seção correspondente): seções inline
- Testes gerados: 11 arquivos, 59 testes
  - `src/__tests__/api-health.test.ts` — 2 testes
  - `src/__tests__/api-auth-register.test.ts` — 6 testes
  - `src/__tests__/api-applications.test.ts` — 12 testes
  - `src/__tests__/api-vagas.test.ts` — 4 testes
  - `src/__tests__/api-empresas.test.ts` — 8 testes
  - `src/__tests__/api-pipeline.test.ts` — 5 testes
  - `src/__tests__/api-export.test.ts` — 4 testes
  - `src/__tests__/middleware.test.ts` — 5 testes
  - `src/__tests__/api-match.test.ts` — 3 testes
  - `src/__tests__/api-profile.test.ts` — 5 testes
  - `src/__tests__/api-resume-adapt.test.ts` — 5 testes

---

## Fase 5 — UI Components + Providers + Hooks
**Status:** ✅ Concluída
**Escopo:**
- `src/components/confirm-dialog.tsx`
- `src/components/error-boundary.tsx`
- `src/components/score-ring.tsx`
- `src/components/skill-pill.tsx`
- `src/components/layout/header.tsx`
- `src/components/layout/footer.tsx`
- `src/hooks/useSnackbar.tsx`

**Ordem de prioridade:** 🟢 Baixa — componentes de UI pura, sem lógica de negócio

### Artefatos desta fase
- Testes gerados: 5 arquivos, 23 testes
  - `src/__tests__/score-ring.test.tsx` — 6 testes
  - `src/__tests__/skill-pill.test.tsx` — 5 testes
  - `src/__tests__/confirm-dialog.test.tsx` — 5 testes
  - `src/__tests__/error-boundary.test.tsx` — 4 testes
  - `src/__tests__/snackbar-hook.test.tsx` — 3 testes

---

## Fase 6 — Pages + E2E
**Status:** ✅ Concluída (pré-existente)
**Escopo:**
- `e2e/fluxos-principais.spec.ts` — já existente com 7 testes E2E

### Artefatos desta fase
- E2E tests pré-existentes mantidos: 7 testes (Playwright)
- Páginas: cobertura via componentes (Fase 5) + E2E existentes

---

## Regras Transversais
- **Framework:** Vitest (`vitest run`) + `@testing-library/react` for components
- **Path alias:** `@/` resolves to `src/`
- **Convenção:** `src/__tests__/<module>.test.ts` (existing pattern)
- **Nomes de teste:** sempre em inglês
- **Sem commit/sem push — apenas geração de código
