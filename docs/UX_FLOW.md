# UX Flow — Radar Unificando v2

## Home Page (`/`)

### Seções da Home

```
/  (página única — busca redireciona para /busca)
├── 1. MARKETING HERO (dark background, hero-radar animado)
│   ├── Badge: "GUPY + INHIRE · BUSCA EM TEMPO REAL"
│   ├── Heading: "RADAR DE VAGAS" (com texto rotativo)
│   ├── JobSearchBar: tags de cargos (sugestões clicáveis: DevOps, Frontend React, ...)
│   └── Passos "Como funciona":
│       ├── 01 PESQUISE VAGAS — busca em tempo real no Gupy e InHire
│       ├── 02 ANÁLISE DE SCORE ATS — IA calcula compatibilidade (requer conta)
│       └── 03 ADAPTE E CANDIDATE-SE — sugestões para ajustar currículo (requer conta)
├── 2. CONTENT HUBS (cards escuros, border neon)
│   ├── Cursos: "FECHE OS GAPS DO CURRÍCULO" → /cursos
│   └── Dicas: "DESTAQUE-SE NAS TRIAGENS" → /dicas
├── 3. EXTENSION SECTION
│   ├── Badge: "EXTENSÃO CHROME ATS"
│   ├── Heading: "ANALISE A VAGA NA HORA, DIRETO NO NAVEGADOR"
│   ├── Features: score automático, re-análise automática, instalação 1 clique
│   └── Botões: "INSTALAR NO CHROME" (Chrome Web Store) + "VER DETALHES" (/extensao)
├── 4. SUPPORT SECTION
│   ├── "APOIE O PROJETO" — texto sobre manutenção independente
│   └── Botão: "QUERO DOAR (PIX)" → /doar
└── 5. FAQ SECTION
    ├── Heading: "PERGUNTAS FREQUENTES"
    └── Itens expandíveis (details/summary)
```

### Estados da Tabela (`/busca`)

| Estado | Exibição |
|--------|----------|
| Nunca buscou | Tabela com vagas iniciais (server-rendered, até 50) ou estado vazio |
| Buscando | Loading overlay com progresso SSE |
| Vazia (sem match) | "Nenhuma vaga encontrada para os critérios" |
| Resultados | Tabela com dados, filtros, export |
| Erro | Alert + "TENTAR NOVAMENTE" |

## Páginas

### Login (`/login`)
```
Formulário: email + senha
Link: "Criar conta" → /register
Validação: Zod (email válido, senha ≥ 8 chars)
Feedback: Alert inline em caso de erro
Sucesso após registro: banner verde "Conta criada com sucesso! Faça login para continuar." (query ?registered=true)
```

### Registro (`/register`)
```
Formulário: nome + email + senha + confirmar senha
Validação: Zod (campos obrigatórios, senhas coincidem)
Feedback: Banner inline verde "CONTA CRIADA COM SUCESSO! REDIRECIONANDO PARA O LOGIN..." → redirect para /login?registered=true após 1.2s
Side-effect: envia e-mail de boas-vindas via Resend (email-service.ts)
```

### Perfil (`/perfil`) — requer login
```
Layout: duas abas (tabs) — "PERFIL" (padrão) e "CURRÍCURSOS GERADOS"

Aba "PERFIL":
  Estado vazio:
    ├── Seção: "IMPORTAR CURRÍCULO"
    │   ├── Upload PDF (drag & drop ou clique)
    │   └── Textarea: colar texto do currículo
    └── Formulário manual: skills + senioridade + cargo + área

  Estado revisão:
    ├── Dados extraídos pela IA (editáveis)
    │   ├── Skills (tags editáveis)
    │   ├── Senioridade (select)
    │   ├── Anos de experiência (number)
    │   ├── Cargo atual (text)
    │   ├── Área (select)
    │   └── Formação (text)
    ├── Barra de completude (percentual)
    └── Botão: "SALVAR PERFIL"

  Estado completo:
    ├── Card de completude (100%)
    ├── Banner de currículo desatualizado (se 60+ dias desde a importação): "Currículo base atualizado há X dias" + botão "Atualizar Agora"
    └── Link: "Ver vagas recomendadas →"

Aba "CURRÍCURSOS GERADOS":
  ├── Paginação server-side (GET /api/resume/history?page=&pageSize=, padrão 10/página, máx 50)
  ├── Lista de currículos adaptados: vaga + empresa + local + data
  ├── Cada item: link "Baixar" (PDF) + link "Baixar" (DOCX)
  └── Estado vazio: "Nenhum currículo gerado ainda"
```

### Extensão Chrome (`/extensao/conectar`) — requer login
```
Onboarding em 3 passos:
  ├── 1. Instalar a extensão (link da Chrome Web Store + instruções)
  ├── 2. Copiar o token de conexão (TokenBox)
  └── 3. Colar o token na extensão → side panel mostra "Conectado"

TokenBox:
  ├── Token de 64 caracteres hex (máscara: mostrado/oculto via ícone olho)
  ├── Botão copiar + atalho de teclado "C" (feedback de áudio via Web Audio API)
  └── Status ao vivo: polling GET /api/extensao/status a cada 4s
      ("Extensão conectada" + último uso quando a extensão usar o token)

Fluxo automático (launchWebAuthFlow):
  ├── Backend recebe ?redirect_uri= (somente https://*.chromiumapp.org)
  └── Redireciona com ?token=... — a extensão guarda e re-analisa

FAQ: como funciona, segurança do token, revogação
```

### Dicas (`/dicas`) — pública
```
Hub (/dicas):
  ├── Badge: "DICAS E TUTORIAIS"
  ├── H1: "DICAS PARA ACELERAR SUA CARREIRA"
  ├── Chips de categoria: Todas, Currículo, Ferramentas, Carreira, ATS (filtro via query ?categoria= no server component — chip ativo fica com fundo lime e texto escuro)
  ├── Grid de cards (dica-card.tsx): título, descrição, tempo de leitura, categoria badge
  └── CTA: "PRONTO PARA PÔR EM PRÁTICA?" → botão "IMPORTAR CURRÍCULO AGORA" → /perfil

Artigo (/dicas/[slug]):
  ├── Breadcrumb: HOME / DICAS / Título
  ├── Badge de categoria + tempo de leitura + data (pt-BR)
  ├── H1: título do artigo
  ├── Seções: parágrafos + listas (DicaSection)
  ├── FAQ expansível (DicaFaqItem)
  ├── JSON-LD: FAQPage + Article + BreadcrumbList
  └── CTA: mesmo do hub
```

### Painel Admin (`/admin`) — requer `role=admin`
```
Acesso: guardado no layout server-side (role admin) + auth-guard; noindex no robots.txt
Dashboard client-side (admin-dashboard-client.tsx) com sub-abas:
  ├── 📊 Visão Geral → stat cards (usuários, buscas, análises ATS, uso de IA)
  │                    + gráficos de série (Recharts) por período
  ├── 🔍 Buscas & Engajamento → categorias mais buscadas (bar chart), engajamento
  └── ⚡ Infraestrutura & Custos → métricas de infra/custo
Filtro de período: 15 / 30 / 365 dias ou intervalo custom (from/to)
Tabela de usuários (/admin/usuarios): nome, email, role, criado em, último acesso
Auto-refresh: a cada 60s (auto-refresh.tsx)
```

## Feedback Matrix

| Operação | Loading | Success | Empty | Error |
|----------|---------|---------|-------|-------|
| Buscar vagas | Overlay + progresso | Tabela + contagem | "Nenhuma vaga encontrada" | Alert + retry |
| Salvar perfil | Btn desabilitado | Snackbar "Perfil salvo!" | — | Snackbar erro |
| Login | Spinner no btn | Redirect para / | — | Alert inline |
| Register | Spinner no btn | Banner inline sucesso → redirect /login?registered=true | — | Alert inline |
| Chat assistente | "Digitando..." | Mensagem streaming | Chips de sugestão | Snackbar |
| Export CSV | Btn desabilitado | Download arquivo | — | Snackbar |
| Upload currículo | "Extraindo skills..." | Dados extraídos | — | "Não foi possível ler" |

## Limites do Chat (UX)

- **Header do chat** mostra três indicadores em tokens (formato `4,2k/16k`):
  - **Contexto** — tokens enviados à IA na conversa (janela real). Aviso (warning) em 80% do teto; dica para iniciar novo chat.
  - **Hoje** — consumo diário (renova à meia-noite). Tooltip também mostra interações (`X/50`).
  - **Mês** — consumo mensal (renova dia 1º).
- **Estados de bloqueio** (input desabilitado + placeholder + banner):
  - Thread de 25 mensagens → `ThreadLimitBanner` ("Inicie um novo chat").
  - 50 interações/dia → `DailyLimitBanner` (renova à meia-noite).
  - Teto de tokens (429 `TOKEN_LIMIT_REACHED`) → `TokenLimitBanner` (renova meia-noite/dia 1º, link para /termos).
- **429 "resposta em andamento"**: lock de concorrência — mensagem clara para aguardar o término da resposta atual.

## Análise ATS

- **Seção "Análise ATS do currículo"** na página /perfil (visível apenas com currículo importado).
- **Drawer de análise ATS na `/busca`** (`AtsAnalysisDrawer`): botão por vaga na tabela abre um drawer com o score ATS daquela vaga + botão "gerar currículo adaptado".
- Estados: sem currículo (orientação para importar) → botão "Analisar compatibilidade ATS" (+ campo opcional "descrição da vaga") → loading (`aria-busy`) → resultado (score com cor + rótulo, checklist de heurísticas, keywords faltando, recomendações) → erro com retry.
- Nota de transparência sempre visível: "Avaliação baseada em boas práticas de ATS — não é garantia de passar em nenhum sistema específico."
- No chat, o assistente chama a tool `analyze_ats_score` quando o usuário pergunta sobre filtros automáticos/otimização de CV.

## Currículo Adaptado (PDF + Word)

- **Botão por vaga na `/busca`** (logado + com currículo importado): "BAIXAR PDF" (primário) + "BAIXAR DOCX" (secundário) → `POST /api/resume/generate` → download direto do PDF ou renderização client-side do DOCX.
- **Histórico de currículos gerados** (aba "Currículos Gerados" no perfil): botões "BAIXAR PDF" e "DOCX (WORD)" por item.
- Snackbar de sucesso ("Currículo adaptado baixado!") ou erro.
- No chat, a tool `generate_resume` gera a versão adaptada em markdown.
- Veracidade garantida em 3 camadas (prompt restritivo + input ATS + filtro pós-geração).

## Cursos — CTA de Fallback

- Abaixo da grade de cursos em `/cursos` e `/cursos/[skill]`: card "Não encontrou o curso desejado?" com botão "PROCURAR NA UDEMY →" apontando para o deep-link de afiliado `trk.udemy.com` (abre em nova aba).
