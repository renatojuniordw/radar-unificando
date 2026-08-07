import { test, expect } from '@playwright/test';

test.describe('Chat — limites e métricas (com autenticação)', () => {
  test('registro → login → abre o chat com métricas de tokens', async ({ page }) => {
    const email = `e2e-${Date.now()}@example.com`;
    // Senha gerada por execução (não é um segredo): conta efêmera de teste.
    // Satisfaz a validação do registro (8+ chars, maiúscula, minúscula, número e especial).
    const password = `E2e${Date.now()}!Aa`;

    // Registro
    await page.goto('/register');
    await page.getByLabel('Nome Completo').fill('Usuário E2E');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Senha', { exact: true }).fill(password);
    await page.getByLabel('Confirmar Senha', { exact: true }).fill(password);
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/\/login/, { timeout: 15000 });

    // Login
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Senha', { exact: true }).fill(password);
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL('/', { timeout: 15000 });

    // Abre o chat (FAB)
    await page.getByRole('button', { name: 'Abrir assistente de vagas' }).click();
    await expect(page.getByRole('heading', { name: 'Assistente de Vagas' })).toBeVisible();

    // Métricas de tokens no header (Contexto / Hoje / Mês)
    await expect(page.getByText(/Contexto/)).toBeVisible();
    await expect(page.getByText(/Hoje/)).toBeVisible();
    await expect(page.getByText(/Mês/)).toBeVisible();
  });
});