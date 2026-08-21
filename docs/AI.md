# AI Pipeline — Radar Unificando

## Prompts

O texto de todos os prompts (system prompt do chat, extração de currículo, análise de vaga,
carta de apresentação, roteiro de entrevista, análise ATS, **expansão de queries de busca**)
vive centralizado em `src/lib/core/ai/prompts/` — um arquivo por prompt, separado da lógica de
validação, cache e chamada ao LLM (que permanece nos módulos de origem: `job-analyzer.ts`,
`cover-letter-generator.ts`, `interview-questions.ts`, `skill-extractor.ts`, `chat/route.ts`,
`core/ai/ats/ats-analyzer.ts`, `core/ai/query-expansion.ts`).

### Ferramentas do chat (`tools/`)

As tools do assistente foram extraídas de `chat-tools.ts` para `src/lib/core/ai/tools/` — um
arquivo por tool, com `chat-tools.ts` virando apenas um **agregador fino** (`createChatTools`)
que monta o objeto de tools a partir dos módulos:

| Tool | Módulo |
|------|--------|
| `search_jobs` | `tools/search-jobs.ts` |
| `get_my_profile` | `tools/get-my-profile.ts` |
| `analyze_ats_score` | `tools/analyze-ats-score.ts` |
| `analyze_job_fit` | `tools/analyze-job-fit.ts` |
| `compare_jobs` | `tools/compare-jobs.ts` |
| `generate_cover_letter` | `tools/generate-cover-letter.ts` |
| `generate_resume` | `tools/generate-resume.ts` |
| `get_interview_questions` | `tools/get-interview-questions.ts` |
| `recommend_courses` | `tools/recommend-courses.ts` |
| helpers (cache, formatação, dedup in-flight) | `tools/shared.ts` |

Cada tool declara seu próprio schema Zod (validação de input) e usa os módulos de domínio
(`job-analyzer.ts`, `cover-letter-generator.ts`, `interview-questions.ts`,
`resume-adaptation-generator.ts`, `ats/ats-service.ts`, `courses/`) — a separação segue o
mesmo princípio dos prompts: lógica de negócio fora do arquivo da tool.

O bloco `REGRAS DE SEGURANÇA (não negociáveis)` (defesa contra prompt injection, presente em
job-analyzer/cover-letter/interview-questions/ats-analyzer) é gerado por um helper compartilhado em
`prompts/shared/security-rules.ts`, para evitar que uma correção nessa defesa precise ser replicada
manualmente em cada prompt.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Provider | OpenAI-compatible (`AI_BASE_URL`) — Verboo ou OpenAI |
| SDK | Vercel AI SDK (`ai` + `@ai-sdk/openai-compatible`) |
| Validação | Zod schemas |
| Logging | JSON estruturado no stdout (`[AI_LOG]`) |
| Modelo | `AI_MODEL` (default `gpt-4o-mini`) |
| Cache | `GeneratedContentCache` (TTL 30 dias, chave SHA-256) |

## Extração de Currículo

```
Upload PDF (LinkedIn export) ou texto colado
  → valida magic bytes %PDF- (rejeita arquivo renomeado)
  → pdfjs-dist extrai texto raw (ou texto direto)
  → cria job de upload (assíncrono) → responde {jobId} na hora
  → background: LLM extrai skills, experienceYears, seniority, education, currentRole, area
  → cache por hash (1h) evita re-chamar a LLM para o mesmo currículo
  → salva no Profile: resumeText, resumeMarkdown, skills, seniority,
    experienceYears, currentRole, area, education, profileSource=linkedin
  → cliente faz polling em GET /api/upload/:jobId até completed/failed
```

Limite de input: `MAX_RESUME_CHARS = 12000`.
`maxOutputTokens` da extração: **2500** (orçamento menor força o modelo a responder antes de narrar raciocínio, reduzindo a latência).

### Robustez do LLM (`llm-provider.ts`)

Padrão centralizado: **`llmCall()`** (`shared/llm-call.ts`) — wrapper genérico que separa system/user prompts, aplica timeout, retry e validação Zod. Todos os callers usam `llmCall()` (exceto `skill-extractor`).

- **Retry automático** em `JSON não encontrado na resposta` **e** em timeout (`AbortError`/`TimeoutError`): uma segunda chamada com mais tokens (`*2`, mín. 4000) e um nudge mais forte ("responda IMEDIATAMENTE apenas com o JSON").
- **Timeout global**: `LLM_TIMEOUT_MS = 120_000` via `AbortSignal.timeout` no `generate()` (default de rede).
- **Timeouts por módulo** (`shared/with-timeout.ts`): módulos com latência crítica aplicam um timeout **menor** que o global, passando um `AbortSignal` ao `generate()` — quando estoura, o fetch subjacente é **realmente abortado** (não apenas a promise abandonada). Usado no ATS (35s, com 1 retry), `resume-adaptation-generator` e `interview-questions` (20s).
- **Cache**: `resume-extraction-cache.ts` — SHA-256 do markdown, TTL 1h, máx. 200 entradas in-memory.

### Campos Extraídos do Currículo

| Campo | Extraído | Descrição |
|-------|----------|-----------|
| skills | Sim | Skills técnicas e ferramentas mencionadas |
| experienceYears | Sim | Anos totais de experiência (nullable) |
| seniority | Sim | junior/pleno/senior/lead/manager/head |
| education | Sim | Áreas de formação acadêmica |
| currentRole | Sim | Cargo mais recente/atual (nullable) |
| area | Sim | Área de atuação (Dados/BI/Business/Growth/Engenharia/Produto/Outro) |

## Análise de Vaga e Fit (via chat)

Não existe rota dedicada `/api/analyze` — a análise é feita **dentro do chat** via ferramentas:

```
Chat UI → POST /api/chat (streaming)
  → LLM decide usar tools
  → analyze_job_fit(jobTitle, jobDescription, profile) → matched/missing skills,
    experiência, senioridade, educação, fit geral (high/medium/low) + recomendações
  → compare_jobs(2-5 vagas) → comparação lado a lado
```

Auxiliares (sem rota própria, chamados pelas tools `tools/analyze-job-fit.ts`,
`tools/generate-cover-letter.ts` e `tools/get-interview-questions.ts`; prompt de cada um
em `prompts/<nome>.ts`):
- `job-analyzer.ts` — `analyzeJobFit()` (limites: resumo 30–15000 chars, descrição ≤ 8000, skills ≤ 60, timeout 20s)
- `cover-letter-generator.ts` — `generateCoverLetter()` (carta ≤ 3000 chars, ≤ 10 key points)
- `interview-questions.ts` — `generateInterviewQuestions()` (até 8 perguntas categorizadas)

## Análise ATS Dedicada

Além da análise de fit via chat, existe uma rota dedicada **`POST /api/ats/analyze`**
(com rate limiting próprio) e a tool **`analyze_ats_score`** no chat:

- Entrada: currículo do perfil + descrição da vaga (opcional).
- Saída: **score 0-100**, checklist, palavras-chave faltando e recomendações.
- `ats-analyzer.ts` (LLM) + `ats-heuristics.ts` (heurísticas) + `ats-service.ts` (cache).
- Superfícies: drawer na `/busca` (botão por vaga), chat (tool), extensão Chrome.

**Prompt v4** (`prompts/ats-analyzer.ts`, `ATS_ANALYZER_PROMPT_VERSION = 'v4'`):
- **Não-discriminação obrigatória**: nome, gênero, idade/faixa etária inferida, estado civil,
  nacionalidade, foto ou endereço **nunca** influenciam score/strengths/missingKeywords/
  recommendations/skillScores — a avaliação é estritamente por mérito técnico. Foto/dados
  demográficos podem ser citados apenas em `formattingIssues` como boa prática de ATS.
- **Casos degenerados**: texto não reconhecível como currículo → `score: 0`, `summary`
  explicando e listas vazias.
- **Rubrica**: pesos fixos (keywords 30, resultados 20, formatação 20, contato 15, estrutura e
  densidade 10, e-mail 5); "estrutura e densidade" substituiu "comprimento em páginas" (o
  modelo não deve inferir número de páginas).
- **Robustez**: `ats-analyzer.ts` usa `shared/with-timeout.ts` (35s) com **1 retry** em timeout
  e mensagens de erro genéricas ao chamador (o `err.message` do provider nunca vaza).
- **Cache**: `ats-service.ts` — `buildAtsResumeInput(profile)` combina o currículo bruto com os
  campos estruturados do perfil (skills, senioridade, cargo, área, formação, experiência), de
  modo que edições na tela de perfil mudem a chave de cache (não serve resultado obsoleto);
  `inFlightAnalyses` deduplica chamadas concorrentes (mesmo usuário+currículo+vaga aguardam a
  mesma Promise).

### Adaptação de Currículo (`generate_resume`)

Implementada como tool do chat (`tools/generate-resume.ts`) e como geração de PDF:

- **Tool `generate_resume`** — gera uma versão do currículo adaptada à vaga
  (título, resumo, skills, experiência) com **veracidade garantida em 3 camadas**:
  prompt restritivo + input ATS (skills da vaga) + filtro pós-geração que bloqueia
  skills não presentes no currículo original.
- **PDF export** — `@react-pdf/renderer` (`lib/pdf/resume-pdf.tsx` +
  `render-resume-pdf.tsx`); download direto via `POST /api/resume/generate` e botão
  por vaga na `/busca` (`downloadAdaptedResume`).
- **Cache** por `resume_adaptation` (cache key) + hash (TTL 30 dias em `GeneratedContentCache`).

## Expansão de Queries de Busca

No pipeline de busca, cada query do usuário é expandida em **variantes de busca** (sinônimos
PT/EN, cargos equivalentes) para a Gupy buscar por substring no título:

- **Orquestrador**: `core/pipeline/query-expansion/service.ts` — mapa curado → cache → LLM,
  com dedupe de quase-duplicatas, single-flight e fail-open (a busca nunca quebra se a IA falhar).
- **Mapa curado**: `core/pipeline/query-expansion/map.ts` (~15 cargos → variantes determinísticas).
- **Cache global**: `core/pipeline/query-expansion/cache.ts` — Redis (`query_expansion:v1:<sha256>`,
  TTL 30 dias) + fallback em memória. Cada query expande via LLM uma única vez.
- **Chamada LLM**: `core/ai/query-expansion.ts` — schema Zod `{variants: 1..6}`; `generate()` com
  `maxOutputTokens: 300`; **lança** em erro (o service trata).
- **Prompt**: `prompts/query-expansion.ts` (`QUERY_EXPANSION_PROMPT_VERSION = 'v1'`) — instrui o
  modelo a devolver só termos-raiz equivalentes (busca é por substring: nada de senioridade),
  sempre incluir a original e nunca termos de outras áreas (moda, automotivo, etc.), com o bloco
  `securityRules()` anti prompt-injection padrão.
- **Sanitização**: `sanitizeVariants` descarta variantes com lixo (vagas/emprego/jobs/hiring/2026).

O fluxo completo e os limites estão em `docs/PIPELINE.md` → "Expansão de Queries".

## Chat Assistente

```
Chat UI (MUI + @ai-sdk/react) → POST /api/chat (streaming)
  → LLM com ferramentas: search_jobs, get_my_profile, analyze_ats_score,
    analyze_job_fit, compare_jobs, generate_cover_letter, generate_resume,
    get_interview_questions, recommend_courses
  → Stream de resposta + logs no onFinish
```

Regras do sistema:
- Persona: consultor sênior de carreira (RH) em PT-BR
- `search_jobs`: no máximo 2 usos por pergunta do usuário (enforcement no código)
- Modo simulação de entrevista
- Limites de conversa: **25 mensagens por thread** e **50 interações/dia** (retorno 429/400)

### Métricas e Tetos de Tokens

O custo de IA é medido em tokens reais, capturados do `usage` que o provider devolve no `onFinish` do `streamText` (`promptTokens`/`completionTokens`/`totalTokens`) e persistidos na tabela **`chat_usage`** (por usuário, com hash do IP). Isso alimenta:

- **Header do chat**: Contexto (tokens da última chamada — janela enviada), Hoje e Mês (consumo acumulado), com aviso visual em 80% do teto.
- **Tetos verificados no início do POST /api/chat** (429 `TOKEN_LIMIT_REACHED`): diário **100k tokens** (`DAILY_TOKEN_LIMIT`), mensal **2M tokens** (`MONTHLY_TOKEN_LIMIT`), por IP **300k/dia** (`IP_DAILY_TOKEN_LIMIT`). A soma considera o grupo de contas com o mesmo `resume_hash` (anti multi-conta).
- **Custo estimado por chamada** no log `[AI_LOG]` (`estimatedCostUsd`), usando preços do gpt-4o-mini (env `AI_INPUT_PRICE_PER_1M`/`AI_OUTPUT_PRICE_PER_1M`).
- **Concorrência**: lock no Redis (`chat_lock:{userId}`, TTL 120s) garante 1 resposta em andamento por usuário — evita a race de 2 chamadas passarem o teto juntas.

Janela deslizante: apenas as **15 mensagens mais recentes** (`MAX_CONTEXT_MESSAGES`) são enviadas ao modelo.

### Formatação das Vagas

O prompt do sistema instrui o LLM a usar um **bloco determinístico por vaga**, que o
frontend parseia e renderiza como **cards estruturados**:

```
🏢 **Título da Vaga** — Empresa
📍 Cidade/Estado | Tipo
📅 Publicada em {data}
🔗 https://...
```

- Cada campo em linha própria, **sem linha em branco dentro do bloco** e **exatamente uma linha em branco entre vagas**.
- `Tipo` ∈ `Remoto | Híbrido | Presencial`; a linha `📅` é omitida se `publicado` vier vazio; `🔗` leva URL pura.
- Descrição opcional após `🔗`: `**Descrição:** {1–3 frases curtas}`.
- Máximo **3 destaques por vez**; emojis funcionais: 🏢 📍 📅 🔗 📊 📋 (evitar decorativos: 🟢🟡🔴✅❌💡⚡🔥🏠⚠️); nunca tabelas.

**Renderização:** `markdown-content.tsx` → `job-card-parser.ts` (extrai título, empresa,
local, modalidade, data, link e descrição) → `job-card.tsx` (card com "Ver Vaga" no canto
superior direito, linha de metadados e descrição truncada). Quebras de linha simples viram
`<br>` (`remark-breaks`) como fallback quando o bloco não segue o formato.

### Redação de PII (LGPD)

`pii-redactor.ts` aplica regex e remove CPF, CNPJ, RG, telefone e cartão de crédito
→ `[CPF REDIGIDO]`, etc. Aplicado em: mensagens do usuário no `/api/chat`, POST de
histórico (`/api/chat/history`) e no botão copiar da UI. A UI exibe badge "🔒 LGPD Sanitizado".

### Proteção contra Prompt Injection

O `POST /api/chat` aplica três camadas de proteção:

1. **Validação de input**: mensagens truncadas em 2000 chars, tags HTML (`<>`) removidas
2. **Detecção de padrões suspeitos**: regex para jailbreak (`ignore instructions`, `system prompt`, `reveal instructions`, `bypass rules`) — gera log `suspicious_activity` (400)
3. **Hardening do system prompt**: seção `SEGURANÇA E LIMITES` que proíbe revelar instruções internas, executar bypass ou desviar do foco

`stopWhen: stepCountIs(10)` limita passos de tool por mensagem.

### Validação de Inputs das Tools

| Tool | Campo | Validação |
|------|-------|-----------|
| `search_jobs` | query | 2-200 chars, regex `[a-zA-Z0-9\s\-_.]` |
| `search_jobs` | limit | 1-20 (default 10) — descrição truncada em 800 chars e embrulhada em `<untrusted_content>`; links mortos (404/410) são filtrados via `job-link-filter` |
| `analyze_ats_score` | jobDescription | opcional, máx 8000 chars — usa `buildAtsResumeInput` (currículo + campos do perfil; cache por versão) |
| `analyze_job_fit` | jobTitle | 1-200 chars, trim |
| `analyze_job_fit` | jobDescription | 10-5000 chars, trim |

## Env Vars

```env
# O provider usa AI_BASE_URL diretamente (não adiciona /v1 automaticamente).
# Inclua o caminho completo, incluindo /v1 quando o endpoint exigir.
AI_BASE_URL=https://code.verboo.ai/router/v1   # Verboo (default do .env.example)
# AI_BASE_URL=https://api.openai.com/v1        # OpenAI (default do provider)
AI_API_KEY=sk-xxx
AI_MODEL=gpt-4o-mini
```

> Nota: `.env.example` usa `https://code.verboo.ai/router/v1` (com `/v1`).
> O provider (`llm-provider.ts`) tem default `https://api.openai.com/v1`.

## Logging

Todos os eventos AI geram logs JSON no stdout com prefixo `[AI_LOG]`:

```bash
# Acompanhar em tempo real
npm run dev 2>&1 | grep "\[AI_LOG\]" | jq .

# Filtrar extrações com erro
npm run dev 2>&1 | grep "\[AI_LOG\]" | jq 'select(.success == false)'

# Ver latências médias de extração
npm run dev 2>&1 | grep "\[AI_LOG\]" | jq 'select(.event == "resume_extraction") | .latencyMs'

# Correlacionar eventos por traceId
npm run dev 2>&1 | grep "\[AI_LOG\]" | jq 'select(.traceId == "uuid-aqui")'
```

### Eventos

| Evento | Campos principais |
|---|---|
| `resume_extraction` | traceId, latencyMs, skillsCount, experienceYears, seniority, success |
| `job_analysis` | traceId, latencyMs, jobTitle, matchedCount, missingCount, overallFit, success |
| `cover_letter_generation` | traceId, latencyMs, jobTitle, letterLength, keyPoints, success |
| `interview_questions` | traceId, latencyMs, jobTitle, questionsCount, success |
| `chat_interaction` | traceId, latencyMs, messageCount, toolsCalled, finishReason, usage, success |
| `suspicious_activity` | traceId, userId, pattern (`potential_prompt_injection`), success |
