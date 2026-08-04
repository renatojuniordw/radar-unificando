import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const consoleErrors = [];
page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
page.on('pageerror', err => consoleErrors.push('pageerror: ' + err.message));

await page.goto('http://localhost:3000/', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(1500);

const scratch = '/private/tmp/claude-501/-Users-renatobezerra-Developer-radar-unificando/a2575fb2-ab07-4fc7-ac8e-6ab4bd964951/scratchpad';

await page.screenshot({ path: `${scratch}/desktop-full.png`, fullPage: true });

const headerText = await page.locator('text=VAGAS ENCONTRADAS').first().textContent().catch(() => null);
console.log('Header text:', headerText);

const searchInput = page.getByPlaceholder('Buscar por palavra-chave...');
if (await searchInput.count() > 0) {
  await searchInput.fill('engenheiro');
  await page.screenshot({ path: `${scratch}/desktop-search.png` });
}

await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(500);
await page.screenshot({ path: `${scratch}/mobile-full.png`, fullPage: true });

const filterBtn = page.getByText('FILTROS AVANÇADOS', { exact: false }).first();
if (await filterBtn.count() > 0) {
  await filterBtn.click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${scratch}/mobile-drawer.png` });
}

console.log('Console errors:', JSON.stringify(consoleErrors, null, 2));
await browser.close();
