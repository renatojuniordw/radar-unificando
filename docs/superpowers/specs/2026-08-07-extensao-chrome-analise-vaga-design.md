# Extensão Chrome: leitura de vaga + dicas de currículo (ATS)

## Contexto

O Radar Unificando já tem toda a lógica de análise de currículo × vaga pronta
(`/api/ats/analyze`, `analyzeAtsWithCache`, heurísticas + LLM) — hoje só acessível
dentro do próprio site, exigindo que o usuário cole a descrição da vaga manualmente.
A ideia é levar essa análise para onde o usuário já está: a página da vaga em
qualquer site (LinkedIn, Gupy, InHire, portais de empresa, etc.), via uma extensão
de Chrome que lê o texto da vaga aberta e mostra dicas de ajuste do currículo sem
sair da página.

## Decisões de design (confirmadas com o usuário)

1. **Sites suportados:** extração genérica (qualquer site), não só Gupy/InHire.
2. **Autenticação:** fluxo "Conectar extensão" — não reaproveita cookie de sessão
   diretamente (descoberto durante exploração: o cookie do NextAuth usa
   `SameSite=Lax` por padrão, então não é enviado em fetch cross-origin da
   extensão sem enfraquecer a postura de segurança do site inteiro). Em vez
   disso, o usuário logado no site gera um token de extensão dedicado.
3. **Escopo do resultado:** reaproveitar a análise ATS existente (score, skills
   batendo/faltando, dicas) — sem carta de apresentação nem outras ações extras
   nesta primeira versão.
4. **UI:** painel flutuante injetado na página (content script), não popup da
   toolbar.
5. **Trigger:** manual, ao clicar no ícone da extensão — sem detecção automática
   de "isso é uma vaga" (evita falso positivo/negativo da extração genérica).

## Arquitetura proposta

### Backend (radar-unificando)

- **Novo modelo Prisma `ExtensionToken`**: `id`, `userId` (FK `User`), hash do
  token (nunca texto puro), `createdAt`, `lastUsedAt`, `revokedAt` nullable.
  Segue o padrão de `Session` já existente em `prisma/schema.prisma`.
- **Nova página autenticada `/extensao/conectar`**: botão "Conectar extensão".
  Ao clicar, o backend gera o token, grava o hash no banco, e entrega o token
  em texto puro uma única vez para a extensão salvar (padrão comum de connect
  flow — ex: via `chrome.identity.launchWebAuthFlow` ou redirect para uma URL
  que a extensão intercepta).
- **Novo endpoint `POST /api/extension/analyze`**: aceita
  `Authorization: Bearer <token>`, resolve `userId` a partir do hash do token
  (rejeita se revogado/expirado), busca o `resumeText`/`resumeMarkdown` via
  `profileRepository` (mesmo padrão de `src/app/api/ats/analyze/route.ts`),
  chama `analyzeAtsWithCache(userId, resumeText, { jobDescription })` e
  devolve o resultado. Reaproveita `src/lib/rate-limit.ts` para limitar abuso.
- **CORS (`src/middleware.ts`)**: adicionar a origem fixa
  `chrome-extension://<ID da extensão>` à allowlist explícita já existente
  (o arquivo já documenta a intenção de nunca refletir origem arbitrária —
  manter esse princípio, só adicionar essa origem específica).

### Extensão (novo projeto, Manifest V3)

- **`action`** (ícone da toolbar) como único trigger — sem `content_scripts`
  rodando automaticamente em toda página.
- Ao clicar: injeta um content script sob demanda que extrai o texto principal
  da página (heurística genérica: maior bloco de texto visível / fallback
  `document.body.innerText`), truncado a ~8000 chars (mesmo limite do backend
  atual em `MAX_JOB_DESCRIPTION`).
- Envia `POST /api/extension/analyze` com o token salvo em
  `chrome.storage.local`.
- Renderiza um painel flutuante isolado via Shadow DOM (evita conflito de CSS
  com a página hospedeira) mostrando score, skills batendo/faltando e dicas —
  mesmos campos que `AtsAnalysis`/`AtsHeuristic` já retornam.
- Se não houver token salvo: painel mostra estado "conecte sua conta" com link
  para `/extensao/conectar`.

## Tratamento de erros

- **Sem currículo importado:** endpoint devolve o mesmo erro 400 já existente
  em `/api/ats/analyze` ("Nenhum currículo encontrado..."); painel exibe essa
  mensagem com link para importar currículo no site.
- **Token ausente/expirado/revogado:** endpoint devolve 401; painel mostra
  estado "conecte sua conta".
- **Página sem texto extraível suficiente:** extensão não chama a API; painel
  mostra aviso "não foi possível identificar o texto da vaga nesta página".
- **Rate limit excedido:** endpoint devolve 429 (mesmo padrão de
  `src/lib/rate-limit.ts`); painel mostra mensagem de "tente novamente em
  instantes".

## Fora de escopo (MVP)

- Extração especializada por site (Gupy/InHire com seletores dedicados).
- Detecção automática de página de vaga.
- Geração de carta de apresentação, salvar vaga, ou outras ações do chat via
  extensão.
- Múltiplas contas conectadas simultaneamente na mesma instalação da extensão.
- Publicação na Chrome Web Store (fica como passo manual/futuro do usuário).

## Testes

- Unitário: geração/validação de token (`ExtensionToken`), endpoint
  `/api/extension/analyze` (sucesso, sem currículo, token inválido, rate
  limit) — seguindo os padrões já usados em `src/__tests__/api-profile.test.ts`.
- Extensão: extração de texto testada isoladamente (função pura, dado um HTML
  de exemplo, retorna o texto esperado).
- E2E manual: fluxo completo descrito na seção de verificação abaixo.

## Verificação end-to-end

- Gerar token em `/extensao/conectar` logado, confirmar registro em
  `ExtensionToken` no banco (`npm run db:studio`).
- Chamar `POST /api/extension/analyze` com o Bearer token via `curl`/Postman
  simulando o payload da extensão, confirmar resposta igual à de
  `/api/ats/analyze`.
- Carregar a extensão via `chrome://extensions` (modo desenvolvedor, "carregar
  sem compactação"), abrir uma vaga em qualquer site, clicar no ícone, e
  confirmar que o painel aparece com os dados corretos.
- Testar o caminho sem token salvo (estado "conecte sua conta") e o caminho
  sem currículo importado (mensagem de erro já existente no backend).
