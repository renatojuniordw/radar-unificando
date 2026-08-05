# Plano: Canal de Doações para o Radar Unificando (open source sustentável)

> **Para o Hermes:** implementar task a task com subagent-driven-development, com revisão de spec e de qualidade após cada task.

**Goal:** Tornar o Radar Unificando sustentável como open source, com canal de doações de baixo custo de manutenção, sem construir gateway de pagamento próprio.

**Architecture:** Modelo centrado no usuário do app: **PIX** como canal primário (brasileiro, zero taxa, instantâneo, sem cadastro externo) — quem usa o app doa via página `/doar` acessível do footer. **GitHub Sponsors e Ko-fi são opcionais e adiáveis** (YAGNI): servem para a comunidade dev/contribuidores, não para usuários do app, e não bloqueiam nada. Transparência de custos (VPS + LLM) como mecanismo de confiança. Nenhuma rota de pagamento no backend (doação não precisa de checkout próprio). Superfícies: repositório (FUNDING.yml apontando para `/doar`), app (footer + página `/doar` + seção no `/sobre`).

**Tech Stack:** Nenhuma dependência nova no projeto. `npx qrcode` (one-shot, sem adicionar ao package.json) para gerar o QR. Página em Next.js 15 App Router + MUI + lucide-react, seguindo o design system Neo-Brutalist existente (#020617 / #ccff00 / bordas 2px / boxShadow offset). Testes com Vitest + Testing Library (padrão jsdom + nomes snake_case já usados em `src/__tests__/chat-sidebar.test.tsx`).

---

## Contexto atual (verificado no repo)

- Licença: **MIT** (© 2024 Renato Bezerra). Mantida — doações não exigem troca de licença.
- Sem `.github/` — o botão "Sponsor" do GitHub não aparece no repo até existir `.github/FUNDING.yml` (ou perfil com Sponsors habilitado).
- README declara "**100% gratuito — sem taxas**" — precisa de wording honesto ("grátis para usuários, mantido por doações").
- Footer (`src/components/layout/footer.tsx`): nav com SOBRE e TERMOS; CTA "CONSULTORIA EM IA". Sem link de apoio.
- `/sobre` existe (`src/app/sobre/page.tsx`, ~391 linhas, MUI + estilo neo-brutalist). Sem seção de apoio.
- Sem teste de footer nem de `/sobre` hoje. Padrão de teste de componente: `// @vitest-environment jsdom` + `render/screen` + `@/` alias.
- Infra com custo real: VPS Docker + nginx (`radar.unificando.com.br`), LLM via router Verboo (deepseek-v4-flash, custo por token do chat), Redis + PostgreSQL.
- **GitHub Sponsors suporta Brasil** (docs.github.com → "Supported regions": Brazil) — payout para conta bancária BR.
- Sem dependência Stripe no projeto; não adicionar (YAGNI).

## Decisões de arquitetura (por que assim)

| Canal | Público | Taxa | Esforço | Papel |
|---|---|---|---|---|
| **PIX (QR + copia-e-cola)** | Usuários do app (BR) | 0% | Baixo (asset estático) | **Primário** — quem usa o app doa aqui |
| **GitHub Sponsors** | Devs/contribuidores | **0% em conta pessoal** (100% para o dev) | Baixo (FUNDING.yml) | **Opcional/adiável** — só se quiser canal para comunidade dev |
| **Ko-fi** | Internacional | 0% em doações (processamento Stripe/PayPal) | Baixo (link) | Opcional/adiável |
| **Stripe Payment Link** | Internacional | ~2,9%+ | Médio | Fase 2, só se houver demanda real |

- **Canal obrigatório: apenas PIX.** O modelo é "quem usa o app doa" — PIX cobre isso com zero fricção e zero taxa. GitHub Sponsors/Ko-fi entram depois, só se fizer sentido (repo aberto com contribuidores ou demanda internacional).
- **Não criar rota `/api/donation` nem webhook** — doação avulsa não precisa de contabilidade no app.
- **Não adicionar botão no header** — header já tem muitos botões (feedback prévio do Renato: "tuia de botão"). Footer + `/doar` + `/sobre` + README bastam.
- **Privacidade LGPD-friendly**: QR/chave PIX estático não rastreia o doador; chave PIX aleatória não expõe CPF/CNPJ.
- **Transparência de custos** (COSTS.md + seção no `/doar`) é o que converte: mostra que o projeto tem custo real e o que a doação cobre.

---

## FASE 0 — Canais (manual, sem código)

### Task 1: Criar chave PIX e obter o código "copia e cola"
1. No app do banco, gerar **chave PIX aleatória** (evita expor CPF/CNPJ; se tiver MEI/CNPJ, considerar usar o CNPJ para transmitir profissionalismo).
2. Gerar o **brcode EMV** ("copia e cola") da chave — o próprio app do banco oferece.
3. Guardar o brcode num local privado (ex: notes) — ele será usado na Task 7.
- **Resultado:** chave + brcode prontos.

### Task 2 (OPCIONAL — adiável): Criar conta GitHub Sponsors
> Só faça se quiser canal para a comunidade dev/contribuidores. Não bloqueia nada e **não tem custo** (conta pessoal: 0% de taxa, 100% do valor para o dev — confirmado em docs.github.com). O caminho crítico é apenas PIX.

1. Acessar `https://github.com/sponsors` (conta pessoal `renatobezerra`).
2. Vincular conta bancária BR e dados fiscais (GitHub Sponsors suporta Brasil).
3. Configurar tiers mensais sugeridos (ex: R$ 10 / R$ 25 / R$ 50 — em USD na plataforma).
- **Resultado:** perfil de Sponsors ativo; badge `github.com/sponsors/renatobezerra`.

### Task 3 (OPCIONAL — adiável): Criar conta Ko-fi
> Só se houver demanda internacional real. Sem isso, PIX + o link do repo para `/doar` já cobrem o essencial.

1. Criar em `https://ko-fi.com` (username `renatobezerra`), conectar Stripe/PayPal para payout BR.
2. Anotar a URL pública.
- **Resultado:** URL `https://ko-fi.com/renatobezerra` (ou pular — recomendado pular por enquanto).

---

## FASE 1 — Repositório

### Task 4: Criar `.github/FUNDING.yml`

**Files:** Create: `.github/FUNDING.yml`

**Step 1:** Criar o arquivo — aponta o botão "Sponsor" do repo direto para a página `/doar` do app (onde está o PIX). Sem GitHub Sponsors habilitado, o `github:` deve ficar comentado/ausente:

```yaml
# Arquivo de financiamento — ativa o botão "Sponsor" no repo.
# Ver: https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-funding-files
# github: [renatobezerra]   # descomente quando habilitar GitHub Sponsors (Task 2, opcional)
# ko_fi: renatobezerra      # descomente quando criar Ko-fi (Task 3, opcional)
custom:
  - "https://radar.unificando.com.br/doar"
```

**Step 2:** Verificação: `git status` mostra o arquivo; abrir no GitHub após push mostra o botão "Sponsor" no canto direito do repo (levando para `/doar`).

**Step 3:** Commit:
```bash
git add .github/FUNDING.yml
git commit -m "feat: adicionar arquivo de financiamento (FUNDING.yml)"
```

### Task 5: README — seção "Apoie" + badges + ajustar claim gratuito

**Files:** Modify: `README.md`

**Step 1:** Adicionar após a linha `Licença: MIT` (bloco do header) — badge do PIX é o principal; badges de Sponsors/Ko-fi só se as Tasks 2/3 forem feitas:

```markdown
Licença: MIT
Apoie: [![Doar-PIX](https://img.shields.io/badge/Doar-PIX-ccff00)](https://radar.unificando.com.br/doar) [![Sponsor](https://img.shields.io/github/sponsors/renatobezerra?label=Sponsor&color=ccff00)](https://github.com/sponsors/renatobezerra)
```

> O badge `github/sponsors` (dinâmico) só renderiza valor se o perfil de Sponsors existir — se pular a Task 2, deixar só o badge PIX.

**Step 2:** Substituir a linha 18 (`- **100% gratuito** — sem taxas (com rate limits anti-abuso)`) por:

```markdown
- **100% gratuito para usuários** — mantido por doações (rate limits anti-abuso)
```

**Step 3:** Adicionar seção antes de `## Como Rodar` — o texto assume o modelo "quem usa doa", sem citar Sponsors como obrigatório:

```markdown
## Apoie o projeto

O Radar Unificando é gratuito e open source, mas tem custos reais de infraestrutura
(VPS, banco, Redis e tokens de IA no chat). Se a ferramenta te ajudou, considere doar:

- **PIX** (Brasil, sem taxa): QR e chave em [radar.unificando.com.br/doar](https://radar.unificando.com.br/doar)
- **GitHub Sponsors** (recorrente, para a comunidade dev): [github.com/sponsors/renatobezerra](https://github.com/sponsors/renatobezerra) *(se habilitado)*

Custos mensais transparentes: veja [`COSTS.md`](./COSTS.md).
```

**Step 4:** Verificação: `npm run lint` continua passando (README não afeta lint). Revisão visual do markdown.

**Step 5:** Commit:
```bash
git add README.md
git commit -m "docs: adicionar seção de doações e ajustar claim de gratuidade no README"
```

### Task 6: Criar `COSTS.md` (transparência de custos)

**Files:** Create: `COSTS.md`

**Step 1:** Criar com o template (preencher valores reais com o Renato):

```markdown
# Custos do Radar Unificando

Transparência: este projeto é gratuito para usuários, mas roda com custos reais.
As doações cobrem (ou ao menos reduzem) a conta abaixo.

> Atualizado em: MÊS/ANO — valores aproximados mensais em BRL.

| Item | Custo mensal (R$) | Detalhe |
|---|---|---|
| VPS (Docker + nginx) | ~~—~~ | ex: R$ 45/mês |
| Domínio `unificando.com.br` | ~~—~~ | ex: R$ 60/ano (R$ 5/mês) |
| Tokens de IA (chat, router Verboo) | ~~—~~ | varia com uso |
| PostgreSQL + Redis (na VPS) | incluído na VPS | — |
| **Total estimado** | **~~—~~** | |

## O que a doação cobre

- Manutenção do servidor e deploys
- Custo dos tokens de IA no chat (item mais volátil)
- Novas fontes de vagas e melhorias (roadmap em `docs/ROADMAP.md`)

## Como doar

- PIX: https://radar.unificando.com.br/doar
- GitHub Sponsors: https://github.com/sponsors/renatobezerra
```

**Step 2:** Commit:
```bash
git add COSTS.md
git commit -m "docs: adicionar transparência de custos (COSTS.md)"
```

### Task 7: Gerar `public/pix-qr.png` (QR estático)

**Files:** Create: `public/pix-qr.png`

**Step 1:** Gerar o QR a partir do brcode EMV (Task 1), **sem adicionar dependência ao package.json** (npx one-shot):

```bash
cd /Users/renatobezerra/Repositorios/radar-unificando
npx --yes qrcode -o public/pix-qr.png -w 512 -m 2 "00020126XXXXXXXX...brcode completo copiado do banco..."
```

**Step 2:** Verificação: abrir `public/pix-qr.png` e escanear com o app do banco — deve abrir o pagamento com o valor/chave corretos.

**Step 3:** Anotar a chave PIX (para exibir como texto copiável na página `/doar` — Task 11) e a URL do QR (ex: `/pix-qr.png`).

**Step 4:** Commit:
```bash
git add public/pix-qr.png
git commit -m "feat: adicionar QR code PIX para doações"
```

---

## FASE 2 — App (TDD)

### Task 8: Escrever teste do Footer (vermelho)

**Files:** Create: `src/__tests__/footer.test.tsx`

**Step 1:** Criar o teste (padrão do projeto: jsdom, snake_case, `@/` alias):

```tsx
// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Footer } from '@/components/layout/footer';

describe('Footer', () => {
  it('should_render_donation_link_to_doar_page', () => {
    render(<Footer />);
    const link = screen.getByRole('link', { name: /apoiar/i });
    expect(link.getAttribute('href')).toBe('/doar');
  });

  it('should_render_sobre_and_termos_links', () => {
    render(<Footer />);
    expect(screen.getByRole('link', { name: /sobre/i }).getAttribute('href')).toBe('/sobre');
    expect(screen.getByRole('link', { name: /termos/i }).getAttribute('href')).toBe('/termos');
  });
});
```

**Step 2:** Rodar e confirmar falha:

```bash
npx vitest run src/__tests__/footer.test.tsx
```

Expected: FAIL — `Unable to find role="link" with name /apoiar/i`.

### Task 9: Implementar link "APOIAR" no Footer (verde)

**Files:** Modify: `src/components/layout/footer.tsx` (nav, após o `<li>` de SOBRE, ~linha 143)

**Step 1:** Inserir no `<ul>` do nav, antes do `<li>` de SOBRE, um `<li>` com link para `/doar` (destacado em #ccff00 como o TERMOS):

```tsx
<li>
  <a
    href="/doar"
    style={{ color: '#ccff00', fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', textDecoration: 'none', fontFamily: 'ui-monospace, monospace' }}
  >
    APOIAR
  </a>
</li>
```

**Step 2:** Rodar o teste — Expected: PASS (2 passed).

**Step 3:** Rodar a suíte completa: `npm run test` — Expected: todos passando.

**Step 4:** Commit:
```bash
git add src/components/layout/footer.tsx src/__tests__/footer.test.tsx
git commit -m "feat: adicionar link de apoio no footer"
```

### Task 10: Escrever teste da página `/doar` (vermelho)

**Files:** Create: `src/__tests__/doar-page.test.tsx`

**Step 1:** Criar o teste (cobre: título, links externos, chave PIX visível e botão de copiar):

```tsx
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DoarPage from '@/app/doar/page';

describe('DoarPage', () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  it('should_render_heading_and_pix_section', () => {
    render(<DoarPage />);
    expect(screen.getByRole('heading', { name: /apoie/i })).toBeTruthy();
    expect(screen.getByText(/pix/i)).toBeTruthy();
  });

  it('should_render_pix_key_and_copy_button', () => {
    render(<DoarPage />);
    expect(screen.getByText(/chave pix/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /copiar/i })).toBeTruthy();
  });

  it('should_copy_pix_key_when_clicked', async () => {
    render(<DoarPage />);
    fireEvent.click(screen.getByRole('button', { name: /copiar/i }));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      expect.stringContaining('000201') // brcode EMV
    );
  });

  it('should_render_sponsor_and_kofi_links', () => {
    render(<DoarPage />);
    expect(screen.getByRole('link', { name: /github sponsors/i }).getAttribute('href')).toContain('github.com/sponsors');
    expect(screen.getByRole('link', { name: /ko-fi/i }).getAttribute('href')).toContain('ko-fi.com');
  });
});
```

> Se a página for server component com o brcode vindo de uma constante exportada, o teste importa a constante em vez de `expect.stringContaining('000201')`. Ajustar conforme a implementação (Task 11).

**Step 2:** Rodar — Expected: FAIL (`Cannot find module '@/app/doar/page'`).

### Task 11: Implementar `src/app/doar/page.tsx` (verde)

**Files:** Create: `src/app/doar/page.tsx`

**Step 1:** Criar a página (client component para o botão de copiar; segue o estilo do `/sobre`: fundo #020617, badge #ccff00, bordas e sombras offset, MUI + lucide):

```tsx
'use client';

import { useState } from 'react';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { Heart, Copy, Check, Coffee, Github, QrCode } from 'lucide-react';

// TODO(Task 1/7): preencher com o brcode EMV real e a chave PIX
const PIX_BRCODE =
  '00020126XXXXXXXX...'; // "copia e cola" gerado no app do banco
const PIX_KEY = 'chave-pix-aleatoria@exemplo.com'; // chave real (aleatória)
const GITHUB_SPONSORS_URL = 'https://github.com/sponsors/renatobezerra';
const KOFI_URL = 'https://ko-fi.com/renatobezerra';

export default function DoarPage() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(PIX_BRCODE);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Box sx={{ bgcolor: '#020617', color: '#ffffff', minHeight: '100vh', py: { xs: 6, md: 10 } }}>
      <Container maxWidth="md">
        <Box sx={{ textAlign: 'center', mb: { xs: 6, md: 8 } }}>
          <Box
            sx={{
              display: 'inline-flex', alignItems: 'center', gap: 1,
              bgcolor: '#ccff00', color: '#020617', px: 2, py: 0.75,
              fontWeight: 900, fontSize: '0.75rem', letterSpacing: '0.1em',
              textTransform: 'uppercase', border: '2px solid #020617',
              boxShadow: '4px 4px 0px #ffffff', mb: 3,
            }}
          >
            <Heart size={14} />
            APOIE O RADAR UNIFICANDO
          </Box>
          <Typography variant="h1" sx={{ fontWeight: 900, fontSize: { xs: '2rem', sm: '3rem' }, letterSpacing: '-0.03em', textTransform: 'uppercase', mb: 2, color: '#ffffff' }}>
            MANTENHA A BUSCA <br /> DE VAGAS NO AR
          </Typography>
          <Typography variant="body1" sx={{ color: '#94a3b8', maxWidth: 560, mx: 'auto' }}>
            O Radar é gratuito e open source, mas tem custos reais: VPS, banco e
            tokens de IA no chat. Qualquer valor ajuda a manter tudo no ar.
          </Typography>
        </Box>

        {/* PIX */}
        <Box sx={{ border: '2px solid #ccff00', boxShadow: '6px 6px 0px #ccff00', bgcolor: '#0f172a', p: { xs: 3, md: 4 }, mb: 4, textAlign: 'center' }}>
          <Typography variant="h2" sx={{ fontWeight: 900, fontSize: '1.25rem', textTransform: 'uppercase', mb: 2, color: '#ccff00' }}>
            <QrCode size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} />
            PIX (Brasil — sem taxa)
          </Typography>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/pix-qr.png" alt="QR code PIX para doação" width={220} height={220} style={{ imageRendering: 'pixelated', border: '2px solid #020617', boxShadow: '4px 4px 0px #ffffff' }} />
          <Typography variant="body2" sx={{ color: '#94a3b8', mt: 2 }}>
            Chave PIX: <strong style={{ color: '#ffffff' }}>{PIX_KEY}</strong>
          </Typography>
          <Button
            variant="contained"
            onClick={handleCopy}
            startIcon={copied ? <Check size={16} /> : <Copy size={16} />}
            sx={{
              mt: 2, bgcolor: copied ? '#16a34a' : '#ccff00', color: '#020617',
              fontWeight: 900, textTransform: 'uppercase', fontSize: '0.75rem',
              '&:hover': { bgcolor: copied ? '#15803d' : '#b8e600' },
            }}
          >
            {copied ? 'Código copiado!' : 'Copiar código PIX'}
          </Button>
        </Box>

        {/* Alternativas */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
          <Button
            component="a" href={GITHUB_SPONSORS_URL} target="_blank" rel="noopener noreferrer"
            variant="outlined" startIcon={<Github size={16} />}
            sx={{ border: '2px solid #ccff00', color: '#ccff00', fontWeight: 900, textTransform: 'uppercase', py: 2, '&:hover': { bgcolor: '#ccff00', color: '#020617', border: '2px solid #ccff00' } }}
          >
            GitHub Sponsors (mensal)
          </Button>
          <Button
            component="a" href={KOFI_URL} target="_blank" rel="noopener noreferrer"
            variant="outlined" startIcon={<Coffee size={16} />}
            sx={{ border: '2px solid #ccff00', color: '#ccff00', fontWeight: 900, textTransform: 'uppercase', py: 2, '&:hover': { bgcolor: '#ccff00', color: '#020617', border: '2px solid #ccff00' } }}
          >
            Ko-fi (avulso)
          </Button>
        </Box>

        <Typography variant="body2" sx={{ color: '#64748b', textAlign: 'center', mt: 5 }}>
          Custos transparentes? Veja o <a href="https://github.com/renatobezerra/radar-unificando/blob/main/COSTS.md" style={{ color: '#ccff00' }} rel="noopener noreferrer" target="_blank">COSTS.md</a>.
        </Typography>
      </Container>
    </Box>
  );
}
```

> Ajustes necessários antes de considerar pronto: (1) brcode/chave reais da Task 1; (2) URL do repo GitHub correta (confirmar owner/name — hoje não há remote github no projeto; ver Task 14); (3) se o projeto usa `eslint-disable` para `<img>` de outro jeito (verificar outros usos de `next/image` no repo); (4) `metadata` — como a página é client component, exportar `metadata` não funciona; mover title/description para `src/app/doar/page.tsx` como server wrapper OU aceitar sem metadata (verificar padrão do `/sobre` que é server component e tem metadata — decisão: extrair server component wrapper `src/app/doar/page.tsx` que renderiza `<DoarContent />`; ou simplesmente criar `src/app/doar/page.tsx` (server) + `src/app/doar/doar-content.tsx` (client)). **Recomendado:** server page com metadata + client content, seguindo o padrão do resto do app.
> **Canais opcionais:** o bloco PIX é o núcleo (modelo "quem usa doa"). Os botões GitHub Sponsors/Ko-fi podem ser removidos se as Tasks 2/3 forem puladas — nesse caso remover também os testes correspondentes (`should_render_sponsor_and_kofi_links`).

**Step 2:** Rodar o teste — Expected: PASS (4 passed).

**Step 3:** Rodar suíte completa + lint:

```bash
npm run test
npm run lint
```

**Step 4:** Commit:
```bash
git add src/app/doar/ src/__tests__/doar-page.test.tsx
git commit -m "feat: criar página de doação (/doar) com PIX, GitHub Sponsors e Ko-fi"
```

### Task 12: Seção "Apoie" no `/sobre`

**Files:** Modify: `src/app/sobre/page.tsx` (inserir antes do fechamento final do `</Container>`/`</Box>`)

**Step 1:** Ler o final do arquivo e inserir o bloco (estilo coerente com a página):

```tsx
<Box sx={{ textAlign: 'center', mt: 8, p: 4, border: '2px solid #ccff00', boxShadow: '6px 6px 0px #ccff00', bgcolor: '#0f172a' }}>
  <Typography variant="h2" sx={{ fontWeight: 900, fontSize: '1.25rem', textTransform: 'uppercase', color: '#ccff00', mb: 2 }}>
    <Heart size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} />
    APOIE O PROJETO
  </Typography>
  <Typography variant="body1" sx={{ color: '#94a3b8', maxWidth: 520, mx: 'auto', mb: 3 }}>
    O Radar é gratuito e open source. Se te ajudou, considere uma doação —
    ela cobre servidor, banco e os tokens de IA do chat.
  </Typography>
  <Button component={Link} href="/doar" variant="contained" startIcon={<Heart size={16} />}
    sx={{ bgcolor: '#ccff00', color: '#020617', fontWeight: 900, textTransform: 'uppercase', '&:hover': { bgcolor: '#b8e600' } }}>
    Quero doar
  </Button>
</Box>
```

> Adicionar `Heart` aos imports de lucide-react já existentes na linha 7 do arquivo.

**Step 2:** Verificação: `npm run lint` + `npm run test` passando.

**Step 3:** Commit:
```bash
git add src/app/sobre/page.tsx
git commit -m "feat: adicionar seção de apoio na página sobre"
```

### Task 13: Validação completa

1. `npm run test` — Expected: todos passando (178+ novos).
2. `npm run lint` — Expected: sem erros novos.
3. Build SEM derrubar o dev (conflito `.next` documentado no README):
```bash
NEXT_DIST_DIR=.next-check npm run build
```
Expected: `✓ Compiled successfully` + `✓ Generating static pages (N/N)`.
4. Manual: `npm run dev` → abrir `/doar` (QR + copiar funciona), conferir link APOIAR no footer e seção no `/sobre`.

---

## FASE 3 — Lançamento

### Task 14: Definir remote GitHub e publicar

**Step 1:** Confirmar com o Renato o owner/name do repo (ex: `renatobezerra/radar-unificando`) e ajustar os links no código/README/COSTS.md se o nome diferir.

**Step 2:** Push das branches e verificar no GitHub: botão **Sponsor** visível (via FUNDING.yml), badges no README renderizando.

**Step 3:** Commit final se houver ajustes de URL.

### Task 15: Ativação dos canais (PIX primeiro)

1. Testar uma doação PIX de R$ 1 com o próprio QR (scanner + copia-e-cola) — confirma o fluxo ponta a ponta.
2. (Se Tasks 2/3 feitas) Conferir payout BR configurado no Sponsors e testar um tier mínimo.
3. (Opcional) Divulgar: post no LinkedIn/redes com o link `/doar` e o COSTS.md.

---

## Verificação (resumo dos comandos)

```bash
npm run test                # 178+ testes
npm run lint                # sem erros novos
NEXT_DIST_DIR=.next-check npm run build   # build sem corromper .next do dev
```

## Riscos, tradeoffs e decisões em aberto

**Riscos/tradeoffs**
- **Taxas**: PIX 0%; GitHub Sponsors **0% em conta pessoal** (confirmado em docs.github.com — 100% para o dev; a taxa de até 6% só vale para conta de organização, que não é o caso); Ko-fi 0% em doações + processamento Stripe/PayPal.
- **Fiscal (Brasil)**: doações recebidas como PF entram como "outros rendimentos" na declaração de IR; se houver MEI, emitir recibo. Consultar contador antes de valores relevantes. Não é blocker para começar.
- **Claim de gratuidade**: ajustar wording (Task 5) para não gerar contradição "gratuito vs doações".
- **Privacidade**: QR/chave estáticos não rastreiam doador (bom p/ LGPD); chave aleatória não expõe CPF.
- **Segurança**: links externos com `rel="noopener noreferrer"` (padrão já usado no footer); nenhuma rota nova de escrita no backend.
- **SEO**: conferir se `/doar` entra no sitemap/robots (verificar `src/app/sitemap.ts` se existir).

**Open questions (responder antes da Fase 0/1)**
1. Chave PIX: aleatória, CPF ou CNPJ/MEI?
2. Quer um lembrete sutil de doação para usuários do app (ex: banner descartável que aparece após N buscas, guardado em localStorage, com link para `/doar`)? Ou só o link no footer basta?
3. Quer lista pública de apoiadores no `/sobre` (estática no código) ou prefere manter anônimo?
4. GitHub Sponsors/Ko-fi: entrar depois (quando o repo tiver comunidade) ou pular de vez (YAGNI)?
5. Valores sugeridos de doação (ex: avulsa R$ 5/10/25 via PIX)?

## Arquivos afetados (resumo)

| Ação | Arquivo |
|---|---|
| Create | `.github/FUNDING.yml`, `COSTS.md`, `public/pix-qr.png`, `src/app/doar/page.tsx` (+ `doar-content.tsx` se server/client separados), `src/__tests__/footer.test.tsx`, `src/__tests__/doar-page.test.tsx` |
| Modify | `README.md`, `src/components/layout/footer.tsx`, `src/app/sobre/page.tsx` |
| Sem mudança | `package.json` (zero dependências novas), schema Prisma, API routes |
