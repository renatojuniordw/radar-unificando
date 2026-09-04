import { test, expect } from '@playwright/test';
import { dismissCookieConsent } from './helpers/auth';

test.describe('Cursos — catálogo e skill', () => {
  test('catálogo de cursos carrega com cards', async ({ page }) => {
    await page.goto('/cursos');
    await dismissCookieConsent(page);

    // course-grid pode aparecer mais de uma vez (ex.: grade de skills
    // populares + grade de resultados) — o primeiro é o catálogo.
    await expect(page.getByTestId('course-grid').first()).toBeVisible();
    await expect(page.getByTestId('course-card').first()).toBeVisible();
  });

  test('skill inexistente retorna 404', async ({ page }) => {
    await page.goto('/cursos/skill-inexistente-e2e');
    await dismissCookieConsent(page);

    await expect(page.getByTestId('not-found-voltar-link')).toBeVisible();
  });
});