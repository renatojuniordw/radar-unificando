import { test, expect } from '@playwright/test';
import { dismissCookieConsent } from './helpers/auth';

test.describe('Doação (PIX)', () => {
  test('rodapé APOIAR leva à página /doar com PIX', async ({ page }) => {
    await page.goto('/');
    await dismissCookieConsent(page);
    await page.getByTestId('footer-apoiar-link').click();
    await expect(page).toHaveURL(/\/doar/);
    await expect(page.getByTestId('doar-copy-pix-button')).toBeVisible();
    await expect(page.getByTestId('doar-costs-link')).toBeVisible();
  });

  test('botão copiar código PIX funciona', async ({ page }) => {
    await page.context().grantPermissions(['clipboard-write']);
    await page.goto('/doar');
    await dismissCookieConsent(page);
    await page.getByTestId('doar-copy-pix-button').click();
    // Rótulo real do estado copiado (doar-content.tsx): "CÓDIGO PIX COPIADO!"
    await expect(page.getByText(/pix copiado/i)).toBeVisible();
  });
});