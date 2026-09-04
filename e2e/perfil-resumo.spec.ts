import { test, expect, type Page } from '@playwright/test';
import { go } from './helpers/auth';

// storageState do usuário comum (E2E_USER) gerado no project de setup —
// evita login por teste e o rate-limit de auth (5/min).
test.use({ storageState: 'e2e/.auth/user.json' });

// Resposta sintética de /api/ats/analyze (shape de AtsResult). O page.route
// evita depender do LLM real; o resultado determinístico garante o assert.
const atsResultMock = {
  analysis: {
    score: 82,
    summary: 'Bom alinhamento com a vaga.',
    missingKeywords: [],
    recommendations: ['Quantifique suas conquistas.'],
  },
  heuristics: {
    checks: [{ label: 'Estrutura', passed: true, detail: 'OK' }],
    score: 82,
  },
  cached: false,
};

// Currículo mínimo para o usuário E2E (sem Profile inicial) chegar ao
// estado com ATS visível. O upload real seria via dropzone/arquivo — aqui
// usamos o fluxo de colar texto e extrair, com o /api/upload mockado
// (POST → jobId + poll → result), sem depender do LLM de extração.
const RESUMO_MINIMO = `
RENATO BEZERRA
Desenvolvedor Full Stack
Experiência com Next.js, React, TypeScript e Node.js.
Criação de features de busca unificada de vagas e ferramentas de IA.
`;

// Mock do fluxo de upload: a extração é assíncrona (POST devolve jobId e o
// hook faz polling do status). Simular as duas respostas torna o teste
// determinístico, sem LLM real. seniority/area usam os valores válidos dos
// selects (evita warnings MUI de out-of-range).
async function mockUploadFlow(page: Page): Promise<void> {
  await page.route('**/api/upload', (route) =>
    route.fulfill({ json: { jobId: 'e2e-upload-job' } }),
  );
  await page.route('**/api/upload/e2e-upload-job', (route) =>
    route.fulfill({
      json: {
        status: 'completed',
        result: {
          resumeText: RESUMO_MINIMO,
          markdown: RESUMO_MINIMO,
          skills: ['React', 'TypeScript', 'Next.js'],
          seniority: 'pleno',
          experience: 5,
          currentRole: 'Desenvolvedor Full Stack',
          area: 'Engenharia',
          education: [],
          count: 3,
        },
      },
    }),
  );
}

test.describe('Perfil — análise ATS e currículos', () => {
  test('usuário sem currículo vê onboarding de importação', async ({ page }) => {
    await go(page, '/perfil');

    // Sem Profile, o ProfileTab mostra o estado setup (CRIE SEU PERFIL) com
    // as CTAs IMPORTAR CURRÍCULO / PREENCHER MANUALMENTE — o dropzone só
    // aparece depois de clicar (profile-tab.tsx: isSetup = !hasData && !showManualForm).
    await expect(page.getByRole('button', { name: /importar currículo/i })).toBeVisible();
    await expect(page.getByTestId('ats-analysis-section')).toHaveCount(0);

    await page.getByRole('button', { name: /importar currículo/i }).click();
    await expect(page.getByTestId('profile-import-dropzone')).toBeVisible();
  });

  test('currículo criado por colar texto permite análise ATS (mock upload + mock LLM)', async ({ page }) => {
    await mockUploadFlow(page);
    await page.route('**/api/ats/analyze', (route) => route.fulfill({ json: atsResultMock }));

    await go(page, '/perfil');

    // Estado setup (sem perfil): revela a seção de importação clicando na CTA
    await page.getByRole('button', { name: /importar currículo/i }).click();
    await expect(page.getByTestId('profile-import-textarea')).toBeVisible();

    // Importa o currículo via texto (com o upload mockado, determinístico)
    await page.getByTestId('profile-import-textarea').fill(RESUMO_MINIMO);
    await page.getByTestId('profile-import-text-button').click();

    // Após extração (poll completado), o ATS fica disponível (hasResume true)
    await expect(page.getByTestId('ats-analysis-section')).toBeVisible({ timeout: 20000 });
    await page.getByTestId('ats-analyze-button').click();

    await expect(page.getByTestId('ats-results-content')).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId('ats-checklist')).toBeVisible();
  });

  test('aba Currículos Adaptados fica vazia para usuário sem geração', async ({ page }) => {
    await go(page, '/perfil');

    await page.getByTestId('profile-tab-resumes').click();
    await expect(page.getByTestId('generated-resumes-empty')).toBeVisible();
  });
});