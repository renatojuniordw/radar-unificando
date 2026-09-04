# 🧪 Relatório de Testes E2E — Testes-E2E

**Projeto:** Radar Unificando (Next.js 16 / React 19 / Playwright)
**Data:** 2026-09-02
**Prompt:** `testes-e2e` (prompts-unificando) — aplicado sobre o `testid-changes-report.md` (auditoria concluída antes)

---

## 1. Etapa 0 — Estado inicial

- Stack E2E existente: Playwright (`testDir: ./e2e`), 3 specs (86 linhas), specfile autônomos, sem helpers/globalSetup.
- **Seletores pré-existentes: frágeis** — `getByLabel`, `getByText`, `locator('button[type="submit"]')`; nenhum consumia `data-testid`.
- Rate-limit real: registro 3/dia (`register_daily`) + 5/min (`auth`) → registro inline em E2E estoura rapidamente (memória do time: "login sem registro").
- Cookie LGPD: dialog fixo no rodapé, persistente via `localStorage['cookie_consent']` — pode bloquear cliques no rodapé.

## 2. Etapa 0.5 — Critério de elegibilidade

Fluxo merece E2E quando: **crítico para a proposta + atravessa múltiplas camadas (UI → API → estado) + tem valor de regressão ponta-a-ponta**.

| Fluxo | Veredito | Justificativa |
|---|---|---|
| Busca de vagas → tabela/estado vazio | ✅ Elegível | Core do produto, multi-camada |
| Perfil → análise ATS → currículos | ✅ Elegível | Jornada autenticada crítica com API |
| Admin → métricas + proteção 404 | ✅ Elegível | Gestão interna, regra de role |
| Cursos → catálogo + fallback 404 | ✅ Elegível | Descoberta de conteúdo |
| Dicas → lista + conteúdo | ✅ Elegível | Conteúdo/SEO |
| LGPD → consentimento de cookies | ✅ Elegível | Conformidade, quebrou antes |
| Registro com validações (edge cases) | ❌ Não elegível | Regra de negócio granular → unit/integration |
| Chamadas de API isoladas (health) | ❌ Não elegível | Sem interação de UI — mantido como smoke no spec existente |

**Decisões-chave (assumidas e registradas):**
1. Registro via UI removido dos E2E → **login com usuário seedado no globalSetup** (rate-limit + memória do time). Cobertura do registro fica no nível unit/integration.
2. Dependências externas tratadas com **mock por `page.route`** (substitui resposta sem tocar o código): `/api/vagas` (busca vazia/1 vaga) e `/api/ats/analyze` (resultado ATS) → determinístico e sem custo de LLM.
3. Falha real (sem mock) usada onde é determinística: ATS **400 "Nenhum currículo encontrado"** (usuário seedado não tem Profile) e **404 para não-admin/slug inexistente**.

## 3. Artefatos criados

### Helpers e setup (Novos)
| Arquivo | Papel |
|---|---|
| `e2e/helpers/env.ts` | Carrega `.env.local`/`.env` para o globalSetup (roda fora do Next — gotcha conhecido) |
| `e2e/helpers/seed.ts` | Usuários `E2E_USER` (role user, sem Profile) e `E2E_ADMIN` (role admin) — upsert via Prisma com bcrypt |
| `e2e/helpers/auth.ts` | `login()` (só p/ setup), `dismissCookieConsent()` (tolerante a corrida), `go()` (navegação autenticada) |
| `e2e/global-setup.ts` | Pré-seed dos usuários antes da suíte |
| `e2e/auth.setup.ts` | **Project de setup** — autentica user/admin 1x e salva storageState em `e2e/.auth/` (elimina rate-limit de auth 5/min) |
| `playwright.config.ts` | + `globalSetup` + `projects` (setup → e2e com `dependencies`) + ignore via `.gitignore` |

### Specs novos (6)
| Spec | Jornadas (happy + falha) |
|---|---|
| `busca-vagas.spec.ts` | vaga retornada (mock 1 job) → `job-table`/`job-table-row`; sem resultado (mock []) → `job-empty-state` + `clear-filters` (filtro ativo via input de busca) |
| `perfil-resumo.spec.ts` | setup (sem perfil) → CTA IMPORTAR CURRÍCULO revela dropzone; importação via texto (mock upload + mock LLM) → ATS `ats-results-content`/`ats-checklist`; aba currículos → `generated-resumes-empty` |
| `admin-metricas.spec.ts` | admin (storageState admin) → dashboard/nav/date-range; usuário comum (storageState user) → `not-found-voltar-link` (404) |
| `cursos.spec.ts` | catálogo → `course-grid`/`course-card`; skill inexistente → 404 |
| `dicas.spec.ts` | lista → `dica-card-grid` + abre `dica-page`; slug inexistente → 404 |
| `lgpd-cookies.spec.ts` | aceitar → dialog some + localStorage `accepted`; recusar → `declined`; reabrir via `cookie-settings-open-button` |

### Specs reconciliados (3)
| Spec | Antes | Depois |
|---|---|---|
| `chat-limites.spec.ts` | registro inline (email efêmero, estoura rate-limit) + labels + `button[type=submit]` | **Reescrito**: storageState user + testids (`chat-open-button`, `chat-drawer`) |
| `doacao.spec.ts` | `getByRole('link', {name:/apoiar/i})` etc. | **Corrigido**: `footer-apoiar-link`, `doar-copy-pix-button`, `doar-costs-link` + dismiss cookie; assert copiado usa `/pix copiado/i` |
| `fluxos-principais.spec.ts` | seletores por texto/role | **Ajustado**: + dismiss cookie; copy hero atualizado (`busca em tempo real`); demais asserts mantidos |

## 4. Reconciliação consolidada

- **Mantidos (7):** fluxos-principais (nav login/register, guards `/perfil`+`/admin`, health)
- **Corrigidos (3):** chat-limites, doacao, fluxos-principais (seletores + consenso cookie)
- **Removidos (0):** nenhum — registro da suíte saiu do E2E, mas o fluxo de login cobriu
- **Novos (6):** busca-vagas, perfil-resumo, admin-metricas, cursos, dicas, lgpd-cookies
- **Total: 23 testes em 9 arquivos + 2 setups** (antes: 4 testes em 3 arquivos) — execução local: **25 passed**

## 5. Regras de consistência aplicadas

- **Zero hard wait** — todos os asserts com auto-retry do Playwright; navegação pós-login via `waitForURL` com predicate
- **Seletores:** todos `getByTestId` (fonte de verdade: `testid-changes-report.md`); los elementos de texto não marcados usam role/texto estável como fallback
- **Cookie consent:** dismiss no início de toda jornada que clica em elementos afetados pelo rodapé
- **Reuso:** passo repetido vira helper (`login`, `dismissCookieConsent`, `loginAndGo`) — não copiado
- **Isolamento:** cada teste tem context novo; mocks via `page.route` restritos ao teste
- **Sem dependência de rede externa** (Impact/Udemy/LLM) no caminho crítico — mocks locais

## 6. Riscos residuais e suposições

| Risco/Suposição | Status | Mitigação |
|---|---|---|
| `course-card` depende de dados de catálogo no ambiente | **Assumido** | App tem fallback para catálogo interno quando a API Impact falha; se o catálogo estiver vazio no ambiente, o teste falha (cobertura parcial) |
| `dica-link` parte de conteúdo estático local | **Assumido** | Dicas são estáticas no repo — sem dependência externa |
| Admin usa dados reais do banco (sem mock) | **Assumido** | Asserts escolhidos não dependem de volume (só presence de title/nav/date-range) |
| ATS/importação dependem do usuário seed NÃO ter Profile | **Garantido** | Seed cria User sem Profile; extração mockada não persiste (sem clicar em Salvar) |
| Execução real | **Rodada OK** | **25 passed** localmente (dev limpo em porta alternativa — a 11010 tem container Docker antigo sem testids); verificação adversarial independente roda após este relatório |
| `page.route` não intercepta SSR | **Confirmado** | Mocks agem no client (fetch do browser); asserts finais garantem determinismo pós-hidratação |
| Rate-limit de auth (5/min) | **Resolvido** | storageState via project de setup — 1 login por usuário por execução |

## 7. Como rodar

```bash
npx playwright test         # sobe webServer (next dev :11010) + globalSetup + project setup (storageState) + specs
npx playwright test --list  # lista 23 testes + 2 setups
```

> **Atenção:** o container Docker `radar-unificando-app-1` na porta 11010 roda um build antigo **sem** os `data-testid` — para validar a suíte localmente use `next dev` em outra porta (ex.: 11021) com a config apontando para ela.

## 8. Próximo passo da cadeia

- Prompt **`ci-e2e`** — configurar a suíte (25 testes) para rodar em CI com os mesmos mocks/gates.
- Commit manual após revisão (nada foi commitado).