# 📋 Relatório de Mudanças — data-testid

**Projeto:** Radar Unificando (Next.js 16 / React 19 / MUI 7)
**Data:** 2026-09-02
**Escopo:** aplicação de `data-testid` em todos os elementos relevantes para teste E2E
**Formato:** kebab-case pt-BR `contexto-elemento-acao`

---

## 1. Resumo executivo

- **Arquivos alterados:** 90 arquivos TSX (somente aditivo — apenas o atributo `data-testid`)
- **Total de testids aplicados:** ~250
- **Zero mudança em:** markup, lógica, estilo, texto, ordem de props, aria-labels
- **Convenção definida:** nenhuma existia → estabelecida `contexto-elemento-acao` (kebab-case, pt-BR), listada em `testid-plan.md`
- **Execução:** 7 agentes em fases paralelas + consolidação manual (2 arquivos pendentes, aplicados)

## 2. Convenção adotada

```
contexto-elemento-acao
ex.: login-email-input | doar-copy-pix-button | chat-message-bubble | job-table-row | admin-users-table-row
```

- **Elementos que recebem:** interativos (Button, Link, input, TextField, Select, Checkbox, textarea, modais/drawers, tabs, itens de lista dinâmica) e mensagens de estado (erro/sucesso/vazio/loading)
- **Não recebem:** ícones decorativos, divs de layout puro, componentes sem DOM (providers, `return null`), conteúdo estático puro
- **Ambiguidade:** nunca chutar → registrada em "Pendências" (seção 4)

## 3. Mudanças por fase

### Fase 1 — Layout, Navegação, Auth e UI Forms (16 arquivos)

| Arquivo | Testids |
|---|---|
| `components/layout/footer.tsx` | footer-consultoria-link, -portfolio-link, -apoiar-link, -cursos-link, -dicas-link, -extensao-link, -sobre-link, -termos-link |
| `components/layout/header.tsx` | header-logo-link, header-nav-link (compartilhado), header-menu-button |
| `components/layout/mobile-floating-bar.tsx` | mobile-floating-bar-busca-link, -close-button |
| `components/layout/mobile-nav.tsx` | mobile-nav-drawer, -logo-link, -close-button, -perfil-link, -extensao-link, -logout-button, -login-link, -cadastro-link, -nav-link (compartilhado), -termos-link, -ecossistema-link |
| `components/layout/user-menu.tsx` | user-menu-login-link, -cadastro-link, -button, -dropdown, -perfil-link, -extensao-link, -admin-link, -logout-button |
| `app/layout.tsx` | layout-skip-link |
| `app/error.tsx` | app-error-alert, app-error-retry-button |
| `app/not-found.tsx` | not-found-voltar-link |
| `app/(auth)/login/login-form.tsx` | login-registered-success, login-api-error, login-email-input, login-senha-input, login-senha-toggle-button, login-esqueci-senha-link, login-submit-button, login-criar-conta-link |
| `app/(auth)/register/page.tsx` | cadastro-success-banner, cadastro-api-error, cadastro-nome-input, cadastro-email-input, cadastro-senha-input, cadastro-senha-toggle-button, cadastro-confirmar-senha-input, cadastro-confirmar-senha-toggle-button, cadastro-submit-button, cadastro-login-link |
| `app/(auth)/forgot-password/page.tsx` | recuperar-senha-success, -api-error, -email-input, -submit-button, -voltar-link |
| `app/(auth)/reset-password/page.tsx` | redefinir-senha-invalido, -solicitar-link, -api-error, -senha-input, -senha-toggle-button, -confirmar-senha-input, -confirmar-senha-toggle-button, -submit-button |
| `components/ui/form-field.tsx` | form-field-error |
| `components/ui/password-strength-meter.tsx` | password-strength-meter, -label, -criterion (compartilhado), -match-status |
| `components/ui/tag-input.tsx` | tag-input-chip-${tag}, tag-input-field, tag-input-hint |
| `components/ui/confirm-dialog.tsx` | confirm-dialog, -cancel-button, -confirm-button |

### Fase 2 — Páginas Institucionais e UI Base (11 arquivos)

| Arquivo | Testids |
|---|---|
| `app/sobre/page.tsx` | sobre-hero-section, -missao-section, -criador-section, -portfolio-link, -consultoria-link, -apoio-section, -pilares-section, -cta-section, -motor-busca-link |
| `app/termos/page.tsx` | termos-voltar-link, termos-secao-1..11, termos-dpo-email-link, termos-acessar-radar-link |
| `app/doar/doar-content.tsx` | doar-copy-pix-button, doar-valor-{label}, doar-transparencia-{title}, doar-costs-link |
| `app/extensao/page.tsx` | extensao-hero-section, -homologacao-banner, -conectar-button, -voltar-home-link, -recursos-section, -feature-{title}, -como-funciona-section, -etapa-{step}, -conectar-conta-button |
| `components/ui/cookie-consent.tsx` | cookie-consent-dialog, -policy-link, -decline-button, -accept-button |
| `components/ui/cookie-settings-link.tsx` | cookie-settings-open-button |
| `hooks/useSnackbar.tsx` | snackbar-message |

### Fase 3 — Chat (15 arquivos, 39 testids)

| Arquivo | Testids |
|---|---|
| `chat-header.tsx` | chat-header-typing-indicator, chat-sidebar-toggle-button, chat-new-chat-button, chat-close-button, chat-lgpd-link |
| `chat-input.tsx` | chat-input, chat-send-button |
| `chat-limit-banner.tsx` | chat-sync-error-banner, chat-thread-limit-banner, chat-thread-new-chat-button, chat-daily-limit-banner, chat-token-limit-banner, chat-token-limit-link, chat-budget-warning-banner, chat-budget-exhausted-banner |
| `chat-message-bubble.tsx` | chat-message-bubble, chat-retry-button |
| `chat-message-list.tsx` | chat-message-list, chat-scroll-bottom-button |
| `chat-quick-actions.tsx` | chat-quick-action-button |
| `chat-sidebar.tsx` | chat-sidebar, chat-sidebar-new-chat-button, chat-sidebar-empty, chat-conversation-item |
| `chat-suggested-replies.tsx` | chat-suggested-reply-button |
| `chat-suggestions.tsx` | chat-initial-suggestion-button |
| `chat-typing-indicator.tsx` | chat-typing-indicator |
| `chat-ui.tsx` | chat-open-button, chat-drawer |
| `copy-message-button.tsx` | chat-copy-message-button |
| `course-card.tsx` | chat-course-card, chat-course-link-button |
| `job-card.tsx` | chat-job-card, chat-job-link-button, chat-job-expand-button, chat-job-ats-button, chat-job-resume-button, chat-job-snackbar |
| `markdown-content.tsx` | chat-markdown-link |

### Fase 4 — Busca e Job Table (14 arquivos)

| Arquivo | Testids |
|---|---|
| `app/busca/busca-client.tsx` | busca-snackbar |
| `components/busca/busca-header.tsx` | busca-header, busca-cooldown-chip |
| `components/busca/course-recommendation-sidebar.tsx` | course-recommendation-sidebar, course-recommendation-catalog-link, course-recommendation-empty-state |
| `job-desktop-table.tsx` | job-table-desktop, job-table-row, job-table-apply-link, job-table-ats-button, job-table-resume-button |
| `job-empty-state.tsx` | job-empty-state, job-empty-state-clear-filters |
| `job-filters-desktop.tsx` | job-filters-desktop, -search, -submit, -advanced, -platform-chip, -type-chip, -active-chip, -clear |
| `job-filters-drawer.tsx` | job-filters-drawer, -close, -platform-select, -company-select, -type-select, -role-select, -submit, -clear |
| `job-filters-mobile.tsx` | job-filters-mobile, -search, -submit, -platform-chip, -modality-chip, -type-chip, -advanced, -clear |
| `job-loading-skeleton.tsx` | job-loading-skeleton |
| `job-mobile-card.tsx` | job-mobile-card, -apply-link, -ats-button, -resume-button |
| `job-mobile-list.tsx` | job-mobile-list, -pagination-prev, -pagination-next |
| `job-table-header.tsx` | job-table-header, job-table-export-button |
| `job-table.tsx` | job-table |
| `shared/job-search-bar.tsx` | job-search-bar, busca-submit-button, busca-role-suggestion-chip, busca-company-suggestion-chip |

### Fase 5 — Home, Cursos e Dicas (16 arquivos)

| Arquivo | Testids |
|---|---|
| `home/extension-section.tsx` | extension-link |
| `home/faq-section.tsx` | faq-item, faq-question-button, faq-answer |
| `home/loading-overlay.tsx` | loading-overlay |
| `home/marketing-hero.tsx` | home-hero |
| `home/results-section.tsx` | results-auto-sync |
| `app/cursos/page.tsx` | course-search-input, course-skill-link |
| `app/cursos/[skill]/page.tsx` | course-skill-page |
| `cursos/course-fallback-cta.tsx` | course-fallback-cta, course-fallback-link |
| `cursos/course-card.tsx` | course-card, course-link |
| `cursos/course-grid.tsx` | course-grid |
| `app/dicas/page.tsx` | dica-category-link, dica-import-resume-link |
| `app/dicas/[slug]/page.tsx` | dica-page, dica-import-resume-link |
| `dicas/dica-card-grid.tsx` | dica-card-grid |
| `dicas/dica-card.tsx` | dica-card, dica-link |
| `shared/support-section.tsx` | support-section, support-donate-link |
| `shared/chat-teaser.tsx` | chat-teaser, chat-teaser-login-link, chat-teaser-register-link |

### Fase 6 — Admin (9 arquivos, 16 testids)

| Arquivo | Testids |
|---|---|
| `app/admin/page.tsx` | admin-dashboard-title |
| `app/admin/usuarios/page.tsx` | admin-users-title |
| `admin-dashboard-tabs.tsx` | admin-tab-overview / -search / -infrastructure |
| `admin-nav.tsx` | admin-nav-link |
| `date-range-filter.tsx` | admin-date-range-filter, admin-date-range-preset-15/30/365, -custom, -from, -to, -apply |
| `stat-card.tsx` | admin-stat-card |
| `users-table.tsx` | admin-users-table, admin-users-table-empty, admin-users-table-row |
| `charts/category-bar-chart.tsx` | admin-chart-category |
| `charts/series-chart.tsx` | admin-chart-series |

### Fase 7 — Perfil, Dashboard e ATS (13 arquivos)

| Arquivo | Testids |
|---|---|
| `(dashboard)/extensao/conectar/page.tsx` | extensao-back-link, extensao-faq-item-1/2/3, extensao-guide-link |
| `(dashboard)/extensao/conectar/token-box.tsx` | token-box, token-pending-banner, token-connected-banner, token-display, token-toggle-visibility, token-copy-button |
| `(dashboard)/perfil/page.tsx` | profile-back-link, profile-tab-profile, profile-tab-resumes, profile-export-button, profile-delete-account-button |
| `profile/ats-analysis-section.tsx` | ats-analysis-section, ats-job-description-input, ats-analyze-button, ats-analysis-error |
| `profile/generated-resumes-tab.tsx` | generated-resumes-loading, generated-resumes-error, generated-resumes-retry-button, generated-resumes-empty, generated-resume-card, resume-download-pdf-button, resume-download-docx-button, resume-copy-button, resume-preview-button, generated-resumes-pagination, resume-preview-dialog, resume-preview-copy-button, resume-preview-close-button, resume-action-toast |
| `profile/outdated-profile-banner.tsx` | profile-outdated-banner, profile-update-now-button |
| `profile/profile-completion-card.tsx` | profile-completion-card, profile-completion-item |
| `profile/profile-import-section.tsx` | profile-import-progress, profile-import-dropzone, profile-import-file-input, profile-import-textarea, profile-import-text-button |
| `profile/profile-review-section.tsx` | profile-current-role-input, profile-seniority-select, profile-area-select, profile-experience-slider, profile-education-chip |
| `ats/ats-analysis-drawer.tsx` | ats-analysis-drawer, ats-analysis-loading, ats-analysis-error, ats-rate-limited, ats-generating-progress, ats-close-button, ats-retry-button, resume-download-button, resume-download-docx-button, ats-action-toast |
| `ats/ats-results-content.tsx` | ats-results-content, ats-checklist, ats-missing-keywords, ats-missing-keyword, ats-recommendations |
| `profile/skill-input.tsx` *(consolidação)* | profile-skill-input, profile-skill-tag, profile-skill-remove-button, profile-skill-input-field, profile-skill-suggestion-option, profile-skill-suggestion-button |
| `resume/resume-progress-toast.tsx` *(consolidação)* | resume-progress-toast |

---

## 4. Pendências de revisão (antes do commit)

| Item | Local | Decisão / Necessidade |
|---|---|---|
| `header-nav-link` / `mobile-nav-link` compartilhados | header.tsx:40/52, mobile-nav.tsx:214/233 | Usar `getByTestId(...).filter({ hasText })` no Playwright; aceito |
| `password-strength-criterion` compartilhado | password-strength-meter.tsx:109 | Idem — filtro por texto |
| Links duplicados em termos ("Meu Perfil"/"Sobre") | termos/page.tsx | Se E2E precisar, distinguir por seção (`termos-secao-7-*`) |
| Botões de categoria rápida de skills | profile-review-section.tsx:64-82 | Padronizar depois (`profile-skill-category-{cat}`) — não aplicado para evitar ambiguidade |
| `BaseCard` não propaga props extras | components/ui/base-card.tsx | Wrappers de seção em BaseCard sem testid — aceito (composição) |
| Variantes desktop/mobile no mesmo DOM | job-table (desktop) vs job-mobile-card | Testids únicos por variante — decisão correta (evita duplicados) |

## 5. Sem alteração (intencional)

- `chat-mount.tsx` (sem DOM), `chat/icons.tsx` (decorativos), `chat-assistant-context.tsx` (provider sem JSX)
- `(dashboard)/layout.tsx` (fragment), `busca/layout.tsx`, `busca/page.tsx` (schema JSON-LD)
- `pwa-register.tsx` / `console-easter-egg.tsx` (retornam null), `error-boundary.tsx` (delega)
- `section-eyebrow.tsx`, `base-card.tsx`, `rotating-text.tsx` (decorativos/estáticos)
- `login/page.tsx`, `(auth)/layout.tsx`, `doar/page.tsx`, `cursos/layout.tsx`, `dicas/layout.tsx` (compõem SEM JSX próprio)

## 6. Validação executada

- **Diff verificado:** 100% aditivo (apenas `data-testid`) — script de mismatch com 0 linhas perdidas reais (único falso positivo era template literal `` `admin-date-range-preset-${p.days}` ``, inspecionado manualmente)
- **`value={searchFilter}`** dos filtros conferido intacto após as edições
- **Duplicidade corrigida:** wrapper interno do ats-drawer renomeado de `resume-progress-toast` → `ats-generating-progress` para não colidir com o componente real
- **Próximo passo:** `npm run lint` + `npm run build` (via verificação independente) antes do commit manual
- **Próximo prompt da cadeia:** `testes-e2e` (consome este relatório como entrada)