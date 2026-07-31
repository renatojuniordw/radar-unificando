# UX Flow — Radar Unificando v2

## Home Page (`/`)

### Seções da Home

```
/  (página única)
├── 1. HERO SECTION (dark background)
│   ├── Badge: "GUPY + INHIRE · GRÁTIS"
│   ├── Badges IA (logados): Chat IA · Perfil com IA · Score de Match
│   ├── Saudação personalizada (logados)
│   ├── Alerta: complete seu perfil (logados sem perfil completo)
│   ├── Heading: "RADAR DE VAGAS REMOTAS"
│   ├── Subtítulo: descrição com texto rotativo
│   ├── Inputs: Empresas + Cargos (opcionais)
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
│   └── 8 itens expandíveis (details/summary)
└── 6. CHAT ASSISTENT (FAB + Drawer)
    ├── Botão flutuante canto inferior direito
    ├── Drawer lateral (100% mobile, 400px desktop)
    ├── Histórico de conversas
    ├── Sugestões clicáveis
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
