# Testid Plan — Radar Unificando

## Status Geral
- Fases totais: 7 | Concluídas: 7 | Em andamento: — | Pendentes: 0
- Arquivos editados: 91 | Testids aplicados: ~250 | Convenção: `contexto-elemento-acao` (kebab-case, pt-BR)
- Relatório final: `testid-changes-report.md`

## Convenção Adotada (Etapa 1)
Não existia nenhum `data-testid` em código de produção. Convenção definida:

- **Formato:** `contexto-elemento-acao` em kebab-case, idioma pt-BR (consistente com o app e com os specs E2E em português).
- **Exemplos:** `login-email-input`, `busca-submit-button`, `chat-message-bubble`, `doar-copy-pix-button`, `job-table-row`.
- **Elementos relevantes:** interativos (botões, links, inputs, selects, checkboxes, textareas, modais/drawers, tabs, itens de lista dinâmica) e mensagens de estado (erro/sucesso/vazio/loading).
- **Não aplica:** ícones puramente decorativos, texto estático sem interação/asserção relevante, componentes que não renderizam DOM testável (schema SEO, renderizadores PDF, providers de contexto sem UI).
- **Ambiguidade:** elemento ambíguo NUNCA recebe testid no chute — vira pendência de revisão.
- **Regra de ouro:** alteração estritamente aditiva — apenas o atributo `data-testid`, sem tocar markup, lógica, estilo ou texto.

---

## Fase 1 — Layout, Navegação, Auth e UI Forms
Status: ✅ Concluída (16 arquivos)
Escopo: `src/components/layout/*`, `src/app/layout.tsx`, `error.tsx`, `not-found.tsx`, `src/app/(auth)/*`, `src/components/ui/form-field.tsx`, `password-strength-meter.tsx`, `tag-input.tsx`, `confirm-dialog.tsx`

### Artefatos desta fase
- Elementos com testid aplicado: footer (8), header (4), mobile-floating-bar (2), mobile-nav (12), user-menu (8), layout skip (1), error (2), not-found (1), login (8), register (10), forgot-password (4), reset-password (8), form-field (1), password-strength-meter (4), tag-input (3), confirm-dialog (3)
- Pendências de revisão: `header-nav-link` e `mobile-nav-link` são compartilhados por múltiplos links (.map) — usar `getByTestId().filter({hasText})`; `password-strength-criterion` compartilhado (idem)

---

## Fase 2 — Páginas Institucionais e UI Base
Status: ✅ Concluída (11 arquivos)
Escopo: `src/app/sobre/*`, `src/app/termos/*`, `src/app/doar/*`, `src/app/extensao/*`, `src/components/ui/cookie-consent.tsx`, `cookie-settings-link.tsx`, `pwa-register.tsx`, `console-easter-egg.tsx`, `section-eyebrow.tsx`, `error-boundary.tsx`, `base-card.tsx`, `src/hooks/useSnackbar.tsx`

### Artefatos desta fase
- Elementos com testid aplicado: sobre (9), termos (13), doar-content (4), extensao (8), cookie-consent (4), cookie-settings-link (1), useSnackbar (1)
- Pendências de revisão: sem JSX/UI (SEM ALTERAÇÃO): pwa-register (null), console-easter-egg (null), error-boundary, section-eyebrow, base-card, doar/page; termos tem links "Meu Perfil"/"Sobre" duplicados em seções — distinguir por seção se E2E precisar

---

## Fase 3 — Chat
Status: ✅ Concluída (15 arquivos, 39 testids)
Escopo: `src/components/chat/*` (17 arquivos), `src/contexts/chat-assistant-context.tsx`

### Artefatos desta fase
- Elementos com testid aplicado: chat-header (5), chat-input (2), chat-limit-banner (8), chat-message-bubble (2), chat-message-list (2), chat-quick-actions (1), chat-sidebar (4), chat-suggested-replies (1), chat-suggestions (1), chat-typing-indicator (1), chat-ui (2), copy-message-button (1), course-card (2), job-card (5), markdown-content (1)
- Pendências de revisão: SEM ALTERAÇÃO: chat-mount (sem DOM), icons (decorativos), chat-assistant-context (sem JSX); ConfirmDialog/AtsAnalysisDrawer foram resolvidos em outras fases (componentes receberam testid na raiz)

---

## Fase 4 — Busca e Job Table
Status: ✅ Concluída (14 arquivos)
Escopo: `src/app/busca/*`, `src/components/busca/*`, `src/components/job-table/*` (10 arquivos), `src/components/shared/job-search-bar.tsx`

### Artefatos desta fase
- Elementos com testid aplicado: busca-client (1), busca-header (2), course-recommendation-sidebar (3), job-desktop-table (5), job-empty-state (2), job-filters-desktop (10), job-filters-drawer (8), job-filters-mobile (8), job-loading-skeleton (1), job-mobile-card (4), job-mobile-list (3), job-table-header (2), job-table (1), job-search-bar (5)
- Pendências de revisão: variantes desktop/mobile ficam montadas no DOM (display:none) — testids únicos por variante (decisão correta); SEM ALTERAÇÃO: busca/layout, busca/page (JSON-LD)

---

## Fase 5 — Home, Cursos e Dicas
Status: ✅ Concluída (16 arquivos)
Escopo: `src/app/page.tsx`, `src/components/home/*`, `src/app/cursos/*` + `src/components/cursos/*`, `src/app/dicas/*` + `src/components/dicas/*`, `src/components/shared/support-section.tsx`, `chat-teaser.tsx`

### Artefatos desta fase
- Elementos com testid aplicado: extension-section (1), faq-section (3), loading-overlay (1), marketing-hero (1), results-section (1), cursos/page (2), cursos/[skill] (1), course-fallback-cta (2), course-card (2), course-grid (1), dicas/page (3), dicas/[slug] (2), dica-card-grid (1), dica-card (2), support-section (2), chat-teaser (3)
- Pendências de revisão: SEM ALTERAÇÃO: app/page (compõe), rotating-text (marquee decorativo), cursos/layout, dicas/layout (children)

---

## Fase 6 — Admin
Status: ✅ Concluída (9 arquivos, 16 testids)
Escopo: `src/app/admin/*`, `src/components/admin/*` (incluindo `charts/`)

### Artefatos desta fase
- Elementos com testid aplicado: admin/page (1), admin/usuarios (1), admin-dashboard-tabs (3), admin-nav (1), date-range-filter (8), stat-card (1), users-table (3), category-bar-chart (1), series-chart (1)
- Pendências de revisão: SEM ALTERAÇÃO: admin/layout (container), auto-refresh (null), admin-dashboard-client (compõe já marcados)

---

## Fase 7 — Perfil, Dashboard e ATS
Status: ✅ Concluída (13 arquivos)
Escopo: `src/app/(dashboard)/*`, `src/components/profile/*`, `src/components/resume/*`, `src/components/ats/*`

### Artefatos desta fase
- Elementos com testid aplicado: extensao/conectar (4), token-box (6), perfil (5), ats-analysis-section (3), generated-resumes-tab (15), outdated-profile-banner (2), profile-completion-card (2), profile-import-section (4), profile-review-section (5), ats-analysis-drawer (11), ats-results-content (5), skill-input (6, aplicado na consolidação), resume-progress-toast (1, aplicado na consolidação)
- Pendências de revisão: SEM ALTERAÇÃO: (dashboard)/layout (fragment, sem DOM); BaseCard não propaga props extras (seções em BaseCard ficam sem testid no wrapper — aceito); botões de categoria rápida de skills (`profile-skill-category-{cat}`) deixados para padronização futura; wrapper interno do ats-drawer renomeado para `ats-generating-progress` (evita duplicata com `resume-progress-toast`)