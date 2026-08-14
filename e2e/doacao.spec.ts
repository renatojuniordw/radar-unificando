import { test, expect } from '@playwright/test';

test.describe('Doação (PIX)', () => {
  test('footer APOIAR leva à página /doar com PIX', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /apoiar/i }).click();
    await expect(page).toHaveURL(/\/doar/);
    await expect(page.getByRole('heading', { name: /apoie/i })).toBeVisible();
    await expect(page.getByText(/chave pix/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /copiar/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /costs\.md/i })).toBeVisible();
  });

  test('botão copiar código PIX funciona', async ({ page }) => {
    await page.context().grantPermissions(['clipboard-write']);
    await page.goto('/doar');
    await page.getByRole('button', { name: /copiar/i }).click();
    await expect(page.getByRole('button', { name: /código copiado/i })).toBeVisible();
  });
});