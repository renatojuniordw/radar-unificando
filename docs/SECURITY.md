# Segurança — Radar Unificando

> Práticas e configurações de segurança adotadas no projeto.

---

## 1. Docker

| Prática | Implementação |
|---------|--------------|
| Usuário não-root | `USER nextjs` no Dockerfile |
| Resource limits | Memory (512M máx) e CPU (1.0) no docker-compose |
| Healthcheck | Verifica `/api/health` a cada 30s |
| Sem privilégios extras | `security_opt: no-new-privileges:true` |
| Isolamento de rede | Rede `internal` segregada |
| Build limpo | `.dockerignore` exclui node_modules, .env, docs |

## 2. HTTP Headers

| Header | Valor | Efeito |
|--------|-------|--------|
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains` | Força HTTPS |
| `X-Content-Type-Options` | `nosniff` | Previne MIME sniffing |
| `X-Frame-Options` | `DENY` | Previne clickjacking |
| `X-XSS-Protection` | `1; mode=block` | Previne XSS |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Controla referrer |
| `Permissions-Policy` | Desabilita câmera/mic/geo | Restringe APIs do browser |

## 3. Autenticação

- **Auth.js v5** com `CredentialsProvider`
- JWT assinado com `AUTH_SECRET` (mínimo 64 caracteres)
- Senhas hashadas com **bcrypt** (cost=12)
- Rate limit de login: 5 tentativas/min por IP

## 4. Rate Limiting

| Operação | Janela | Limite | Chave |
|----------|--------|--------|-------|
| Pipeline | 5 min | 1 req | `user_id` |
| Login | 1 min | 5 tentativas | IP |
| API geral | 1 min | 60 req | IP |
| Upload currículo | 1 hora | 10 req | `user_id` |
| Export CSV | 1 min | 10 req | `user_id` |

## 5. Variáveis de Ambiente

- `.env` no `.gitignore` — nunca versionado
- Validação na inicialização via `validateEnv()`
- `AUTH_SECRET` obrigatório e validado
- `DATABASE_URL` obrigatório

## 6. Injeção

- SQL: **Drizzle ORM** com queries parametrizadas
- XSS: Security headers + MUI escapa output
- Input: Server Actions validam dados na entrada

## 7. Dependências

- `npm ci --frozen-lockfile` no Docker (versões fixas)
- `--no-audit --no-fund` para não expor dados do registry
- `npm audit` verificado em CI

## 8. Práticas Futuras (v2)

- [ ] Helmet middleware para headers adicionais
- [ ] CSRF token em mutations (Auth.js já protege)
- [ ] Row-Level Security no PostgreSQL (multi-tenancy)
- [ ] Criptografia de dados sensíveis em repouso
- [ ] Auditoria de acesso (log de quem acessou o quê)
