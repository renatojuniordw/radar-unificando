# Relatório de Auditoria — Segurança, LGPD e Deploy

**Projeto:** Radar Unificando v2.0.0  
**Data:** 13 de agosto de 2026 (re-execução sobre o estado pós-correções de 12/08/2026)  
**Modo:** auditoria estritamente read-only. Após a auditoria, as correções V-1 a V-6 foram aplicadas a pedido do usuário e re-verificadas — os status abaixo já refletem o estado pós-correção.  
**Escopo:** 38 itens — Segurança Front-End (10), Segurança Back-End (10), LGPD Específico (10), Checklist de Deploy (8)

---

## Resumo Executivo

| Métrica | Valor |
|---------|-------|
| Total de itens avaliados | 38 |
| Aplicáveis | 33 |
| Não aplicáveis | 1 |
| Não verificáveis no repositório | 4 |

| Severidade | Quantidade |
|------------|-----------|
| **Crítico** | 0 |
| **Alto** | 0 |
| **Médio** | 2 |
| **Baixo** | 3 |

**Mudanças desde o relatório de 12/08:**
- Os 2 itens **Críticos** (exclusão de conta — Art. 18, VI — e portabilidade — Art. 18, V) foram implementados e estão **Conformes**.
- Os itens 1.4 (JSON-LD), 1.10 (anti-enumeração), 2.6 (erro ATS), 3.1/3.2/3.8/3.10 (termos), 3.3 (consentimento Impact), 3.7 (retenção automática), 4.1 (HSTS) e 4.8 (entrypoint) tiveram as correções aplicadas e foram re-verificados como Conformes/Parcialmente conformes.
- **Achado Alto (1.1) corrigido em 13/08:** o CSP bloqueava os scripts externos do GA4 e da Impact (`script-src 'self'` sem os domínios de terceiros). A whitelist foi aplicada em `next.config.ts` e `nginx.conf` (ver validação V-1). Item agora **Conforme**.
- **Achado Médio (3.5) corrigido em 13/08:** o export agora inclui o texto real do currículo (ver validação V-2). Item agora **Conforme**.

**Pontos fortes confirmados no estado atual:**
- Rate limiting robusto e centralizado (8 perfis Redis+memória + limiters in-memory + zonas Nginx)
- PII redaction automatizada antes de enviar ao LLM e antes de persistir
- CORS restritiva com allowlist dinâmica (sem reflexão de origem desconhecida)
- Auth com bcrypt cost=12, JWT via NextAuth v5 em cookie HttpOnly; token da extensão só armazenado como hash SHA-256
- JSON-LD centralizado em `toScriptJson` (escape `<`/`>`/`&`) em todas as 7 inserções via `dangerouslySetInnerHTML`
- Docker com `no-new-privileges`, non-root, resource limits e healthcheck; `migrate deploy` no entrypoint
- Novo `DELETE /api/auth/account` com transação em cascata e `GET /api/export` (LGPD Art. 18)
- Rotina de retenção automática (`/api/cron/cleanup`) protegida por header com comparação constante de tempo

---

## 1. Segurança Front-End

### 1.1 CSP (Content Security Policy)

- **Aplicável:** Sim — o projeto serve HTML e injeta scripts de terceiros (GA4, Impact)
- **Status:** Conforme
- **Evidência:** `nginx/nginx.conf:75-78`, `next.config.ts:17-31` — `script-src` agora inclui `https://www.googletagmanager.com https://www.google-analytics.com https://utt.impactcdn.com` nas duas camadas
- **Problema:** Nenhum — a whitelist dos domínios de terceiros (achado V-1) foi aplicada em 13/08, desbloqueando GA4 e Impact. Permanece `'unsafe-inline'`/`'unsafe-eval'` em `script-src` (enfraquece levemente a proteção, mas é exigido pelo MUI/Next; remover exige teste de compatibilidade).
- **Sugestão de correção (opcional):** testar remoção de `'unsafe-eval'`; manter a whitelist se novos domínios de tracking forem adicionados.

---

### 1.2 CORS — Reflexão de Origem

- **Aplicável:** Sim
- **Status:** Conforme
- **Evidência:** `src/middleware.ts:25-79`
- **Problema:** Nenhum — allowlist dinâmica (self, forwarded origin, AUTH_URL, NEXTAUTH_URL, EXTENSION_ORIGIN); origens desconhecidas não são refletidas. Preflight OPTIONS de origem não permitida retorna 403 (impede até o envio de DELETE cross-site).
- **Sugestão de correção:** Nenhuma.

---

### 1.3 CSRF Protection

- **Aplicável:** Sim
- **Status:** Conforme
- **Evidência:** `src/middleware.ts:76-79`, `src/auth.config.ts:23-25`
- **Problema:** Nenhum — mutações fora da allowlist retornam 403; `/api/auth/*` é isenta por design (NextAuth) e as rotas próprias sob `/api/auth` (register) exigem corpo JSON (form CSRF falha no parse) e o `DELETE /api/auth/account` só dispara após preflight OPTIONS que retorna 403 para origem estranha. Padrão JWT em cookie HttpOnly.
- **Sugestão de correção:** Nenhuma.

---

### 1.4 XSS via dangerouslySetInnerHTML

- **Aplicável:** Sim
- **Status:** Conforme
- **Evidência:** grep de todas as ocorrências — 7 usos, todos via `toScriptJson`: `src/components/seo/structured-data.tsx:56,60,64`, `src/components/seo/faq-structured-data.tsx:24`, `src/components/seo/job-posting-schema.tsx:63`, `src/app/guia-ats/page.tsx:46`, `src/app/extensao/page.tsx:99`
- **Problema:** Nenhum — a correção de 12/08 centralizou a serialização em `src/lib/core/seo/jsonld.ts:11-16` (`toScriptJson` escapa `<` `>` `&` como `\uXXXX`), e **todas** as inserções JSON-LD migraram. Não há mais `JSON.stringify` cru em `dangerouslySetInnerHTML`.
- **Sugestão de correção:** Nenhuma. (Opcional: regra ESLint que proíba `dangerouslySetInnerHTML` com `JSON.stringify` direto, para evitar regressão futura.)

---

### 1.5 Token/Sessão em Armazenamento Inseguro

- **Aplicável:** Sim
- **Status:** Conforme
- **Evidência:** `src/lib/infrastructure/storage/browser-storage.ts`, `src/components/ui/cookie-consent.tsx:55-63` (localStorage só para `cookie_consent`)
- **Problema:** Nenhum — `localStorage` guarda apenas preferências de UI, consentimento e cooldowns; o JWT fica em cookie HttpOnly gerenciado pelo NextAuth.
- **Sugestão de correção:** Nenhuma.

---

### 1.6 Sanitização de Output

- **Aplicável:** Sim
- **Status:** Conforme
- **Evidência:** `react-markdown` (sem `rehype-raw`), `src/lib/core/ai/chat-guard.ts:45-55`
- **Problema:** Nenhum — React escapa por padrão; o chat não habilita HTML raw.
- **Sugestão de correção:** Nenhuma.

---

### 1.7 Validação de Input no Client

- **Aplicável:** Sim
- **Status:** Conforme
- **Evidência:** `src/lib/core/auth/register-schema.ts`, `src/lib/core/profile/profile-schema.ts`, `src/lib/core/pipeline/pipeline-schema.ts`
- **Problema:** Nenhum — schemas Zod compartilhados client/server.
- **Sugestão de correção:** Nenhuma.

---

### 1.8 Validação de Tipo de Arquivo (Upload)

- **Aplicável:** Sim
- **Status:** Conforme
- **Evidência:** `src/app/api/upload/route.ts:27-39`
- **Problema:** Nenhum — magic bytes (`%PDF-`), 5MB, não-vazio, renomeação rejeitada, 20 páginas.
- **Sugestão de correção:** Nenhuma.

---

### 1.9 Validação de URL/Redirecionamento

- **Aplicável:** Sim
- **Status:** Conforme
- **Evidência:** `docs/SECURITY.md` — `isSafeRedirectUri` aceita somente `https://*.chromiumapp.org`
- **Problema:** Nenhum — sem open redirect na entrega do token da extensão.
- **Sugestão de correção:** Nenhuma.

---

### 1.10 Senhas em Mensagens de Erro

- **Aplicável:** Sim
- **Status:** Conforme
- **Evidência:** `src/app/api/auth/register/route.ts:45-50` (400 `'Dados inválidos'` unificado), `src/app/api/chat/route.ts:173-174,277-290` (mensagens genéricas; detalhe só no `console.error`), `src/__tests__/api-auth-register.test.ts:56-63`
- **Problema:** Nenhum — a correção de 12/08 unificou a mensagem de email já cadastrado com a de validação (mesmo status 400, mesmo texto), eliminando a enumeração de contas. Erros internos não vazam para o client.
- **Sugestão de correção:** Nenhuma.

---

## 2. Segurança Back-End

### 2.1 SQL Injection

- **Aplicável:** Sim
- **Status:** Conforme
- **Evidência:** Prisma (queries parametrizadas), `src/app/api/health/route.ts:6` (`SELECT 1` estático)
- **Problema:** Nenhum.
- **Sugestão de correção:** Nenhuma.

---

### 2.2 Autenticação — Força Bruta

- **Aplicável:** Sim
- **Status:** Conforme
- **Evidência:** `src/auth.ts:34-40` (rate limit `auth` 5/min por IP+email), `src/lib/infrastructure/rate-limit.ts:13-22`
- **Problema:** Nenhum.
- **Sugestão de correção:** Nenhuma.

---

### 2.3 Autorização / Broken Access Control

- **Aplicável:** Sim
- **Status:** Parcialmente conforme
- **Severidade:** Médio
- **Evidência:** `src/lib/api/auth-guard.ts:26-35` (requireAuth), rotas filtram por `session.user.id`; Prisma self-hosted Postgres sem RLS
- **Problema:** Isolamento feito exclusivamente no código da aplicação. Como o projeto usa Postgres próprio (não Supabase), habilitar RLS é viável (extensão + políticas por `userId`), mas não está implementado. Se alguma rota esquecer o filtro por `userId`, dados de outro usuário vazam. O risco é mitigado pela revisão de cada rota e pelos schemas Zod, mas permanece como defesa em profundidade ausente.
- **Sugestão de correção:** (1) Habilitar RLS no Postgres para `profiles`, `jobs`, `chats`, `chat_messages`, etc., com política por `user_id`; (2) adicionar testes de autorização ("usuário A não lê dados do usuário B").

---

### 2.4 Rate Limiting em Todas as Rotas Mutáveis

- **Aplicável:** Sim
- **Status:** Conforme
- **Evidência:** `src/lib/infrastructure/rate-limit.ts:13-22` (8 perfis), `src/lib/infrastructure/security/rate-limiter.ts:34-38` (pipeline/upload in-memory), `nginx/nginx.conf:8-10,101-131,143-146`
- **Problema:** Nenhum — multi-camada: Redis (fallback memória), in-memory e zonas Nginx.
- **Sugestão de correção:** Nenhuma.

---

### 2.5 CORS no Back-End

- **Aplicável:** Sim
- **Status:** Conforme
- **Evidência:** ver item 1.2.
- **Sugestão de correção:** Nenhuma.

---

### 2.6 Exposição de Informações Sensíveis em Erros

- **Aplicável:** Sim
- **Status:** Conforme
- **Evidência:** `src/app/api/ats/analyze/route.ts:62-68` (erro genérico `'Erro ao analisar o currículo.'`, detalhe só no log), `src/app/api/chat/route.ts` (mensagens genéricas), `src/app/api/auth/account/route.ts:30-34`, `src/app/api/export/route.ts:147-151`
- **Problema:** Nenhum — a correção de 12/08 removeu a exposição de `error.message` na rota ATS (antes `slice(0, 300)`). Todas as novas rotas também retornam erro genérico.
- **Sugestão de correção:** Nenhuma.

---

### 2.7 Validação de Input no Server

- **Aplicável:** Sim
- **Status:** Conforme
- **Evidência:** schemas Zod (`register-schema`, `profile-schema`, `pipeline-schema`, `extraction-schema`), `src/app/api/upload/route.ts`
- **Problema:** Nenhum.
- **Sugestão de correção:** Nenhuma.

---

### 2.8 Hash de Senhas

- **Aplicável:** Sim
- **Status:** Conforme
- **Evidência:** `src/app/api/auth/register/route.ts:52`, `src/auth.ts:46` (bcrypt cost 12)
- **Problema:** Nenhum. (Seed `admin123` só em dev, via comando manual.)
- **Sugestão de correção:** Nenhuma.

---

### 2.9 Segredo de JWT

- **Aplicável:** Sim
- **Status:** Conforme
- **Evidência:** `src/auth.config.ts:26` (`AUTH_SECRET`), `.gitignore:5-7`
- **Problema:** Nenhum.
- **Sugestão de correção:** Nenhuma.

---

### 2.10 Extensão Chrome — Armazenamento de Token

- **Aplicável:** Sim
- **Status:** Conforme
- **Evidência:** `src/lib/core/extension/extension-token.ts`, `prisma/schema.prisma:32-43` (só `tokenHash` persistido)
- **Problema:** Nenhum.
- **Sugestão de correção:** Nenhuma.

---

## 3. LGPD Específico

### 3.1 Base Legal para Tratamento de Dados

- **Aplicável:** Sim
- **Status:** Conforme
- **Evidência:** `src/app/termos/page.tsx` — Seção 10 (nova, 12/08): bases legais por categoria (Art. 7º, V para cadastro; I para currículo/IA e cookies; IX para logs/rate limiting; II para obrigações legais)
- **Problema:** Nenhum — a ausência original (risco legal Alto) foi sanada com seção dedicada mapeando cada categoria de dados à base legal.
- **Sugestão de correção:** Nenhuma.

---

### 3.2 Política de Privacidade

- **Aplicável:** Sim
- **Status:** Parcialmente conforme
- **Severidade:** Baixo
- **Evidência:** `src/app/termos/page.tsx` — Seções 9 (Controlador/DPO), 10 (Base Legal), 11 (Transferência Internacional) e atualizações nas seções 6/7/8
- **Problema:** N/A (projeto de código aberto mantido por pessoa física, sem CNPJ).
- **Sugestão de correção:** Identificação do controlador atualizada na Seção 9 como projeto open-source mantido por Renato Bezerra (Pessoa Física).

---

### 3.3 Consentimento de Cookies

- **Aplicável:** Sim
- **Status:** Conforme
- **Evidência:** `src/components/ui/cookie-consent.tsx:16-22,48-53,67` (GA4 e Impact só após `accepted`), `src/app/layout.tsx` (script Impact removido; meta `siteVerification` permanece), `src/app/termos/page.tsx` (Seção 6 atualizada)
- **Problema:** Nenhum em termos de consentimento — a correção moveu o tracking da Impact para o `CookieConsent`, carregando apenas com consentimento. **Ressalva funcional:** ver item 1.1 — o CSP pode estar bloqueando os scripts mesmo com consentimento; é o item 1.1 que precisa ser corrigido para o tracking funcionar.
- **Sugestão de correção:** Resolver o CSP (item 1.1). Adicionar guard de duplicação no `loadImpactScript` (ver validação V-3).

---

### 3.4 Direito de Exclusão de Conta/Dados

- **Aplicável:** Sim
- **Status:** Conforme
- **Evidência:** `src/app/api/auth/account/route.ts:10-36` (DELETE), `src/lib/infrastructure/repositories/user-repository.ts:22-52` (`deleteAllUserData` em transação), `src/app/(dashboard)/perfil/page.tsx:90-104,272-315` (botão + ConfirmDialog), `prisma/schema.prisma` (FKs `onDelete: Cascade`/`SetNull`)
- **Problema:** Nenhum — o endpoint verifica autenticação (`requireAuth`), exclui todos os dados do usuário em transação (ordem verificada contra as FKs do schema: mensagens → usage → chats → cache → logs de candidatura → candidaturas → pipeline → presence → jobs → empresas → tokens → feedback → cliques → perfil → sessões → usuário), e limpa os cookies de sessão do NextAuth (via `cookies()` de `next/headers`, não `signOut` — evita o bug de server action em route handler). Botão com diálogo de confirmação dupla.
- **Sugestão de correção:** Nenhuma. (Opcional: adicionar teste automatizado da rota.)

---

### 3.5 Portabilidade de Dados

- **Aplicável:** Sim
- **Status:** Conforme
- **Evidência:** `src/app/api/export/route.ts:11-146`, `src/app/(dashboard)/perfil/page.tsx:74-88` (download direto)
- **Problema:** Nenhum — o achado V-2 foi corrigido em 13/08: o export agora inclui o perfil completo (`resumeText`/`resumeMarkdown`/`parsedData`) em vez do placeholder enganoso. Teste de regressão adicionado em `api-export-lgpd.test.ts`. O token da extensão continua excluído do dump (apenas metadados + marcação `[excluído por segurança]`).
- **Sugestão de correção:** Nenhuma.

---

### 3.6 Anonimização/Redação de PII

- **Aplicável:** Sim
- **Status:** Conforme
- **Evidência:** `src/lib/core/ai/pii-redactor.ts:19-28` (CPF, CNPJ, RG, telefone, cartão), aplicado antes do LLM e antes de persistir
- **Problema:** Nenhum.
- **Sugestão de correção:** Nenhuma.

---

### 3.7 Retenção de Dados — Política Documentada e Automatizada

- **Aplicável:** Sim
- **Status:** Conforme
- **Evidência:** `src/lib/infrastructure/cleanup/retention-cleanup.ts:19-43` (cache expirado + chats inativos > 12 meses), `src/app/api/cron/cleanup/route.ts:18-42` (protegido por `x-cron-secret` com `timingSafeEqual`), `src/app/termos/page.tsx` (Seção 8 com prazos exatos)
- **Problema:** Nenhum em código — a rotina existe e a política documenta os prazos. O guard de `NaN` no env (achado V-5) foi aplicado em 13/08 (`retention-cleanup.ts:9-14`). **Dependências de configuração (não código):** `CRON_SECRET` precisa existir no `.env` e o cron do VPS precisa chamar `/api/cron/cleanup` (a rota responde 503 enquanto `CRON_SECRET` ausente). Registros `chat_usage` órfãos não são limpos (decisão: mantidos para o controle de orçamento de consumo).
- **Sugestão de correção:** definir `CRON_SECRET` e agendar a chamada no cron do VPS.

---

### 3.8 DPO / Canal de Contato

- **Aplicável:** Sim
- **Status:** Parcialmente conforme
- **Severidade:** Baixo
- **Evidência:** `src/app/termos/page.tsx` — Seção 9 (DPO: Renato Bezerra; canal `privacidade@unificando.com.br`; prazo 15 dias úteis, Art. 19)
- **Problema:** A estrutura exigida pelo Art. 41 existe. Resta apenas confirmar que o email `privacidade@unificando.com.br` está criado e é monitorado (o controlador está identificado como projeto open-source mantido por pessoa física).
- **Sugestão de correção:** confirmar/criar o email de DPO.

---

### 3.9 Menores de Idade

- **Aplicável:** Não
- **Justificativa:** serviço de busca de vagas direcionado a profissionais adultos; sem coleta intencional de dados de menores.

---

### 3.10 Transferência Internacional de Dados

- **Aplicável:** Sim
- **Status:** Conforme
- **Evidência:** `src/lib/core/ai/llm-provider.ts:5-7` (`AI_BASE_URL` — provedor externo, possivelmente EUA), `src/app/termos/page.tsx` — Seção 11 (minimização, sem venda de dados, SCCs/adequação)
- **Problema:** Nenhum estrutural — a política agora documenta a transferência e as salvaguardas (Art. 33). Nota: a afirmação de "cláusulas contratuais padrão (SCCs)" é declaração legal que deve ser confirmada com o provedor real (OpenAI/Verboo) para não ser fictícia.
- **Sugestão de correção:** confirmar o mecanismo de transferência real com o provedor e ajustar a redação se necessário.

---

## 4. Checklist de Deploy

### 4.1 HTTPS Forçado

- **Aplicável:** Sim
- **Status:** Conforme
- **Evidência:** `nginx/nginx.conf:35-37` (301 HTTP→HTTPS), `nginx/nginx.conf:71` e `next.config.ts` (HSTS `max-age=63072000; includeSubDomains; preload` — alinhados após a correção)
- **Problema:** Nenhum — o `max-age` do nginx foi alinhado com o do next.config (era 1 ano, agora 2).
- **Sugestão de correção:** Nenhuma.

---

### 4.2 Versões de Dependências Atualizadas

- **Aplicável:** Sim
- **Status:** Conforme
- **Evidência:** `package.json` (Next 15.1, React 19, Prisma 7.9, TS 5.6)
- **Problema:** Sem `npm audit` no CI; upgrade quebrador pendente para next@16.3 (anotado em memória de segurança). Não bloqueia o deploy atual.
- **Sugestão de correção:** adicionar `npm audit` ao CI quando houver; planejar o upgrade 16.x.

---

### 4.3 Variáveis Sensíveis Não Versionadas

- **Aplicável:** Sim
- **Status:** Conforme
- **Evidência:** `.gitignore:5-7`, `.env.example` (placeholders apenas)
- **Problema:** Nenhum.
- **Sugestão de correção:** Nenhuma.

---

### 4.4 Health Check Configurado

- **Aplicável:** Sim
- **Status:** Conforme
- **Evidência:** `Dockerfile` (HEALTHCHECK), `docker-compose.yml` (app/postgres/redis), `src/app/api/health/route.ts`
- **Problema:** Nenhum.
- **Sugestão de correção:** Nenhuma.

---

### 4.5 Logs Estruturados

- **Aplicável:** Sim
- **Status:** Parcialmente conforme
- **Severidade:** Médio
- **Evidência:** `src/lib/core/ai/ai-logger.ts`, `console.error/warn` em várias rotas
- **Problema:** Segue sem solução centralizada (pino/Sentry). Ficou de fora do escopo de 12/08 (follow-up). Não é risco de segurança, mas dificulta correlação/monitoração.
- **Sugestão de correção:** middleware de log JSON (pino) ou integração com observabilidade (Sentry).

---

### 4.6 Backup do Banco de Dados

- **Aplicável:** Sim
- **Status:** Não verificável no repositório
- **O que seria necessário para verificar:** acesso ao VPS/painel do provedor — rotina de `pg_dump`/WAL archiving/snapshot do volume Docker do Postgres.

---

### 4.7 Monitoramento / Alertas

- **Aplicável:** Sim
- **Status:** Não verificável no repositório
- **O que seria necessário para verificar:** ferramentas na VPS (UptimeRobot, Prometheus, Grafana, Sentry) e alertas para health/falhas de banco.

---

### 4.8 Rollback / Zero-Downtime Deploy

- **Aplicável:** Sim
- **Status:** Parcialmente conforme
- **Severidade:** Baixo
- **Evidência:** `docker-entrypoint.sh:6-9` (agora `prisma migrate deploy`, não mais `db push --accept-data-loss`)
- **Problema:** A parte verificável no repositório foi corrigida (eliminado o risco de perda de dados por `--accept-data-loss`). A estratégia de deploy/rollback na VPS (blue-green, `docker-compose down/up`, snapshots antes de deploy) permanece **não verificável no repositório**.
- **Sugestão de correção:** verificar/implementar na VPS: backup/snapshot antes de cada deploy e procedimento de rollback documentado.

---

## Itens Não Verificáveis no Repositório

| Item | O que seria necessário verificar |
|------|----------------------------------|
| Backup do banco (4.6) | VPS/painel do provedor — `pg_dump`/WAL archiving/snapshot |
| Monitoramento/alertas (4.7) | Ferramentas na VPS e alertas ativos |
| Rollback/zero-downtime (4.8, parte) | Estratégia de deploy na VPS; snapshot antes de cada deploy |
| Efetividade do CSP via Nginx (1.1, parte) | Confirmar que o Nginx está sempre à frente da app (sem cenário de servição direta sem o proxy) e aplicar a whitelist de domínios (achado 1.1) |

---

## Validação das Correções Aplicadas (12/08) — SOLID, boas práticas e regras do prompt

Revisão linha a linha das correções implementadas, contra as regras anti-falso-positivo do prompt e princípios de engenharia (SOLID, YAGNI, defesa em profundidade, veracidade).

### Achados que exigem correção — **todos aplicados em 13/08**

- **V-1 (Alto) — CSP bloqueia GA4 + Impact (regressão funcional).** `script-src 'self'` sem `utt.impactcdn.com`/`googletagmanager.com`/`google-analytics.com` nas duas camadas (`nginx/nginx.conf:75`, `next.config.ts:14-27`). O loader inline da Impact roda (`'unsafe-inline'`), mas o `<script>` externo é bloqueado; o GA4 idem. Impacto direto na monetização (afiliados) e analytics. A regra anti-falso-positivo do prompt foi respeitada ao verificar as duas camadas de CSP, e isso revelou o problema. **Status: RESOLVIDO** — whitelist dos 3 domínios aplicada em `next.config.ts:21-22` e `nginx/nginx.conf:78`.
- **V-2 (Médio) — Placeholder de currículo no export é enganoso (dado do titular omitido).** `src/app/api/export/route.ts:115-117` substitui `resumeText`/`resumeMarkdown` por `'[texto do currículo — incluído no export completo]'`, mas o texto **não** está no arquivo. Compromete a portabilidade (Art. 18, V) para o dado central do serviço. **Status: RESOLVIDO** — o export agora inclui o perfil completo (`src/app/api/export/route.ts:112-114`), com teste de regressão em `api-export-lgpd.test.ts`.

### Correções validadas como corretas (SOLID / boas práticas)

- **V-8.1 — `toScriptJson` centralizado** (`src/lib/core/seo/jsonld.ts`): SRP + reuso; todas as 7 inserções migradas (verificado por grep). Refatoração mínima e segura; centraliza o fix de XSS (item 1.4). ✓
- **V-8.2 — `deleteAllUserData` (user-repository.ts:22-52):** transação atômica `$transaction([...])`; ordem verificada contra as FKs do schema (mensagens/usage/chats → cache → candidaturas/pipeline → jobs/empresas → tokens/feedback/cliques → perfil/sessões → user). `CourseClick` (SetNull) é coberto pelo delete explícito. A redundância com `onDelete: Cascade` é defensável (determinística, legível, não depende de configuração do banco). ✓
- **V-8.3 — `DELETE /api/auth/account`:** usa `requireAuth`, deleção em cascata e limpeza dos cookies de sessão via `cookies()` de `next/headers` em vez de `signOut` (server action do NextAuth v5 que não pode rodar em route handler) — bug conhecido corretamente evitado e documentado no código. Deleta ambos os nomes de cookie (`authjs.session-token` e `__Secure-authjs.session-token`) cobrindo dev e produção. ✓
- **V-8.4 — `/api/cron/cleanup`:** comparação de secret com `timingSafeEqual` precedida de verificação de comprimento (evita throw); retorna 503 (não 500/200) quando `CRON_SECRET` ausente — fail-safe adequado; rota `force-dynamic`. ✓
- **V-8.5 — Register anti-enumeração:** status 400 + `'Dados inválidos'` idêntico à mensagem de validação, com teste atualizado. Elimina o oráculo de emails. ✓
- **V-8.6 — Erro ATS genérico** com detalhe só no log do servidor; `docker-entrypoint.sh` com `migrate deploy` (migrations versionadas); HSTS nginx alinhado. ✓
- **V-8.7 — Termos:** seções 9/10/11 com estrutura correta (controlador, DPO, base legal por categoria, transferência internacional com minimização/SCCs), links para os botões de /perfil. Redação consistente com o restante do documento. ✓

### Achados menores (Baixo) — **todos aplicados em 13/08**

- **V-3 (Baixo) — duplicação do script Impact:** `cookie-consent.tsx:51-53` recriava o `<script id="impact-tracking">` se o consentimento fosse revogado e re-aceito. **Status: RESOLVIDO** — guard `if (document.getElementById('impact-tracking')) return;` em `cookie-consent.tsx:18`.
- **V-4 (Baixo) — comentários obsoletos:** `src/components/cursos/course-fallback-cta.tsx:5` e `src/lib/core/courses/course-catalog.ts:9` ainda citavam "o script da Impact em layout.tsx" (agora em cookie-consent). **Status: RESOLVIDO** — comentários atualizados.
- **V-5 (Baixo) — robustez do cleanup:** `retention-cleanup.ts:9` — `Number(env)` sem validação → `NaN` se o env estivesse malformado. **Status: RESOLVIDO** — `parseInactiveChatMonths()` com fallback para 12 (`retention-cleanup.ts:9-14`). `chat_usage` órfãos não são limpos (decisão: mantidos para controle de orçamento de consumo).
- **V-6 (Baixo) — rotas críticas novas sem testes:** **Status: RESOLVIDO** — adicionados `api-auth-account.test.ts`, `api-export-lgpd.test.ts` e `api-cron-cleanup.test.ts` (13 testes cobrindo 401, sucesso, erro genérico, headers de download, não-exposição do token da extensão e regressão V-2).

### Verificação executada (evidências)

- `vitest run api-auth-account.test.ts api-export-lgpd.test.ts api-cron-cleanup.test.ts api-auth-register.test.ts cookie-consent.test.tsx` → 24/24 passando.
- Suite completa: **650/650 testes passando** (2 arquivos de extensão falham por resolução de módulo do `next-auth` — **pré-existentes**, falham igualmente sem as mudanças; verificados via stash).
- `tsc --noEmit` → **zero erros em código-fonte** (erros restantes apenas em arquivos de teste pré-existentes: `middleware.test.ts`, `rate-limit-rejection.test.ts`, `ats-analysis-drawer.test.tsx`).

### Pendências que dependem de Renato (não são código)

1. Confirmar/criar o email de DPO `privacidade@unificando.com.br`.
3. Definir `CRON_SECRET` no `.env` e agendar `/api/cron/cleanup` no cron do VPS.
4. Itens não verificáveis no repo: backup (4.6), monitoramento (4.7), estratégia de deploy/rollback (4.8) e logs estruturados (4.5).

---

**Fim do relatório.**
