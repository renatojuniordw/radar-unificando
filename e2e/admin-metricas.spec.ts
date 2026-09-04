import { test, expect } from '@playwright/test';
import { go } from './helpers/auth';

test.describe('Admin — dashboard de métricas (admin)', () => {
  // storageState do ADMIN (E2E_ADMIN) gerado no project de setup
  test.use({ storageState: 'e2e/.auth/admin.json' });

  test('admin vê o dashboard de métricas', async ({ page }) => {
    await go(page, '/admin');

    await expect(page.getByTestId('admin-dashboard-title')).toBeVisible();
    // admin-nav-link pode aparecer múltiplas vezes (menu desktop + mobile) —
    // .first() evita strict mode; presença já valida a navegação admin.
    await expect(page.getByTestId('admin-nav-link').first()).toBeVisible();
    await expect(page.getByTestId('admin-date-range-filter')).toBeVisible();
  });
});

test.describe('Admin — proteção de acesso (usuário comum)', () => {
  // storageState do usuário comum (E2E_USER) gerado no project de setup
  test.use({ storageState: 'e2e/.auth/user.json' });

  test('usuário comum recebe 404 na área admin', async ({ page }) => {
    await go(page, '/admin');

    // Admin layout responde notFound() para role !== 'admin' — o not-found
    // global é renderizado (não revela a existência da área).
    await expect(page.getByTestId('not-found-voltar-link')).toBeVisible();
  });
});