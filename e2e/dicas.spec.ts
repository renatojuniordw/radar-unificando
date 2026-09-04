import { test, expect } from '@playwright/test';
import { dismissCookieConsent } from './helpers/auth';

test.describe('Dicas — lista e conteúdo', () => {
  test('lista de dicas carrega e abre uma dica', async ({ page }) => {
    await page.goto('/dicas');
    await dismissCookieConsent(page);

    await expect(page.getByTestId('dica-card-grid')).toBeVisible();
    await page.getByTestId('dica-link').first().click();
    await expect(page.getByTestId('dica-page')).toBeVisible();
  });

  test('dica inexistente retorna 404', async ({ page }) => {
    await page.goto('/dicas/slug-inexistente-e2e');
    await dismissCookieConsent(page);

    await expect(page.getByTestId('not-found-voltar-link')).toBeVisible();
  });
});