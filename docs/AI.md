# AI Pipeline — Radar Unificando

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Provider | OpenAI-compatible (`AI_BASE_URL`) — Verboo ou OpenAI |
| SDK | Vercel AI SDK (`ai` + `@ai-sdk/openai-compatible`) |
| Validação | Zod schemas |
| Logging | JSON estruturado no stdout (`[AI_LOG]`) |
| Modelo | `AI_MODEL` (default `deepseek-v4-flash`) |
| Cache | `GeneratedContentCache` (TTL 30 dias, chave SHA-256) |

## Extração de Currículo

```
Upload PDF (LinkedIn export) ou texto colado
  → pdfjs-dist extrai texto raw (ou texto direto)
  → LLM extrai: skills, experienceYears, seniority, education, currentRole, area
  → Salva no Profile: resumeText, resumeMarkdown, skills, seniority,
    experienceYears, currentRole, area, education, profileSource=linkedin
```

Limite de input: `MAX_RESUME_CHARS = 12000`.

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

Auxiliares (sem rota própria, usados pelas tools):
- `job-analyzer.ts` — `analyzeJobFit()` (limites: resumo 30–15000 chars, descrição ≤ 8000, skills ≤ 60, timeout 20s)
- `cover-letter-generator.ts` — `generateCoverLetter()` (carta ≤ 3000 chars, ≤ 10 key points)
- `interview-questions.ts` — `generateInterviewQuestions()` (até 8 perguntas categorizadas)

> A **adaptação de currículo** (`resume_adaptation`) **não foi implementada** — a tool
> mais próxima é `generate_cover_letter`.

## Chat Assistente

```
Chat UI (MUI + @ai-sdk/react) → POST /api/chat (streaming)
  → LLM com ferramentas: search_jobs, get_my_profile, analyze_job_fit,
    compare_jobs, generate_cover_letter, get_interview_questions
  → Stream de resposta + logs no onFinish
```

Regras do sistema:
- Persona: consultor sênior de carreira (RH) em PT-BR
- `search_jobs`: no máximo 2 usos por pergunta do usuário
- Modo simulação de entrevista
- Limites de conversa: **25 mensagens por thread** e **50 interações/dia** (retorno 429/400)

### Formatação das Vagas

O prompt do sistema instrui o LLM a:
- Enviar **cada vaga como mensagem separada** para facilitar leitura
- Usar apenas **emojis funcionais**: 🏢 (empresa), 📍 (local), 🔗 (link), 📊 (dados), 📋 (lista)
- Evitar **emojis decorativos**: 🟢🟡🔴✅❌💡⚡🔥🏠⚠️
- Nunca enviar tabelas — usar listas ou cards com `label: valor`
- Links sozinhos em sua linha para facilitar clique

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
| `search_jobs` | limit | 1-100 (default 20) |
| `analyze_job_fit` | jobTitle | 1-200 chars, trim |
| `analyze_job_fit` | jobDescription | 10-5000 chars, trim |

## Env Vars

```env
# O SDK adiciona /v1 automaticamente — NÃO coloque /v1 na URL
AI_BASE_URL=https://code.verboo.ai/router   # Verboo
# AI_BASE_URL=https://api.openai.com/v1     # OpenAI
AI_API_KEY=sk-xxx
AI_MODEL=deepseek-v4-flash
```

> Nota: `.env.example` atual usa `https://code.verboo.ai/router/v1` (com `/v1`).
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
