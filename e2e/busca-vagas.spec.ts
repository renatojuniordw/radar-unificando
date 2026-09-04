import { test, expect } from '@playwright/test';
import type { Job } from '../src/lib/types/job';
import { dismissCookieConsent } from './helpers/auth';

// Vaga sintética determinística: o page.route substitui a resposta de
// /api/vagas (array de jobs), removendo a dependência do estado do banco.
const jobFake: Job = {
  id: 'e2e-job-1',
  company: 'Tech E2E Ltda',
  platform: 'Gupy',
  onList: 'Sim',
  roleCategory: 'Desenvolvimento',
  title: 'Desenvolvedor Full Stack Sênior',
  type: 'CLT',
  location: 'Remoto',
  link: 'https://exemplo.com/vaga-e2e',
  companyNameOnPlatform: 'Tech E2E',
  postedAt: '2026-09-01',
  alert: '',
  detectedAt: '2026-09-02T00:00:00.000Z',
  description: 'Vaga sintética usada apenas em teste E2E.',
};

test.describe('Busca de vagas', () => {
  test('busca retorna e exibe uma vaga na tabela', async ({ page }) => {
    await page.route('**/api/vagas*', (route) => route.fulfill({ json: [jobFake] }));

    await page.goto('/busca');
    await dismissCookieConsent(page);

    await expect(page.getByTestId('job-table')).toBeVisible();
    await expect(page.getByTestId('job-table-row')).toHaveCount(1);
  });

  test('busca sem resultados exibe estado vazio com botão de limpar filtros', async ({ page }) => {
    // Mock de /api/vagas devolve lista vazia → tabela sem dados.
    await page.route('**/api/vagas*', (route) => route.fulfill({ json: [] }));

    await page.goto('/busca');
    await dismissCookieConsent(page);

    // O botão de limpar filtros só aparece quando há filtro ativo
    // (countTotalFilters = countSecondaryFilters + (searchFilter ? 1 : 0)).
    // A query string "q" NÃO popula searchFilter — é preciso digitar no
    // campo de refinar busca (job-filters-desktop-search).
    await expect(page.getByTestId('job-empty-state')).toBeVisible();
    // O testid fica na raiz do TextField MUI (div) — o fill vai no <input> interno.
    await page
      .getByTestId('job-filters-desktop-search')
      .locator('input')
      .fill('termo inexistente');
    await expect(page.getByTestId('job-empty-state-clear-filters')).toBeVisible();
  });
});