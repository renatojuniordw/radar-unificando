/**
 * Project de setup do Playwright: autentica uma única vez cada usuário de
 * teste e salva o storageState (cookies de sessão). Os specs autenticados
 * reutilizam esse estado via test.use({ storageState }), evitando login por
 * teste — que estourava o rate-limit de auth (5/min) com a suíte rodando
 * em paralelo.
 */
import { test as setup, type Page } from '@playwright/test';
import { resolve } from 'node:path';
import { mkdirSync } from 'node:fs';
import { E2E_USER, E2E_ADMIN } from './helpers/seed';
import { login } from './helpers/auth';

// process.cwd() (não __dirname): o setup roda fora do Next.js e o cwd do
// Playwright é a raiz do projeto (ver memória do time sobre globalSetup).
const AUTH_DIR = resolve(process.cwd(), 'e2e/.auth');

async function saveState(
  page: Page,
  email: string,
  password: string,
  filename: string,
): Promise<void> {
  mkdirSync(AUTH_DIR, { recursive: true });
  await login(page, email, password);
  await page.context().storageState({ path: resolve(AUTH_DIR, filename) });
}

setup('autenticação do usuário comum', async ({ page }) => {
  await saveState(page, E2E_USER.email, E2E_USER.password, 'user.json');
});

setup('autenticação do usuário admin', async ({ page }) => {
  await saveState(page, E2E_ADMIN.email, E2E_ADMIN.password, 'admin.json');
});