# Design System — Radar Unificando v2

## Identidade Visual

- **Acento:** Amarelo neon `#ccff00`
- **Primário:** Preto `#020617`

## MUI Theme

Configurado em `src/lib/infrastructure/ui/theme.ts`:

| Token | Valor |
|-------|-------|
| primary | `#020617` |
| secondary | `#64748b` |
| warning | `#ccff00` |
| success | `#16a34a` |
| error | `#dc2626` |
| fontFamily | Inter, sans-serif |

## Dark Mode

Gerenciado via `ThemeProvider` com `colorScheme` toggle.
Preferência salva em `localStorage`, respeita `prefers-color-scheme` na primeira visita.

## Componentes MUI por Bloco

| Bloco | Componentes |
|-------|-------------|
| Header | AppBar, Toolbar, Button, IconButton |
| Input | TextField (multiline), Button, FormControlLabel |
| Progresso | Accordion, LinearProgress |
| Resultados | Table, TableHead, TableRow, TableCell, Chip |
| Filtros | Select, MenuItem, TextField |
| Cards | Card, CardContent |
| Score | CircularProgress (determinate) |
| Modais | Dialog, DialogTitle, DialogContent, DialogActions |
| Kanban | Paper, Box + dnd-kit |
| Alertas | Alert, AlertTitle |
| Loading | Skeleton, LinearProgress |

## Chat Assistente (`chat-assistant-ui.tsx`)

Drawer lateral direito com FAB. Regras aplicadas:

| Regra | Valor |
|-------|-------|
| Largura drawer | `{ xs: '100%', sm: 400 }` (full em mobile) |
| Touch targets | IconButtons ≥ 44×44px |
| Sombras | Derivadas de `rgba(2, 6, 23, …)` (primary), nunca azul `#2563eb` |
| Espaçamento mensagens | `mb: 2` entre bolhas |
| Input | `TextareaAutosize` (auto-grow, máx. 6 linhas, Shift+Enter = quebra) |
| Ações header | "+ Nova Conversa" (confirma via `ConfirmDialog`), "Fechar" |
| Limpar chat | Limpa estado + localStorage + servidor, **sem reload de página** |
| Empty state | Chips de sugestão clicáveis que preenchem o input |

### Emojis

| Tipo | Emojis | Exemplos |
|------|--------|----------|
| Funcionais (manter) | 🏢 📍 🔗 📊 📋 | Empresa, local, link, dados, lista |
| Decorativos (remover) | 🟢 🟡 🔴 ✅ ❌ 💡 ⚡ 🔥 🏠 ⚠️ | Status, ideias, alertas |

Regra no prompt do LLM: usar apenas emojis funcionais; cada vaga enviada como mensagem separada com linha em branco entre elas.
