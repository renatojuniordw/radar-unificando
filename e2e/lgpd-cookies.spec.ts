import { test, expect } from '@playwright/test';

test.describe('LGPD — consentimento de cookies', () => {
  test('aceitar cookies esconde o aviso e persiste a escolha', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('cookie-consent-dialog')).toBeVisible();

    await page.getByTestId('cookie-consent-accept-button').click();
    await expect(page.getByTestId('cookie-consent-dialog')).toBeHidden();

    const consent = await page.evaluate(() => localStorage.getItem('cookie_consent'));
    expect(consent).toBe('accepted');
  });

  test('recusar cookies esconde o aviso e persiste a escolha', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('cookie-consent-dialog')).toBeVisible();

    await page.getByTestId('cookie-consent-decline-button').click();
    await expect(page.getByTestId('cookie-consent-dialog')).toBeHidden();

    const consent = await page.evaluate(() => localStorage.getItem('cookie_consent'));
    expect(consent).toBe('declined');
  });

  test('reabrir preferências pelo rodapé exibe o aviso novamente', async ({ page }) => {
    await page.goto('/doar');
    await expect(page.getByTestId('cookie-consent-dialog')).toBeVisible();
    await page.getByTestId('cookie-consent-accept-button').click();
    await expect(page.getByTestId('cookie-consent-dialog')).toBeHidden();

    // Botão de cookies no rodapé reabre o aviso mesmo com consentimento salvo
    await page.getByTestId('cookie-settings-open-button').click();
    await expect(page.getByTestId('cookie-consent-dialog')).toBeVisible();
  });
});