# UX Flow — Radar Unificando v2

## Home Page (`/`)

### Seções da Home

```
/  (página única)
├── 1. HERO SECTION (dark background, coluna única)
│   ├── Badge: "GUPY + INHIRE · GRÁTIS"
│   ├── Badge info: "Empresas e cargos opcionais — sem filtros, até 500 vagas"
│   ├── Alerta: complete seu perfil (logados sem perfil completo)
│   ├── Heading: "RADAR DE VAGAS REMOTAS"
│   ├── Subtítulo: descrição com texto rotativo
│   ├── Inputs: Empresas + Cargos (opcionais, Enter/vírgula adiciona)
│   ├── Botão: "BUSCAR VAGAS EM TEMPO REAL"
│   └── Sugestões de cargos clicáveis
├── 2. LOADING OVERLAY (quando buscando)
├── 3. RESULTS SECTION (white background)
│   ├── Heading: "RECOMENDADAS PARA VOCÊ" (modo recomendado)
│   ├── Chips: vagas encontradas · na sua lista · empresas
│   ├── Filtros: plataforma · cargo · busca
│   ├── Tabela: vaga · empresa · plataforma · link · match
│   └── Botão: Exportar CSV
├── 4. WHY USE SECTION (white background)
│   ├── Heading: "TUDO QUE VOCÊ PRECISA PARA SE RECLOCAR"
│   └── 6 cards: Gratuito · Sem Cadastro · Tempo Real · IA Perfil · Score · Assistente
├── 5. FAQ SECTION (light gray background)
│   ├── Heading: "PERGUNTAS FREQUENTES"
│   └── 10 itens expandíveis (details/summary)
└── 6. CHAT ASSISTENT (FAB + Drawer) — só para logados
    ├── Botão flutuante canto inferior direito
    ├── Drawer lateral (100% mobile, 400px desktop)
    ├── Histórico de conversas
    ├── Sugestões clicáveis
    ├── Badge "🔒 LGPD Sanitizado"
    └── Streaming de resposta IA
```

### Estados da Tabela

| Estado | Exibição |
|--------|----------|
| Nunca buscou | Seções: Why Use + FAQ visíveis |
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
```

### Registro (`/register`)
```
Formulário: nome + email + senha + confirmar senha
Validação: Zod (campos obrigatórios, senhas coincidem)
Feedback: Snackbar sucesso + redirect para /
```

### Perfil (`/perfil`) — requer login
```
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
  └── Link: "Ver vagas recomendadas →"
```

### Extensão Chrome (`/extensao/conectar`) — requer login
```
Onboarding em 3 passos:
  ├── 1. Instalar a extensão (link + instruções)
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
| Register | Spinner no btn | Snackbar + redirect | — | Alert inline |
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

## Currículo Adaptado (PDF)

- **Botão por vaga na `/busca`** (logado + com currículo importado): "GERAR CURRÍCULO ADAPTADO" → `POST /api/resume/generate` → **download direto do PDF** (sem fluxo multi-modal).
- Snackbar de sucesso ("Currículo adaptado baixado!") ou erro.
- No chat, a tool `generate_resume` gera a versão adaptada em markdown.
- Veracidade garantida em 3 camadas (prompt restritivo + input ATS + filtro pós-geração).

## Cursos — CTA de Fallback

- Abaixo da grade de cursos em `/cursos` e `/cursos/[skill]`: card "Não encontrou o curso desejado?" com botão "PROCURAR NA UDEMY →" apontando para o deep-link de afiliado `trk.udemy.com` (abre em nova aba).
