# UX Flow — Radar Unificando v2

## Fluxo Principal (Tela Única)

```
/  (página única — radar)
├── 1. INPUT → textarea de empresas + toggle discovery
├── 2. EXECUTAR → botão principal
├── 3. PROGRESSO → accordion collapsável com log SSE
└── 4. RESULTADO → tabela com filtros + export CSV
```

## Estados da Tabela

| Estado | Exibição |
|--------|----------|
| Nunca buscou | "Cole empresas e clique em EXECUTAR BUSCA" |
| Buscando | Accordion expandido com log + progresso |
| Vazia (sem match) | "Nenhuma vaga encontrada para os critérios" |
| Resultados | Tabela com dados, paginação, filtros |
| Erro | Alert + "TENTAR NOVAMENTE" |

## Feedback Matrix

| Operação | Loading | Success | Empty | Error |
|----------|---------|---------|-------|-------|
| Buscar vagas | Barra + log | Tabela + contagem | Alert ilustrado | Alert + retry |
| Salvar perfil | Btn desabilitado | Snackbar | — | Snackbar |
| Login | Btn spinner | Redirect | — | Alert inline |
| Register | Btn spinner | Snackbar + redirect | — | Alert inline |
| Mover Kanban | Opacity | Otimista | — | Reverte + Snackbar |
| Export CSV | Btn desabilitado | Download | — | Snackbar |
