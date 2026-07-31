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
Upload PDF (LinkedIn export) ou texto colado
  → pdfjs-dist extrai texto raw (ou texto direto)
  → LLM extrai: skills, experienceYears, seniority, education, currentRole, area
  → Salva no Profile: resumeText, resumeMarkdown, skills, seniority, experienceYears, currentRole, area, education, profileSource=linkedin
```

### Campos Extraídos do Currículo

| Campo | Extraído | Descrição |
|-------|----------|-----------|
| skills | Sim | Skills técnicas e ferramentas mencionadas |
| experienceYears | Sim | Anos totais de experiência profissional |
| seniority | Sim | junior/pleno/senior/lead/manager/head |
| education | Sim | Áreas de formação acadêmica |
| currentRole | Sim | Cargo mais recente/atual |
| area | Sim | Área de atuação (Dados/BI/Business/Growth/Engenharia/Produto/Outro) |

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
  → LLM com ferramentas: search_jobs, get_my_profile, analyze_job_fit
  → Stream de resposta + logs no onFinish
```

### Formatação das Vagas

O prompt do sistema instrui o LLM a:
- Enviar **cada vaga como mensagem separada** para facilitar leitura
- Usar apenas **emojis funcionais**: 🏢 (empresa), 📍 (local), 🔗 (link), 📊 (dados), 📋 (lista)
- Evitar **emojis decorativos**: 🟢🟡🔴✅❌💡⚡🔥🏠⚠️
- Nunca enviar tabelas — usar listas ou cards com `label: valor`
- Links sozinhos em sua linha para facilitar clique

### Proteção contra Prompt Injection

O `POST /api/chat` aplica três camadas de proteção:

1. **Validação de input**: mensagens truncadas em 2000 chars, tags HTML (`<>`) removidas
2. **Detecção de padrões suspeitos**: regex para jailbreak (`ignore instructions`, `system prompt`, etc.) — gera log `suspicious_activity`
3. **Hardening do system prompt**: seção `SEGURANÇA E LIMITES` que proíbe revelar instruções internas, executar bypass ou desviar do foco

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
| `suspicious_activity` | traceId, userId, pattern (`potential_prompt_injection`), success |
