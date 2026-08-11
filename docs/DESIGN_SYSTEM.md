# Design System — Radar Unificando v2

## Identidade Visual

- **Acento:** Amarelo neon `#ccff00`
- **Primário:** Preto `#020617`
- **Estilo:** Neo-Brutalism + Premium SaaS

## Tokens (Design.md + globals.css)

### Cores

| Token | Valor | Uso |
|-------|-------|-----|
| primary | `#020617` | Backgrounds escuros, borders |
| secondary | `#64748b` | Texto secundário |
| neon-yellow | `#ccff00` | Acentos, badges, botões |
| slate-900 | `#0f172a` | Superfícies escuras |
| slate-800 | `#1e293b` | Cards escuros |
| slate-50 | `#f8fafc` | Backgrounds claros |
| white | `#ffffff` | Texto em fundo escuro |
| danger | `#ff4d4d` | Erros |
| success | `#00ff66` | Sucesso |

### Sombras

| Token | Valor |
|-------|-------|
| hard-lg | `8px 8px 0px #000` |
| hard-md | `4px 4px 0px #000` |
| hard-sm | `2px 2px 0px #000` |
| hard-neon | `8px 8px 0px #ccff00` |
| hard-neon-sm | `4px 4px 0px #ccff00` |

### Border Radius

Sem border-radius (Neo-Brutalism: `rounded: none`).

## CSS Classes (globals.css)

| Classe | Uso |
|--------|-----|
| `card-brutalist` | Cards brancos com border 4px + shadow 8px |
| `btn-neon` | Botão amarelo com border 4px + shadow 8px |
| `badge-neon` | Badge amarelo com border 2px + shadow 3px |
| `badge-dark` | Badge escuro com border 2px |
| `faq-item` | Itens FAQ com border 4px + shadow 4px |
| `section-hero` | Background escuro + border amarelo |
| `section-white` | Background branco + border preto |
| `section-faq` | Background cinza claro + border preto |

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

**Não há toggle de tema.** O `ThemeProvider` usa `mode: 'light'` fixo
(`src/lib/infrastructure/ui/theme.ts`). O visual escuro da home vem de estilos
inline brutalistas (backgrounds `#020617`/`#0f172a`), não de um tema dark configurável.

## Componentes MUI por Bloco

| Bloco | Componentes |
|-------|-------------|
| Header | AppBar, Toolbar, Button, IconButton |
| Input | TextField (multiline), Button, TextareaAutosize |
| Progresso | LinearProgress |
| Resultados | Table, TableHead, TableRow, TableCell, Chip |
| Filtros | Select, MenuItem, TextField |
| Cards | Card, CardContent |
| Modais | Dialog, DialogTitle, DialogContent, DialogActions |
| Alertas | Alert, AlertTitle |
| Loading | Skeleton, LinearProgress, CircularProgress |

## Chat Assistente (`chat-ui.tsx`)

Drawer lateral direito com FAB. Regras aplicadas:

| Regra | Valor |
|-------|-------|
| Largura drawer | `{ xs: '100%', sm: 400 }` (full em mobile) |
| Touch targets | IconButtons ≥ 44×44px |
| Sombras | Derivadas de `rgba(2, 6, 23, …)` (primary), nunca azul |
| Espaçamento mensagens | `mb: 2` entre bolhas |
| Input | `TextareaAutosize` (auto-grow, máx. 6 linhas, Shift+Enter = quebra) |
| Ações header | "+ Nova Conversa" (confirma via `ConfirmDialog`), "Fechar" |
| Limpar chat | Limpa estado + IndexedDB + servidor, **sem reload** |
| Empty state | Chips de sugestão clicáveis que preenchem o input |

## Página de Conexão da Extensão (`/extensao/conectar`)

Brutalist escuro (mesma paleta do hero da home):

| Elemento | Aplicação |
|----------|-----------|
| Fundo | `#020617` com animação `hero-radar` (efeito radar cônico em loop) |
| Card token | `TokenBox` — borda grossa, sombra dura, labels mono maiúsculas |
| Ações | Copiar (ícone + atalho teclado `C` + beep Web Audio), mostrar/ocultar token |
| Status | Dot verde "Extensão conectada" via polling `/api/extensao/status` (4s) |
| Passos | 3 cards de onboarding (instalar, copiar token, colar na extensão) com ícones lucide |

## Referência

Design tokens completos: `DESIGN.md` (arquivo raiz)
