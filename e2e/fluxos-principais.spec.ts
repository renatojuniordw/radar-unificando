import { test, expect } from '@playwright/test';

test.describe('Radar Unificando — Fluxos Principais', () => {
  test('home page carrega e mostra elementos principais', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /radar de vagas/i })).toBeVisible();
    await expect(page.getByText('BUSCAR VAGAS EM TEMPO REAL').first()).toBeVisible();
    await expect(page.getByRole('link', { name: /sobre/i }).first()).toBeVisible();
  });

  test('navegação para login funciona', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /entrar/i })).toBeVisible();
  });

  test('navegação para register funciona', async ({ page }) => {
    await page.goto('/register');
    await expect(page.getByRole('heading', { name: /criar/i })).toBeVisible();
  });

  test('dashboard routes redirecionam para login quando não autenticado', async ({ page }) => {
    await page.goto('/perfil');
    await expect(page).toHaveURL(/\/login/);
  });

  test('admin route redireciona para login quando não autenticado', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/login/);
  });

  test('health check endpoint responde', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.ok()).toBeTruthy();
  });
});