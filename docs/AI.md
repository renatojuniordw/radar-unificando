# AI Pipeline — Radar Unificando

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Provider | Verboo (OpenAI-compatible) ou OpenAI |
| SDK | Vercel AI SDK (`ai` + `@ai-sdk/openai`) |
| Validação | Zod schemas |
| Logging | JSONL estruturado (`[AI_LOG]`) |
| Modelo | `deepseek-v4-flash` (Verboo) / `gpt-4o-mini` (OpenAI) |

## Pipeline de Extração

```
Upload PDF
  → pdfjs-dist extrai texto raw
  → LLM converte para markdown + extrai skills/exp/seniority/education
  → Salva no Profile: resumeText, resumeMarkdown, skills, parsedData
```

## Pipeline de Análise de Vaga

```
Usuário clica "ANALISAR PERFIL" no MatchDialog
  → POST /api/analyze { jobId }
  → LLM compara perfil vs descrição da vaga
  → Retorna matched/missing skills, fit, recomendações
```

## Pipeline de Adaptação

```
Usuário clica "ADAPTAR CURRÍCULO" no MatchDialog
  → POST /api/resume/adapt { jobId }
  → LLM adapta currículo para a vaga
  → Retorna currículo markdown + highlights + missing skills
```

## Chat Assistente

```
Chat UI → POST /api/chat (streaming)
  → LLM com ferramentas: search_jobs, get_my_profile, get_job_details
  → Stream de resposta + logs no onFinish
```

## Env Vars

```env
# O SDK adiciona /v1 automaticamente — NÃO coloque /v1 na URL
AI_BASE_URL=https://code.verboo.ai/router   # Verboo
# AI_BASE_URL=https://api.openai.com/v1     # OpenAI
AI_API_KEY=sk-xxx
AI_MODEL=deepseek-v4-flash
```

## Migração Verboo → OpenAI

| Variável | Verboo | OpenAI |
|---|---|---|
| `AI_BASE_URL` | `https://code.verboo.ai/router` | `https://api.openai.com/v1` |
| `AI_MODEL` | `deepseek-v4-flash` | `gpt-4o-mini` |
| `AI_API_KEY` | Chave Verboo | Chave OpenAI |

Apenas alterar `.env`. Zero mudanças de código.

## Logging

Todos os eventos AI geram logs JSONL no stdout com prefixo `[AI_LOG]`:

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
| `resume_adaptation` | traceId, latencyMs, jobTitle, highlightsCount, missingSkillsCount, success |
| `chat_interaction` | traceId, latencyMs, messageCount, toolsCalled, finishReason, usage, success |
