# Roadmap — Radar Unificando

## v1 (Manutenção)
- Scraper local + SQLite
- Brutalist UI
- Docker single service

## v2 (branch `v2/redesign` — em desenvolvimento)
- ✅ PostgreSQL + Prisma ORM
- ✅ Auth.js v5 (credentials + JWT)
- ✅ MUI 7 (tema claro fixo; visual dark via estilos brutalistas — sem toggle)
- ✅ Gupy MCP + REST fallback
- ✅ Páginas: home unificada, perfil, login/register, termos
- ✅ Chat assistente IA (MUI + `@ai-sdk/react`, com PII redaction e proteção anti prompt injection)
- ✅ Upload PDF + extração IA (skills, cargo, área, senioridade, formação)
- ✅ Análise de fit perfil × vaga (via chat) + recomendação por perfil (ranked jobs)
- ✅ Export CSV/JSON
- ✅ Design system Neo-Brutalism
- ✅ Documentação (docs/)
- ✅ Segurança: rate limiting (Redis + in-memory), prompt injection protection, env validation
- ✅ Persistência anônima em IndexedDB (com auto-sync de 15 min)
- ✅ Suíte Vitest (45 arquivos · 232 testes) — 30 falhas pré-existentes em arquivos com trabalho não commitado
- ⏳ E2E Playwright (spec desatualizado — referência textos antigos da UI)
- ⏳ Corrigir falhas pré-existentes dos testes
- ⏳ Performance audit
- ⏳ Acessibilidade audit

## v3 (Futuro)
- Notificações em tempo real
- Integração com LinkedIn API
- Pipeline Discovery avançado (mais fontes)
- App mobile (React Native)
- Modo offline (PWA)
