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
