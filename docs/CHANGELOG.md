# Changelog — Radar Unificando

Todas as mudanças relevantes do projeto são documentadas aqui, por release (tag do git).
Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/).

## [Não lançado]

Nenhuma mudança desde `v4.0.0`.

---

## [4.0.0] — 2026-08-20

### Adicionado
- **Dicas de carreira** (`/dicas`): hub SSG+ISR com catálogo de artigos, categorias, FAQ, JSON-LD
- Schemas de SEO para cursos (`CourseListSchema`) e FAQs, com dados estruturados adicionais em `busca`, `cursos/[skill]` e layout raiz
- **Currículo adaptado (PDF + Word)**: `generate_resume` (tool de chat) + `POST /api/resume/generate`, com histórico paginado (`/api/resume/history`)
- **E-mail de boas-vindas** via Resend, com fallback em dev sem `RESEND_API_KEY`
- **Painel admin** (`/admin`): métricas de usuários, logins, buscas, tokens e cursos por dia (Recharts)
- Suíte de ferramentas de IA para análise de vaga/currículo (ATS, carta de apresentação, perguntas de entrevista)
- Conformidade **LGPD**: exportação e exclusão de dados, limpeza automática por retenção
- Fluxo de **recuperação de senha** com rate limiting multi-camada (IP + e-mail)
- Catálogo de cursos Udemy via Impact API (busca dinâmica, cache Redis, recomendações no chat e sidebar)
- Filtros de **relevância** e **frescor** de vagas no pipeline; expansão híbrida de queries (mapa curado + IA)
- Banner de aviso de currículo desatualizado (60+ dias) na aba de perfil
- Cloudflare Web Analytics, banner de consentimento de cookies (LGPD)

### Alterado
- Stack atualizado para **Next.js 16**
- Chamadas de LLM centralizadas em módulo único, com timeouts via `AbortSignal` e tratamento de erro unificado
- Perfil (`/perfil`) modularizado em `ProfileTab` / `GeneratedResumesTab`
- Rate limiter e configuração de navegação centralizados
- Documentação consolidada (`DESIGN.md`, `COSTS.md` movidos para `docs/`)

### Refatorado (auditoria técnica)
- **Design tokens centralizados** em `tokens.ts` — 27 componentes MUI atualizados para usar tokens em vez de valores hardcoded
- **Helpers de rotas** extraídos para `route-helpers.ts` (getClientIp, rateLimitResponse, validationErrorResponse, routeErrorResponse) — 3 rotas auth atualizadas
- **Download PDF/DOCX consolidado** — `downloadAdaptedResume` e `downloadAdaptedResumeDocx` unificados em função única com parâmetro `format`
- **God Hooks decompostos**: `useJobFiltersState` extraído de `useJobSearch`, `useChatUsage` extraído de `useChatConversation`
- **DI no pipeline**: `PipelineDeps` interface com defaults — permite injeção de mocks em testes
- **Factory pattern no LLM**: `createLlmProvider()` — provider criado via factory, testável
- **Dependência morta removida**: `picocolors` (zero referências no codebase)
- **Cobertura de testes expandida**: novos testes unitários para hooks (`useChatUsage`, `useJobFiltersState`), helpers de rotas, download de currículo e componentes de UI (dashboard admin, chat, schemas de SEO, gráficos)

### Corrigido
- Tratamento de sessões obsoletas e violações de FK em rotas de API e jobs em background
- Regex de busca (`search-jobs`) restrita a caracteres alfanuméricos
- Payload de fallback do LLM (remoção de parâmetros inválidos)

### Segurança
- Prevenção de XSS armazenado em `JobPostingSchema` e validação de URLs em Markdown no chat
- Módulo compartilhado de proteção anti prompt-injection aplicado a todos os geradores de prompt
- Sanitização de dados sensíveis em logs
- Remoção de `unsafe-eval` do CSP

### Removido
- Suporte à plataforma Alura
- Páginas públicas de listagem de vagas (consolidadas em navegação central)
- Tabela `sessions` não utilizada
- Relatório LGPD obsoleto

---

## [3.0.0] — 2026-08-07

### Adicionado
- **Análise ATS** dedicada (`POST /api/ats/analyze`) com UI própria
- Página de doação com seção de custos transparentes
- Limites diários e mensais de tokens para uso do chat
- Service worker (PWA) com estratégia de cache
- Processamento assíncrono de upload de currículo com polling de status
- Documentação da extensão Chrome (análise de vaga, dicas de currículo)

### Alterado
- Padronização de código: variáveis/campos renomeados de português para inglês em toda a base
- Limites de tokens de LLM aumentados; ajustes de timeout do Nginx
- Configuração de portas locais e diretórios de build/dev reorganizada

---

## [2.0.0] — 2026-08-04

Redesign completo do projeto ("v2 redesign"), em 5 fases.

### Adicionado
- **Fase 1**: Auth.js (credentials + JWT), migração para PostgreSQL, tema MUI, home unificada, login/registro
- **Fase 2**: cliente Gupy MCP, scrapers adaptados para PostgreSQL, rotas de API com autenticação
- **Fase 3**: perfil + matching engine (score com 9 componentes), taxonomia de skills
- **Fase 4**: Kanban de candidaturas (18 estágios, state machine, API)
- **Fase 5**: navegação com links de dashboard, polish de UI
- Assistente de chat IA com proteção anti prompt-injection e rate limiting (Redis + fallback em memória)
- Design system neo-brutalista
- SEO: dados estruturados, manifest, sitemap/robots
- Persistência em IndexedDB com redação de PII
- Página "Sobre", validação de força de senha

### Alterado
- Migração de `drizzle-orm` para **Prisma ORM**

### Removido
- ~30 arquivos de código morto (scrapers, repositórios e páginas antigas do v1)

---

## [1.0.0] — 2026-07-29

Versão inicial da migração do scraper `busca-vagas-gupy-inhire` para aplicação web em Next.js.

### Adicionado
- Scraper local + SQLite
- UI brutalista inicial
- Middleware de segurança, rate limiter, validação de env, limites de Docker, security headers
