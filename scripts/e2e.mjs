/**
 * Prueba de punta a punta contra un servidor LOCAL (crea leads de prueba).
 *
 *   npm run build
 *   npm run serve:dist                       # en otra terminal
 *   ADMIN_PASSWORD="..." npm run e2e
 *
 * Requiere Playwright: npm i --no-save playwright && npx playwright install chromium
 *
 * Revisa: registro + giro en el tótem, que el servidor guarde el lead y sume
 * inventario/conteo, que los leads no sean públicos, la cola sin conexión y
 * el acceso al panel. No la corras contra producción: escribe datos reales.
 */
import { chromium } from 'playwright';

const BASE = (process.env.BASE_URL ?? 'http://127.0.0.1:8090').replace(/\/$/, '');
const PASSWORD = process.env.ADMIN_PASSWORD ?? '';
const API = `${BASE}/api/state.php`;

if (!/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(BASE) && process.env.E2E_ALLOW_REMOTE !== '1') {
  console.error(`BASE_URL=${BASE} no es local. Esta prueba crea leads; usa E2E_ALLOW_REMOTE=1 si de verdad quieres.`);
  process.exit(1);
}
if (!PASSWORD) {
  console.error('Falta ADMIN_PASSWORD (la contraseña del panel).');
  process.exit(1);
}

let failures = 0;
const check = (ok, label, detail = '') => {
  console.log(`${ok ? '✓' : '✗'} ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures++;
};
const post = (body) =>
  fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

// --- Sesión de administrador -------------------------------------------------
check((await post({ action: 'login', password: 'incorrecta' })).status === 401, 'contraseña incorrecta rechazada');
const loginRes = await post({ action: 'login', password: PASSWORD });
const { token } = loginRes.ok ? await loginRes.json() : {};
check(!!token, 'login con la contraseña correcta');
if (!token) process.exit(1);
const admin = async () => (await fetch(API, { headers: { 'X-Admin-Token': token } })).json();

const browser = await chromium.launch();
const errors = [];

// El panel siembra la configuración si el servidor aún no tiene.
const adminPage = await browser.newPage();
adminPage.on('pageerror', (e) => errors.push(`admin: ${e}`));
await adminPage.goto(`${BASE}/admin`);
await adminPage.fill('input[type=password]', PASSWORD);
await adminPage.click('button[type=submit]');
await adminPage.waitForSelector('text=Gajos de la ruleta', { timeout: 10000 });
check(true, 'el panel carga después del login');
await adminPage.waitForTimeout(1500);

// --- Giro con registro --------------------------------------------------------
async function playOnce({ offline = false } = {}) {
  const page = await browser.newPage({ viewport: { width: 540, height: 960 } });
  page.on('pageerror', (e) => errors.push(`tótem: ${e}`));
  if (offline) await page.route('**/api/state.php', (r) => (r.request().method() === 'POST' ? r.abort() : r.continue()));
  await page.goto(`${BASE}/totem`);
  await page.waitForSelector('#name', { timeout: 10000 });
  const stamp = Date.now().toString(36);
  await page.fill('#name', `Prueba E2E ${stamp}`);
  await page.fill('#email', `e2e-${stamp}@example.com`);
  await page.fill('#phone', '4490000000');
  await page.click('#terms');
  await page.getByText('Participar y girar la ruleta').click();
  await page.getByRole('button', { name: 'Girar la ruleta', exact: true }).click();
  await page.waitForSelector('text=Volviendo al inicio', { timeout: 15000 });
  return page;
}

const before = await admin();
const winsBefore = before.config.prizes.reduce((s, p) => s + p.currentWins, 0);
let page = await playOnce();
await page.waitForTimeout(1000);
await page.close();
const after = await admin();
check(after.participants.length === before.participants.length + 1, 'el lead llega al servidor');
check(after.config.prizes.reduce((s, p) => s + p.currentWins, 0) === winsBefore + 1, 'el inventario suma el giro');
check(
  after.config.gameConfig.currentDailyCount === before.config.gameConfig.currentDailyCount + 1,
  'el conteo del día suma el giro',
);

// --- Privacidad ----------------------------------------------------------------
const pub = await (await fetch(API)).json();
check(!('participants' in pub), 'el GET público no expone leads');
check((await post({ action: 'config', token: 'falso', config: {} })).status === 401, 'no se puede escribir sin sesión');

// --- Sin conexión ----------------------------------------------------------------
page = await playOnce({ offline: true });
const queued = await page.evaluate(() => JSON.parse(localStorage.getItem('utaRuletaPendingLeads') || '[]').length);
check(queued === 1, 'sin red, el lead queda en cola local');
await page.unroute('**/api/state.php');
await page.reload();
await page.waitForTimeout(3000);
const left = await page.evaluate(() => JSON.parse(localStorage.getItem('utaRuletaPendingLeads') || '[]').length);
check(left === 0, 'al volver la red, la cola se envía sola');
await page.close();

check(errors.length === 0, 'sin errores de JavaScript', errors.join(' | '));
await browser.close();
console.log(failures ? `\n${failures} prueba(s) fallaron.` : '\nTodo en orden.');
process.exit(failures ? 1 : 0);
