# Segurança — Radar Unificando v2

## Medidas Implementadas

| Medida | Implementação |
|--------|---------------|
| Security Headers | `next.config.ts` (HSTS, X-Frame-Options, etc.) |
| CORS | `middleware.ts` (Access-Control headers) |
| Rate Limiting | `src/lib/infrastructure/security/rate-limiter.ts` |
| Env Validation | `src/lib/infrastructure/security/env.ts` |
| Auth | Auth.js v5 com JWT + bcrypt (cost=12) |
| Docker | `no-new-privileges`, resource limits, non-root user |
| SQL Injection | Prevenido pelo Prisma ORM (queries parametrizadas) |

## Rate Limits por Operação

| Operação | Janela | Limite | Chave |
|----------|--------|--------|-------|
| Pipeline | 5 min | 1 | user_id |
| Login | 1 min | 5 | IP |
| API geral | 1 min | 60 | IP |
| Upload currículo | 1 hora | 10 | user_id |
| Export CSV | 1 min | 10 | user_id |

## Variáveis de Ambiente Obrigatórias

```
DATABASE_URL=postgresql://...
AUTH_SECRET=<openssl rand -base64 64>
```
