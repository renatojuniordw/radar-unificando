import { test, expect } from '@playwright/test';
import { go } from './helpers/auth';

// storageState gerado pelo project de setup (e2e/auth.setup.ts) — evita
// login por teste e o rate-limit de auth (5/min).
test.use({ storageState: 'e2e/.auth/user.json' });

test.describe('Chat — limites e métricas (com autenticação)', () => {
  test('login → abre o chat com métricas de tokens', async ({ page }) => {
    await go(page, '/');

    // Abre o chat (FAB)
    await page.getByTestId('chat-open-button').click();
    await expect(page.getByTestId('chat-drawer')).toBeVisible();

    // Métricas de tokens no header (Contexto / Hoje / Mês)
    await expect(page.getByText(/Contexto/)).toBeVisible();
    await expect(page.getByText(/Hoje/)).toBeVisible();
    await expect(page.getByText(/Mês/)).toBeVisible();
  });
});