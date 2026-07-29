# Radar Unificando — Plano de Evolução v2

> Documento mestre que consolida todo o planejamento da versão 2.
> Data: Julho 2026 · Branch: `v2/redesign`

---

## Sumário

1. [Visão Geral](#1-visão-geral)
2. [Branch Strategy](#2-branch-strategy)
3. [Arquitetura](#3-arquitetura)
4. [Stack Decidida](#4-stack-decidida)
5. [Banco de Dados](#5-banco-de-dados)
6. [Design System](#6-design-system)
7. [UX — Flow Unificado](#7-ux--flow-unificado)
8. [Modelo de Usuário](#8-modelo-de-usuário)
9. [Funcionalidades por Tipo de Usuário](#9-funcionalidades-por-tipo-de-usuário)
10. [Gupy MCP](#10-gupy-mcp)
11. [AI no Browser (Transformers.js)](#11-ai-no-browser-transformersjs)
12. [Plano de Implementação (Fases)](#12-plano-de-implementação-fases)
13. [Documentação](#13-documentação)
14. [Dependências Novas](#14-dependências-novas)
15. [Perguntas Pendentes](#15-perguntas-pendentes)

---

## 1. Visão Geral

**Produto:** Radar Unificando — plataforma de busca inteligente de vagas 100% remotas
**Público:** Candidatos a vagas de Dados, BI, Business e Growth
**Propósito:** Unificar scrapers de Gupy + InHire com matching de perfil e acompanhamento de candidaturas

**v1 (atual):** Scraper local + SQLite + Brutalist UI + Docker
**v2 (planejada):** Plataforma multi-usuário + PostgreSQL + Auth + Matching + Kanban + AI browser

---

## 2. Branch Strategy

```
main                 → v1 funcional (atual, produção)
  └── v2/redesign    → Todo desenvolvimento da v2
       ├── fase-1    → Auth + PostgreSQL + MUI setup
       ├── fase-2    → Gupy MCP + scrapers adaptados
       ├── fase-3    → Perfil + matching engine
       ├── fase-4    → Kanban + aplicações
       └── fase-5    → Documentação + polimento
```

Merge na `main` apenas quando a v2 estiver completa e testada.

---

## 3. Arquitetura

### Camadas (Dependência Inward)

```
┌─────────────────────────────────────────────────────────┐
│                   Presentation Layer                     │
│  Next.js 15 App Router + MUI 7 + Tailwind v4            │
│  ├── (public/)    → páginas anônimas (busca rápida)     │
│  ├── (auth)/      → login/register                      │
│  └── (dashboard)/ → logado (perfil, match, kanban)      │
├─────────────────────────────────────────────────────────┤
│                     API Layer                            │
│  ├── Route Handlers (REST)                              │
│  ├── Server Actions (Auth.js, mutations)                │
│  └── Auth.js v5 (NextAuth)                             │
├─────────────────────────────────────────────────────────┤
│                   Application Layer                      │
│  ├── PipelineOrchestrator (scrapers)                    │
│  ├── MatchingService (score engine)                     │
│  ├── ResumeService (parse + skills)                     │
│  └── ApplicationService (kanban state machine)           │
├─────────────────────────────────────────────────────────┤
│                     Domain Layer                         │
│  ├── matching/scoring-engine.ts    → 9 componentes      │
│  ├── matching/skill-taxonomy.ts    → taxonomia          │
│  ├── matching/resume-adapter.ts    → template adapt     │
│  ├── application/state-machine.ts  → 18 estágios        │
│  ├── scrapers/*                    → IScraper           │
│  └── gupy-mcp/client.ts            → JSON-RPC client    │
├─────────────────────────────────────────────────────────┤
│                  Infrastructure Layer                    │
│  ├── db/ (Prisma ORM + PostgreSQL)                      │
│  ├── repositories/ (IJobRepository, IUserRepository...) │
│  ├── di/container.ts                                     │
│  └── auth/auth.config.ts                                 │
└─────────────────────────────────────────────────────────┘
```

### Princípios por Camada

| Camada | SOLID | Segurança |
|--------|-------|-----------|
| Domain | SRP + ISP (interfaces mínimas) | Dados sanitizados na entrada |
| Application | DIP (depende de abstrações) | Server Actions autenticadas |
| Infrastructure | OCP (trocável via interface) | SQL injection: Prisma ORM |
| Presentation | SRP (página = 1 propósito) | XSS: MUI escapa HTML |

### Decisões de Arquitetura (ADRs)

| Decisão | Opção Escolhida | Trade-off |
|---------|----------------|-----------|
| ORM | Prisma (vs Drizzle) | Schema-first, migrations robustas, ecossistema maduro |
| Auth | Auth.js v5 (vs NextAuth v4) | Multi-provedor, JWT, middleware nativo |
| DB | PostgreSQL (vs SQLite) | Concorrência multi-usuário |
| AI | Transformers.js browser (vs API) | Offline, privado, sem custo (~80MB cache) |
| Componentes | MUI 7 (vs shadcn/ui) | +120kB mas acessibilidade nativa, tema consistente |
| Estado servidor | TanStack Query | Cache otimista, mutations tipadas |

---

## 4. Stack Decidida

| Categoria | Tecnologia | Versão |
|-----------|-----------|--------|
| Framework | Next.js | 15 (App Router) |
| Linguagem | TypeScript | 5.6+ |
| Componentes | MUI (Material UI) | 7 |
| Estilos | Tailwind CSS + MUI sx | 4 |
| Banco | PostgreSQL | 16 |
| ORM | Prisma ORM | 7.9 |
| Auth | Auth.js | 5 |
| AI (browser) | Transformers.js | 2.17 |
| PDF | pdfjs-dist | 4 |
| Drag & Drop | dnd-kit | 6 |
| Docker | Docker Compose | 3 serviços |

---

## 5. Banco de Dados

### PostgreSQL via Prisma ORM

```typescript
// Schema principal — 8 tabelas
users               // id, email, passwordHash, name, createdAt
sessions            // id, userId, expiresAt (Auth.js)
profiles            // id, userId, skills[], experience, seniority, resumeText
jobs                // id, userId, source, empresa, titulo, link, descricao, skillsRequired
match_scores        // id, userId, jobId, score, breakdown JSON, createdAt
applications        // id, userId, jobId, stage, notes, createdAt
new_companies       // id, userId, nome, totalVagas, url (InHire discovery)
pipeline_runs       // id, userId, status, stats
```

### Docker Compose (v2)

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: radar_unificando
      POSTGRES_PASSWORD: ${DB_PASSWORD:-radar123}
    volumes: [pgdata:/var/lib/postgresql/data]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  app:
    build: .
    ports: ["11010:11010"]
    depends_on:
      postgres: { condition: service_healthy }
    environment:
      DATABASE_URL: postgresql://postgres:${DB_PASSWORD:-radar123}@postgres:5432/radar_unificando
      AUTH_SECRET: ${AUTH_SECRET:-secret-dev-only}
    restart: unless-stopped

volumes: { pgdata: }
```

---

## 6. Design System

### Filosofia

**Unificando Identity** — amarelo neon (`#ccff00`) como acento, preto (`#020617`) como primário.
Adaptado para contexto profissional de carreira com MUI.

### MUI Theme

```typescript
const theme = createTheme({
  palette: {
    primary: { main: '#020617' },    // brand-black
    secondary: { main: '#64748b' },  // slate-500
    warning: { main: '#ccff00' },    // neon yellow (acento)
    success: { main: '#16a34a' },
    error: { main: '#dc2626' },
    mode: 'light', // toggle via ThemeProvider
  },
  typography: {
    fontFamily: 'Inter, sans-serif',
    h1: { fontWeight: 900, letterSpacing: '-0.03em' },
    h2: { fontWeight: 900, letterSpacing: '-0.02em' },
    // body padrão MUI
  },
  shape: { borderRadius: 4 },
  components: {
    MuiButton: { defaultProps: { disableElevation: true } },
    MuiCard: { defaultProps: { variant: 'outlined' } },
  },
});
```

### Dark Mode

- `ThemeProvider` com `colorScheme` toggle
- Preferência salva em `localStorage`
- Respeita `prefers-color-scheme` na primeira visita
- Transição suave 0.2s

### MUI Componentes Utilizados

| Bloco | Componentes MUI |
|-------|----------------|
| Header | `AppBar`, `Toolbar`, `Button`, `IconButton`, `Switch` |
| Input empresas | `TextField` (multiline), `Button`, `FormControlLabel` |
| Progresso | `Accordion`, `AccordionSummary`, `AccordionDetails`, `LinearProgress` |
| Resultados | `Table`, `TableHead`, `TableRow`, `TableCell`, `Chip` |
| Filtros | `Select`, `MenuItem`, `TextField`, `InputAdornment` |
| Cards | `Card`, `CardContent`, `CardActions` |
| Score | `CircularProgress` (determinate), `Typography` |
| Modais | `Dialog`, `DialogTitle`, `DialogContent`, `DialogActions` |
| Kanban | `Paper`, `Box` + dnd-kit |
| Alertas | `Alert`, `AlertTitle` |
| Loading | `Skeleton`, `LinearProgress` |

### UX Psychology

| Princípio | Aplicação |
|-----------|-----------|
| **Hick's Law** | Filtros progressivos, não tudo de uma vez |
| **Miller's Law** | Chunks de 7±2 cards por grid |
| **Von Restorff** | Score de match em destaque (neon) |
| **Fitts' Law** | Botão EXECUTAR grande e no centro |
| **Serial Position** | Vagas mais recentes no topo |

---

## 7. UX — Flow Unificado

### Antes (v1): 3 telas separadas

```
/empresas → /pipeline → /vagas
👎 4 cliques + 3 navegações
```

### Depois (v2): Tela única

```
/  (página única — radar)
├── 1. INPUT → textarea de empresas + toggle discovery
├── 2. EXECUTAR → botão principal
├── 3. PROGRESSO → accordion collapsável com log + barra
└── 4. RESULTADO → tabela com filtros (substitui o log ao final)
    └── Export CSV + coluna de score (se logado)
```

### Wireframe

```
┌─────────────────────────────────────────────────────────┐
│  RADAR UNIFICANDO                     [Login] [Dark T]  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──── Input de Empresas ─────────────────────────────┐ │
│  │  Empresas (opcional — uma por linha)               │ │
│  │  ┌─────────────────────────────────────────────┐   │ │
│  │  │ Ambev                                       │   │ │
│  │  │ Nubank                                      │   │ │
│  │  │ BRQ                                         │   │ │
│  │  └─────────────────────────────────────────────┘   │ │
│  │  ☑ Descobrir novas empresas (Wayback + urlscan)    │ │
│  │                                                     │ │
│  │  [▸ EXECUTAR BUSCA]        [EXPORTAR CSV ⬇]       │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌─── Progresso (aparece durante busca) ──────────────┐ │
│  │  ▸ "Buscando Gupy (3/13 queries)... 12 vagas"     │ │
│  │  ▸ "Buscando InHire..."                            │ │
│  │  ▸ "Mesclando resultados..."                        │ │
│  │  [████████████░░░░░░░░░░] 45%                      │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌─── 47 VAGAS ENCONTRADAS ───────────────────────────┐ │
│  │  [Gupy ▼] [InHire ▼] [Cargo ▼] [🔍 busca...]      │ │
│  │                                                     │ │
│  │  ┌──────────────────────────────────────────────┐  │ │
│  │  │ Empresa │ Plataf. │ Cargo   │ Score │ Link  │  │ │
│  │  ├──────────────────────────────────────────────┤  │ │
│  │  │ Ambev   │ Gupy     │ BI      │  78%  │ [Ver]│  │ │
│  │  │ Nubank  │ InHire   │ Dados   │  45%  │ [Ver]│  │ │
│  │  │ ...     │ ...      │ ...     │  ...  │ ...  │  │ │
│  │  └──────────────────────────────────────────────┘  │ │
│  └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Estados da Tabela

| Estado | O que mostrar |
|--------|-------------|
| **Nunca buscou** | "Cole empresas e clique em EXECUTAR BUSCA" |
| **Buscando** | Accordion expandido com log + progresso |
| **Vazia (sem match)** | "Nenhuma vaga encontrada para os critérios" |
| **Resultados** | Tabela com dados |
| **Erro** | Alert: "Falha ao buscar" + detalhes no log |

### Impacto nas Páginas Atuais

| Página atual | Na v2 |
|-------------|-------|
| `/` (Dashboard) | → Home unificada (tudo-em-um) |
| `/empresas` | → Remove (input vai pra home) |
| `/pipeline` | → Remove (lógica colapsada na home) |
| `/vagas` | → Remove (tabela substitui log ao final) |
| `/export` | → Botão na home |

---

## 8. Modelo de Usuário

### Dois Níveis

| Aspecto | Anônimo | Logado |
|---------|---------|--------|
| Armazenamento | LocalStorage | PostgreSQL |
| Scraper Gupy | REST API pública | MCP oficial + REST fallback |
| Scraper InHire | Público | Público + perfil match |
| Perfil/Skills | ❌ | ✅ (upload currículo + parse automático) |
| Score de match | ❌ | ✅ (0-100 por vaga) |
| Breakdown | ❌ | ✅ (skills obrigatórias, desejáveis, etc.) |
| Kanban | ❌ | ✅ (18 estágios) |
| Adaptar currículo | ❌ | ✅ (template + AI opcional) |
| Persistência | Efêmero (1 sessão) | Eterno |
| Login necessário | ❌ | ✅ (email + senha + JWT) |

### Fluxo Anônimo

```
1. Acessa / (home)
2. Cola empresas (ou não)
3. Clica EXECUTAR
4. Vê progresso + resultados
5. Tudo salvo no LocalStorage
6. Fechou o browser? Perdeu tudo
7. Próxima visita: começa do zero
```

### Fluxo Logado

```
1. Login (email + senha)
2. Perfil: upload currículo → extração automática de skills
3. Cola empresas (ou usa as salvas)
4. Clica EXECUTAR
5. Vê progresso + resultados com coluna de SCORE
6. Clita "ADAPTAR CURRÍCULO" → template ajustado
7. Move vaga pro Kanban → acompanha candidatura
8. Tudo persistido no PostgreSQL
```

### Auth

- **Auth.js v5** com `CredentialsProvider`
- JWT com `encode/decode` custom
- Senhas hashadas com `bcrypt` (cost=12)
- Middleware protege rotas `/dashboard/*`
- Usuário anônimo: sem sessão, sem cookie

---

## 9. Funcionalidades por Tipo de Usuário

| Funcionalidade | Anônimo | Logado |
|---------------|---------|--------|
| Buscar vagas (Gupy REST) | ✅ | ✅ |
| Buscar vagas (InHire) | ✅ | ✅ |
| Buscar vagas (Gupy MCP) | ❌ | ✅ |
| Filtrar resultados | ✅ | ✅ |
| Exportar CSV | ✅ | ✅ |
| Salvar empresas favoritas | ❌ (cada vez) | ✅ (persistente) |
| Upload currículo (PDF) | ❌ | ✅ |
| Extrair skills automático | ❌ | ✅ (Transformers.js) |
| Score de match por vaga | ❌ | ✅ |
| Breakdown explicativo | ❌ | ✅ |
| Kanban de candidaturas | ❌ | ✅ (18 estágios) |
| Adaptar currículo pra vaga | ❌ | ✅ (template + AI) |
| Histórico de buscas | ❌ | ✅ |
| Pipeline discovery InHire | ✅ | ✅ |

---

## 10. Gupy MCP

### O que é

A Gupy disponibiliza um servidor **MCP (Model Context Protocol)** público em:

```
URL: https://candidates.mcp.api.gupy.io/mcp
Protocolo: JSON-RPC 2.0
Autenticação: Nenhuma (público)
```

### Como usar (no servidor, não no browser)

```typescript
// lib/core/gupy-mcp/client.ts
export class GupyMcpClient {
  private url = 'https://candidates.mcp.api.gupy.io/mcp';

  async searchJobs(params: {
    query: string;
    limit?: number;
  }): Promise<JobData[]> {
    const res = await fetch(this.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
          name: 'search_jobs',
          arguments: params,
        },
        id: crypto.randomUUID(),
      }),
    });

    const data = await res.json();
    return this.parseResponse(data);
  }
}
```

### Estratégia de Uso

| Usuário | Fonte de vagas Gupy |
|---------|---------------------|
| Anônimo | REST API (`employability-portal.gupy.io/api/v1/jobs`) |
| Logado | **MCP oficial** + REST como fallback |

O MCP é prioridade para logados por ser o **canal oficial** da Gupy para candidatos.

### Skills MCP (da Gupy)

A Gupy também oferece skills para análise de currículo e radar de vagas via MCP. Essas skills podem ser consumidas programaticamente:

- `analyze_resume` — analisa currículo
- `search_jobs` — busca vagas
- `job_radar` — compatibilidade com perfil

---

## 11. AI no Browser (Transformers.js)

### Tarefas

| Tarefa | Modelo | Tamanho | Execução |
|--------|--------|---------|----------|
| NER (extrair skills do currículo) | `Xenova/bert-base-NER` | ~400MB | Browser (1x) |
| Embeddings para match semântico | `Xenova/all-MiniLM-L6-v2` | ~80MB | Browser (pipeline) |
| Perguntas para o currículo | Template + opcional Gemini API | — | Servidor (opcional) |

### Pipeline de Extração

```
Upload PDF (linkedin export)
  → pdf.js extrai texto
  → Transformers.js NER identifica:
      • Habilidades técnicas (SQL, Python, etc.)
      • Cargos (Analista, Engenheiro, etc.)
      • Empresas, anos de experiência
  → Usuário revisa e ajusta
  → Salva no perfil (PostgreSQL)
```

### Cached Models

Os modelos baixam uma vez no browser e ficam em cache (IndexedDB via Transformers.js). Total ~80MB após primeira visita.

### Fallback

Se Transformers.js falhar (browser antigo, memória insuficiente), o sistema cai para:
1. **Extração por regex + taxonomia** (determinístico, funciona sempre)
2. **Match por palavras-chave** (sem embeddings)

Gemini API é **opcional** — usuário cola a própria API key se quiser.

---

## 12. Feedback + Paginação

### 12.1 Paginação (Tabela de Resultados)

| Cenário | Componente | Comportamento |
|---------|-----------|---------------|
| **Poucos resultados** (< 20 linhas) | Sem paginação | Mostra tudo direto |
| **Muitos resultados** (20+) | `MuiPagination` | 20 por página, seletor "20/50/100" |
| **Navegação** | Botões "Anterior/Próximo" + números | Mantém filtros entre páginas |
| **URL state** | `?page=2&plataforma=Gupy` | Link compartilhável, voltar não perde página |

```tsx
// Pagination no servidor (API)
GET /api/vagas?page=2&limit=20&plataforma=Gupy
→ { data: JobData[], total: 47, page: 2, totalPages: 3 }

// MUI TablePagination no frontend
<TablePagination
  component="div"
  count={total}
  page={page - 1}
  onPageChange={handlePageChange}
  rowsPerPage={rowsPerPage}
  onRowsPerPageChange={handleChangeRowsPerPage}
/>
```

### 12.2 Estados de Feedback (Cada Operação)

| Operação | Loading | Success | Empty | Error |
|----------|---------|---------|-------|-------|
| **Buscar vagas** | Barra `LinearProgress` no accordion + "Buscando Gupy (3/13)..." | Accordion colapsa + tabela aparece com contagem | "Nenhuma vaga encontrada. Tente ampliar as empresas ou desativar filtros." | `Alert severity="error"` "Falha ao buscar vagas. Verifique sua conexão e tente novamente." + botão "TENTAR NOVAMENTE" |
| **Salvar empresas** | Botão desabilitado "SALVANDO..." | `Snackbar` "12 empresas salvas!" | — | `Snackbar` "Erro ao salvar: [mensagem]" |
| **Login** | Botão "ENTRANDO..." spinner | Redirect para dashboard | — | `Alert` inline no form "Email ou senha inválidos" |
| **Register** | Botão "CRIANDO CONTA..." | `Snackbar` "Conta criada!" + redirect | — | `Alert` inline "Email já cadastrado" / "Senha muito fraca" |
| **Upload currículo** | `LinearProgress` + "Extraindo skills..." | `Snackbar` "Currículo processado! 15 skills encontradas" | — | `Alert` "Não foi possível ler o PDF. Formatos aceitos: PDF do LinkedIn." |
| **Exportar CSV** | Botão "GERANDO CSV..." | Download dispara automaticamente | — | `Snackbar` "Erro ao gerar arquivo" |
| **Mover Kanban** | Card com opacidade reduzida | Card aparece na nova coluna instantaneamente (otimista) | — | Card volta pra coluna anterior + `Snackbar` "Erro ao mover" |
| **Pipeline discovery** | Cada step com micro-progresso | Step marca ✓ + contagem | "Nenhuma nova empresa descoberta" | Step marca ⚠ + "Falha no discovery (opcional, continuando)" |
| **Deletar conta** | Dialog de confirmação | `Snackbar` "Conta deletada" + logout | — | `Snackbar` "Erro ao deletar conta" |

### 12.3 Toast/Snackbar System

Eventos que disparam `Snackbar` (MUI):

```
┌─────────────────────────────────────────────┐
│  ✅ 12 empresas salvas!                     │  ← success (4s)
├─────────────────────────────────────────────┤
│  ⚠️ Erro ao salvar: conexão perdida         │  ← error (8s, fica até fechar)
├─────────────────────────────────────────────┤
│  ℹ️ 47 vagas encontradas                     │  ← info (4s)
├─────────────────────────────────────────────┤
│  🎯 Pipeline concluído! 52 vagas novas       │  ← success (6s)
└─────────────────────────────────────────────┘
```

```tsx
// Hook customizado
const { showSnackbar, SnackbarComponent } = useSnackbar();

// Uso em qualquer lugar
showSnackbar('12 empresas salvas!', 'success');
showSnackbar('Falha na conexão', 'error', { duration: 8000 });
```

### 12.4 Form Validation (Login / Register / Empresas)

| Campo | Validação | Feedback |
|-------|-----------|----------|
| **Email** | Formato email + required | `TextField error` + helperText "Email inválido" |
| **Senha** | Min 8 chars + required | `TextField error` + "Mínimo 8 caracteres" |
| **Confirmar senha** | Igual à senha | "Senhas não conferem" |
| **Empresas** | Opcional, mas valida duplicatas | Remove duplicatas automaticamente + aviso |

```tsx
<TextField
  label="Email"
  type="email"
  error={!!errors.email}
  helperText={errors.email}
  required
/>
```

### 12.5 Pipeline Progress (Rich Feedback)

Cada step do pipeline emite eventos SSE que o frontend renderiza:

```typescript
type PipelineEvent =
  | { type: 'step_start';    step: string; message: string }
  | { type: 'step_progress'; step: string; current: number; total: number; message: string }
  | { type: 'step_complete'; step: string; result: { count: number } }
  | { type: 'step_warn';     step: string; error: string }
  | { type: 'step_error';    step: string; error: string; recoverable: boolean }
  | { type: 'pipeline_complete'; stats: { total: number } }
  | { type: 'pipeline_cancelled' };
```

Renderização no accordion durante a execução:

```
▸ PIPELINE (45%)
├── ✅ Gupy — 12 vagas encontradas
├── 🔄 InHire (lista) — 34/100 empresas verificadas...
├── ⏳ Discovery — Aguardando...
├── ⏳ Merge — Aguardando...
└── ⏳ Presença — Aguardando...
```

| Ícone | Significado |
|-------|-------------|
| ⏳ | Não iniciado |
| 🔄 | Em progresso |
| ✅ | Completo com sucesso |
| ⚠️ | Completo com aviso (fallback usado) |
| ❌ | Falhou (step não crítico, pipeline continua) |

### 12.6 Error Boundaries (React)

```
Componentes que envolvem áreas críticas:
├── Tabela de resultados  → fallback "Erro ao carregar tabela"
├── Kanban                → fallback "Erro ao carregar candidaturas"
└── Perfil                → fallback "Erro ao carregar perfil"

Sem perder o header/nav — erro fica isolado no bloco.
```

### 12.7 Skeleton Loading (MUI Skeleton)

| Área | Skeleton |
|------|----------|
| **Tabela** | 5 linhas de `Skeleton variant="text"` |
| **Cards** | `Skeleton variant="rectangular" width="100%" height={200}` |
| **Perfil** | `Skeleton variant="circular"` (avatar) + 3 linhas de texto |
| **Kanban** | 3 colunas com 2 cards skeleton cada |

### 12.8 Empty States Ilustrados

| Estado | Ícone | Texto |
|--------|-------|-------|
| **Nunca buscou** | Radar desligado | "Pronto para começar? Cole as empresas e clique em EXECUTAR BUSCA" |
| **Busca sem resultados** | Lupa vazia | "Nenhuma vaga encontrada — tente remover filtros ou ampliar a lista de empresas" |
| **Sem candidaturas** | Kanban vazio | "Você ainda não se candidatou a nenhuma vaga. Encontre vagas na página inicial" |
| **Sem empresas na lista** | Lista vazia | "Adicione empresas para marcar vagas como 'Na sua lista'. Opcional — a busca funciona sem." |

### 12.9 Confirm Dialog (Ações Destrutivas)

| Ação | Dialog |
|------|--------|
| **Sair da conta** | "Tem certeza que deseja sair?" |
| **Limpar resultados** | "Isso vai apagar todos os resultados da busca atual" |
| **Excluir conta** | "Esta ação é irreversível. Todos os seus dados serão perdidos." |

```tsx
<Dialog open={open} onClose={handleClose}>
  <DialogTitle>Sair da conta?</DialogTitle>
  <DialogContent>
    <Typography>Você precisará fazer login novamente para acessar seus dados.</Typography>
  </DialogContent>
  <DialogActions>
    <Button onClick={handleClose}>Cancelar</Button>
    <Button onClick={handleConfirm} color="error" variant="contained">
      Sair
    </Button>
  </DialogActions>
</Dialog>
```

### 12.10 Matriz de Feedback — Visão Consolidada

```
┌─────────────────┬──────────┬──────────┬──────────┬──────────┐
│ Operação        │ Loading  │ Success  │ Empty    │ Error    │
├─────────────────┼──────────┼──────────┼──────────┼──────────┤
│ Buscar vagas    │ Barra +  │ Tabela   │ Alert    │ Alert +  │
│                 │ log      │ + cont.  │ ilustr.  │ retry    │
├─────────────────┼──────────┼──────────┼──────────┼──────────┤
│ Salvar empresas │ Btn des. │ Snackbar │ —        │ Snackbar │
├─────────────────┼──────────┼──────────┼──────────┼──────────┤
│ Login           │ Btn des. │ Redirect │ —        │ Inline   │
├─────────────────┼──────────┼──────────┼──────────┼──────────┤
│ Register        │ Btn des. │ Snack +  │ —        │ Inline   │
│                 │          │ redirect │          │          │
├─────────────────┼──────────┼──────────┼──────────┼──────────┤
│ Upload currículo│ Barra +  │ Snackbar │ —        │ Alert    │
│                 │ msg      │          │          │          │
├─────────────────┼──────────┼──────────┼──────────┼──────────┤
│ Export CSV      │ Btn des. │ Download │ —        │ Snackbar │
├─────────────────┼──────────┼──────────┼──────────┼──────────┤
│ Mover Kanban    │ Opacity  │ Otimista │ —        │ Reverte  │
│                 │          │          │          │+Snackbar │
├─────────────────┼──────────┼──────────┼──────────┼──────────┤
│ Pipeline step   │Step ícone│ Step ✓  │ Step "-" │Step ⚠/❌ │
│                 │   🔄     │+ cont.   │          │          │
├─────────────────┼──────────┼──────────┼──────────┼──────────┤
│ Deletar conta   │ Dialog   │ Snackbar │ —        │ Snackbar │
│                 │ confirm  │ + logout │          │          │
└─────────────────┴──────────┴──────────┴──────────┴──────────┘
```

---

## 13. Plano de Implementação (Fases)

### Fase 1 — Fundação (Auth + PostgreSQL + MUI)

```
Objetivo: Setup do novo stack, auth funcional, home unificada
Branch: v2/redesign
Tempo estimado: 3-4 dias

Tarefas:
├── [ ] Docker Compose com PostgreSQL + app
├── [ ] Prisma schema + migrations + seed
├── [ ] Auth.js (credentials + JWT + bcrypt)
├── [ ] MUI theme provider + dark mode
├── [ ] Layout base (AppBar, Footer, Container)
├── [ ] Página de login/register
├── [ ] Middleware de autenticação
├── [ ] Home unificada (input empresas + executar + resultados)
├── [ ] Adaptar scrapers existentes para PostgreSQL
├── [ ] Pipeline steps com user_id
├── [ ] Log collapsado + progresso SSE
└── [ ] Export CSV

Dependências:
├── @mui/material @mui/icons-material @emotion/react @emotion/styled
├── next-auth @auth/core
├── @prisma/client @prisma/adapter-pg prisma
├── bcrypt @types/bcrypt
```

### Fase 2 — Gupy MCP + Scrapers Otimizados

```
Objetivo: MCP como fonte oficial para logados

Tarefas:
├── [ ] GupyMcpClient (JSON-RPC sobre MCP)
├── [ ] Estratégia: logado → MCP | anônimo → REST
├── [ ] Scrapers adaptados com fallback
├── [ ] Pipeline steps unificados
└── [ ] Testes de integração
```

### Fase 3 — Perfil + Matching Engine

```
Objetivo: Upload de currículo, extração de skills, score de match

Tarefas:
├── [ ] Upload PDF (multer / next API)
├── [ ] pdf.js parse de texto
├── [ ] Transformers.js NER (extrair skills)
├── [ ] Editor de perfil (revisar skills)
├── [ ] Skill taxonomy (baseada na career-platform)
├── [ ] Scoring engine (9 componentes)
│       ├── mandatory_skills (30%)
│       ├── desirable_skills (15%)
│       ├── responsibilities (15%)
│       ├── seniority (10%)
│       ├── domain (10%)
│       ├── education (5%)
│       ├── languages (5%)
│       ├── logistics (5%)
│       └── behavioral (5%)
├── [ ] ScoreRing + SkillPill (MUI custom)
├── [ ] Breakdown explicativo
├── [ ] Coluna de score na tabela de vagas
└── [ ] Páginas: /perfil, /match

Dependências:
├── @xenova/transformers
├── pdfjs-dist
```

### Fase 4 — Kanban de Candidaturas

```
Objetivo: Acompanhamento visual das candidaturas

Tarefas:
├── [ ] State machine (18 estágios, transições validadas)
├── [ ] KanbanBoard (dnd-kit + MUI Paper)
├── [ ] Ações: aplicar, mover estágio, adicionar nota
├── [ ] Botão "ADAPTAR CURRÍCULO" (template-based)
├── [ ] Histórico de movimentação
├── [ ] Página: /aplicacoes
└── [ ] Gemini API opcional (adaptação por IA)

Dependências:
├── @dnd-kit/core @dnd-kit/sortable
```

### Fase 5 — Documentação + Polimento

```
Objetivo: Fechar o projeto com documentação e testes

Tarefas:
├── [ ] README.md atualizado
├── [ ] docs/ completo (10 arquivos)
├── [ ] Testes (vitest nos services)
├── [ ] Playwright E2E nos fluxos principais
├── [ ] Audit UX/UI (via skill web-design-guidelines)
├── [ ] Segurança: helmet, rate limiting, sanitização
├── [ ] Performance: bundle analysis, lazy loading
├── [ ] SEO: metadata, sitemap
├── [ ] Docker final: healthcheck, non-root user
├── [ ] Merge v2/redesign → main
└── [ ] Tag de release v2.0.0
```

---

## 14. Documentação

### `docs/` — Estrutura Completa

| Arquivo | Conteúdo | Quando criar |
|---------|----------|-------------|
| `V2_PLAN.md` | Este documento — plano mestre | ✅ Já criado |
| `ARCHITECTURE.md` | Camadas, fluxo de dados, decisões, diagramas | Fase 1 |
| `DESIGN_SYSTEM.md` | MUI theme, componentes, dark mode, acessibilidade | Fase 1 |
| `DATABASE.md` | Schema Prisma, migrações, índices, seed | Fase 1 |
| `API.md` | Rotas REST, exemplos curl, auth headers | Fase 2 |
| `SECURITY.md` | JWT, bcrypt, sanitização, CORS, CSRF | Fase 1 |
| `PIPELINE.md` | Steps, ordem, opt-in, MCP vs REST | Fase 2 |
| `MATCHING.md` | 9 componentes, pesos, algoritmo, exemplo | Fase 3 |
| `AI.md` | Transformers.js, modelos, fallback, Gemini opcional | Fase 3 |
| `UX_FLOW.md` | Wireframe, estados, interações | Fase 5 |
| `CONTRIBUTING.md` | Setup dev, branch strategy, PR template | Fase 5 |
| `ROADMAP.md` | v1 atual, v2 planejado, v3 futuro | Fase 5 |

---

## 15. Dependências Novas

```json
{
  "dependencies": {
    "@mui/material": "^7.0",
    "@mui/icons-material": "^7.0",
    "@emotion/react": "^11.13",
    "@emotion/styled": "^11.13",
    "@auth/core": "^0.38",
    "next-auth": "^5.0",
    "@prisma/client": "^7.9",
    "postgres": "^3.4",
    "bcrypt": "^5.1",
    "@xenova/transformers": "^2.17",
    "pdfjs-dist": "^4.9",
    "@dnd-kit/core": "^6.3",
    "@dnd-kit/sortable": "^10.0"
  },
  "devDependencies": {
    "prisma": "^7.9",
    "@types/bcrypt": "^5.0",
    "@testing-library/react": "^16.0",
    "vitest": "^3.0",
    "playwright": "^1.50"
  }
}
```

---

## 16. Segurança + Docker

### 16.1 Diagnóstico Atual (v1)

| Item | Status | Risco |
|------|--------|-------|
| Docker: sem resource limits | ❌ Sem `deploy.resources` | Médio — container pode consumir todo o host |
| Docker: sem `.dockerignore` | ❌ Não existe | Médio — build envia cache/node_modules |
| Env: só `DATABASE_URL` | ❌ Sem `AUTH_SECRET`, sem validação | Alto — v2 precisa de segredos |
| Headers de segurança | ❌ Nenhum | Alto — sem CSP, XSS protection |
| CORS | ❌ Não configurado | Médio — APIs abertas |
| Rate limiting | ❌ Não existe | Alto — pipeline pode abusar APIs externas |
| Input sanitization | ❌ Mínima | Médio |

### 16.2 Correções — Docker

#### Dockerfile (otimizado)

```dockerfile
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --frozen-lockfile --no-audit --no-fund

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=11010

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

RUN apk del --no-cache python3 build-base git 2>/dev/null || true

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 11010

HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=10s \
  CMD wget -qO- http://localhost:11010/api/health || exit 1

CMD ["node", "server.js"]
```

#### `.dockerignore`

```
node_modules
.next
.git
.gitignore
README.md
docs/
data/
.env
.env.local
*.md
*.log
.DS_Store
```

#### Docker Compose (v2 — PostgreSQL + limites)

```yaml
services:
  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: radar_unificando
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_USER: ${DB_USER:-radar}
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER:-radar} -d radar_unificando"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s
    deploy:
      resources:
        limits:
          memory: 256M
          cpus: '1.0'
        reservations:
          memory: 128M
    networks:
      - internal

  app:
    build: .
    restart: unless-stopped
    ports:
      - "11010:11010"
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://${DB_USER:-radar}:${DB_PASSWORD}@postgres:5432/radar_unificando
      AUTH_SECRET: ${AUTH_SECRET}
      AUTH_URL: http://localhost:11010
    env_file:
      - .env
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '1.0'
        reservations:
          memory: 256M
    security_opt:
      - no-new-privileges:true
    networks:
      - internal
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:11010/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 20s

volumes:
  pgdata:
    driver: local

networks:
  internal:
    driver: bridge
```

### 16.3 Correções — Application

#### Security Headers (Next.js `next.config.ts`)

```typescript
import type { NextConfig } from 'next';

const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ['better-sqlite3'],
  poweredByHeader: false,
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }];
  },
};

export default nextConfig;
```

#### Rate Limiting

```typescript
// lib/infrastructure/security/rate-limiter.ts
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export class RateLimiter {
  private store = new Map<string, RateLimitEntry>();

  constructor(
    private windowMs: number = 60_000,
    private maxRequests: number = 60
  ) {}

  check(key: string): { allowed: boolean; remaining: number; resetAt: number } {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || now > entry.resetAt) {
      this.store.set(key, { count: 1, resetAt: now + this.windowMs });
      return { allowed: true, remaining: this.maxRequests - 1, resetAt: now + this.windowMs };
    }

    entry.count++;
    return {
      allowed: entry.count <= this.maxRequests,
      remaining: Math.max(0, this.maxRequests - entry.count),
      resetAt: entry.resetAt,
    };
  }
}
```

#### Taxas por Operação

| Operação | Janela | Limite | Chave |
|----------|--------|--------|-------|
| Pipeline | 5 min | 1 req | `user_id` |
| Login | 1 min | 5 tentativas | IP |
| API geral | 1 min | 60 req | IP |
| Upload currículo | 1 hora | 10 req | `user_id` |
| Export CSV | 1 min | 10 req | `user_id` |

#### Validação de Environment

```typescript
// lib/infrastructure/security/env.ts
export function validateEnv(): void {
  const required = ['DATABASE_URL', 'AUTH_SECRET'];
  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Variáveis de ambiente obrigatórias: ${missing.join(', ')}. ` +
      `Copie .env.example para .env e preencha os valores.`
    );
  }

  if (process.env.AUTH_SECRET === 'generate-with-openssl-rand-base64-64') {
    console.warn('[SECURITY] AUTH_SECRET está com valor padrão. Gere um valor seguro.');
  }
}
```

#### `.env.example` (v2)

```bash
DB_USER=radar
DB_PASSWORD= # openssl rand -base64 32
DB_NAME=radar_unificando
AUTH_SECRET= # openssl rand -base64 64
AUTH_URL=http://localhost:11010
# GEMINI_API_KEY= # opcional
```

### 16.4 Resource Limits — Justificativa

| Serviço | Memória | CPU | Razão |
|---------|---------|-----|-------|
| postgres | 256M máx / 128M res | 1.0 | Banco pequeno (~1000 vagas por usuário) |
| app | 512M máx / 256M res | 1.0 | Next.js + scrapers (AI é client-side) |

### 16.5 Matriz Antes vs Depois

| Risco | v1 | v2 |
|-------|----|-----|
| Container consome todo o host | ❌ | ✅ 512M máx + CPU limit |
| Build lento/envia lixo | ❌ | ✅ .dockerignore + no-audit |
| Segredos em texto plano | ❌ | ✅ .env ignorado + validação |
| XSS via input usuário | ❌ | ✅ Security headers |
| Força bruta login | ❌ (sem auth) | ✅ Rate limit |
| Leak de info servidor | ❌ | ✅ poweredByHeader: false |
| Pipeline abusa APIs | ❌ | ✅ Rate limit por operação |
| Vazamento memória pipeline | ❌ | ✅ Memory limit + timeout |

### 16.6 Arquivos a Criar/Modificar

| Arquivo | Ação |
|---------|------|
| `Dockerfile` | Modificar (apagar build deps) |
| `.dockerignore` | Criar |
| `docker-compose.yml` | Reescrever (PostgreSQL + limits) |
| `.env.example` | Atualizar (novas vars) |
| `.gitignore` | Adicionar `.env`, `pgdata/` |
| `next.config.ts` | Adicionar `headers()` + `poweredByHeader` |
| `middleware.ts` | Criar (rate limiting + headers) |
| `src/lib/infrastructure/security/rate-limiter.ts` | Criar |
| `src/lib/infrastructure/security/env.ts` | Criar |
| `docs/SECURITY.md` | Criar |

---

## 17. Perguntas Pendentes

- [ ] **Gemini API**: colocar como feature opcional (usuário cola a própria key) ou pular por enquanto?
- [ ] **LinkedIn export**: o parse de PDF do LinkedIn funciona bem com `pdf.js`? Testar com amostras reais
- [ ] **Taxonomia de skills**: extrair da career-platform ou criar do zero baseada nas vagas do Gupy/InHire?
- [ ] **MCP Rate limit**: o MCP da Gupy tem rate limit? Testar antes de fazer dele a fonte principal
- [ ] **Kanban drag-and-drop**: dnd-kit resolve ou precisamos de algo mais simples (botões de mover)?
- [ ] **Dark mode**: implementar com MUI ThemeProvider + `localStorage` ou usar `next-themes`?

---

> Este documento é vivo — atualizar conforme decisões forem tomadas.
