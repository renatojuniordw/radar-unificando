/**
 * Helpers de UI reutilizáveis entre os specs E2E (regra de reuso — um passo
 * repetido em mais de uma jornada vira componente, não é copiado).
 * Seletores usam data-testid confirmados em testid-changes-report.md.
 *
 * Autenticação: os specs autenticados usam storageState gerado pelo project
 * de setup (e2e/auth.setup.ts) — `login()` aqui serve apenas ao setup.
 */
import type { Page } from "@playwright/test";

/**
 * Dispensa o aviso de cookies (LGPD). O dialog é fixo no rodapé e pode
 * bloquear cliques — deve ser dispensado no início de jornadas que clicam
 * em elementos do rodapé/parte inferior.
 *
 * Tolerante a corrida: em testes com storageState o consentimento já está
 * salvo, então o dialog renderiza na hidratação e se desmonta sozinho —
 * aguarda sumir antes; só clica em "Aceitar" se o dialog continuar visível.
 */
export async function dismissCookieConsent(page: Page): Promise<void> {
  const dialog = page.getByTestId("cookie-consent-dialog");
  await dialog.waitFor({ state: "hidden", timeout: 2000 }).catch(() => {});
  if (await dialog.isVisible().catch(() => false)) {
    await page
      .getByTestId("cookie-consent-accept-button")
      .click({ timeout: 3000 })
      .catch(() => {});
    await dialog.waitFor({ state: "hidden", timeout: 3000 }).catch(() => {});
  }
}

/**
 * Realiza login via UI com credenciais seedadas (usado no project de setup
 * para gerar o storageState; NÃO deve ser usado em specs — evita o
 * rate-limit de auth de 5/min).
 */
export async function login(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  await page.goto("/login");
  await dismissCookieConsent(page);
  await page.getByTestId("login-email-input").fill(email);
  await page.getByTestId("login-senha-input").fill(password);
  await page.getByTestId("login-submit-button").click();
  await page.waitForURL((url) => url.pathname === "/", { timeout: 15000 });
}

/**
 * Navega para uma rota já autenticada (via storageState) e dispensa o aviso
 * de cookies na chegada.
 */
export async function go(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await dismissCookieConsent(page);
}