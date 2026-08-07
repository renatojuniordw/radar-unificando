import { test, expect } from '@playwright/test';

test.describe('Vagas públicas (SEO)', () => {
  test('página /vagas carrega com título e conteúdo', async ({ page }) => {
    await page.goto('/vagas');
    await expect(page.getByRole('heading', { name: /vagas agregadas/i })).toBeVisible();
    // Com vagas persistidas: lista de cards; sem vagas: link para buscar na home
    const emptyLink = page.getByRole('link', { name: /buscar vagas agora/i });
    const jobCard = page.getByText(/ver vaga/i).first();
    await expect(emptyLink.or(jobCard).first()).toBeVisible();
  });

  test('navegação para uma categoria de vaga funciona', async ({ page }) => {
    await page.goto('/vagas');
    const categoryLink = page.locator('a[href^="/vagas/"]').first();
    if ((await categoryLink.count()) === 0) {
      test.skip(true, 'nenhuma categoria persistida no banco');
      return;
    }
    await categoryLink.click();
    await expect(page).toHaveURL(/\/vagas\/.+/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});