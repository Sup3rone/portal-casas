// T-5210 (pedido de Gabriel): switch «Modo usuario ↔ Modo vendedor» para quien tiene panel.
// Offline: mapeo puro de rutas equivalentes, páginas de paso (slug ↔ id con permisos) y entrada /app que recuerda el modo.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { load, memory, req, mockModule, setSession } = require('./test-property-access.cjs');
let cookie = null;
mockModule('next/headers', { cookies: async () => ({ get: name => name === 'alia_mode' && cookie ? { name, value: cookie } : undefined }), headers: async () => new Headers() });
const React = req('react');
const { renderToStaticMarkup } = req('react-dom/server');
const { NextIntlClientProvider } = req('next-intl');
const { modeTarget, MODE_COOKIE } = load('apps/web/src/lib/vendor-mode.ts');
const ModeSwitch = load('apps/web/src/components/ModeSwitch.tsx').default;
const openPage = load('apps/web/src/app/[locale]/panel/vender/abrir/page.tsx').default;
const publicPage = load('apps/web/src/app/[locale]/panel/vender/[id]/publica/page.tsx').default;
const appPage = load('apps/web/src/app/[locale]/app/page.tsx').default;

// 1) Mapeo puro (rutas sin prefijo de idioma). Solo viajan fechas, huéspedes y destino; nada más de la URL.
const q = '?start=2026-12-18&end=2026-12-22&guests=2&state=Jalisco&destinationCity=Guadalajara&utm=x';
assert.equal(MODE_COOKIE, 'alia_mode');
assert.deepEqual(modeTarget('/panel/vender', q), { mode: 'vendor', target: '/casas?start=2026-12-18&end=2026-12-22&guests=2&state=Jalisco&destinationCity=Guadalajara' });
assert.deepEqual(modeTarget('/panel/vender/abc-123', q), { mode: 'vendor', target: '/panel/vender/abc-123/publica?start=2026-12-18&end=2026-12-22&guests=2' });
assert.deepEqual(modeTarget('/panel/vender/abc-123/cotizar', q), { mode: 'vendor', target: '/panel/vender/abc-123/publica?start=2026-12-18&end=2026-12-22&guests=2' });
assert.deepEqual(modeTarget('/panel/reservas', ''), { mode: 'vendor', target: '/' });
assert.deepEqual(modeTarget('/admin/calendario', ''), { mode: 'vendor', target: '/' });
assert.deepEqual(modeTarget('/casas', q), { mode: 'user', target: '/panel/vender?start=2026-12-18&end=2026-12-22&guests=2&state=Jalisco&destinationCity=Guadalajara' });
assert.deepEqual(modeTarget('/casas/casa-azul', q), { mode: 'user', target: '/panel/vender/abrir?slug=casa-azul&start=2026-12-18&end=2026-12-22&guests=2' });
assert.deepEqual(modeTarget('/', ''), { mode: 'user', target: '/panel/vender' });
assert.deepEqual(modeTarget('/nosotros', '?x=1'), { mode: 'user', target: '/panel/vender' });
assert.deepEqual(modeTarget('/casas/a%20b', ''), { mode: 'user', target: '/panel/vender/abrir?slug=a+b' }, 'slug decodificado y re-codificado');
console.log('modeTarget: rutas equivalentes OK');

// 2) El switch: dos opciones, la actual marcada; el otro modo enlaza al destino equivalente con idioma.
for (const locale of ['es', 'en', 'fr']) {
  const messages = JSON.parse(fs.readFileSync(path.join(__dirname, '../apps/web/messages/' + locale + '.json'), 'utf8'));
  const html = renderToStaticMarkup(React.createElement(NextIntlClientProvider, { locale, messages, timeZone: 'America/Mexico_City', onError(error) { throw error; } },
    React.createElement(ModeSwitch, { pathname: '/casas/casa-azul', locale })));
  assert.ok(html.includes('data-mode-switch'));
  assert.ok(html.includes(messages.vendor.modeUser) && html.includes(messages.vendor.modeVendor));
  assert.match(html, /aria-current="page"[^>]*>[^<]*<\/span>|aria-current="page"/);
  assert.ok(html.includes(`href="/${locale}/panel/vender/abrir?slug=casa-azul"`), locale + ': salta a la ficha del vendedor');
  const vendor = renderToStaticMarkup(React.createElement(NextIntlClientProvider, { locale, messages, timeZone: 'America/Mexico_City', onError(error) { throw error; } },
    React.createElement(ModeSwitch, { pathname: '/panel/vender', locale })));
  assert.ok(vendor.includes(`href="/${locale}/casas"`), locale + ': del panel al sitio público');
}
console.log('ModeSwitch es/en/fr OK');

async function main() {
  memory.prepare('UPDATE "Property" SET slug = id').run();
  // 3) Página de paso usuario → vendedor: slug → id SOLO si la gestiona; si no, a la búsqueda del vendedor con sus fechas.
  const open = query => openPage({ params: Promise.resolve({ locale: 'es' }), searchParams: Promise.resolve(query) });
  setSession(null);
  await assert.rejects(() => open({ slug: 'pa' }), error => error.message === 'redirect: /es', 'sin panel → portada');
  setSession({ user: { id: 'a' } });
  await assert.rejects(() => open({ slug: 'pa', start: '2026-12-18', end: '2026-12-22', guests: '2', extra: 'x' }), error => error.message === 'redirect: /es/panel/vender/pa?start=2026-12-18&end=2026-12-22&guests=2');
  await assert.rejects(() => open({ slug: 'pb', start: '2026-12-18', end: '2026-12-22' }), error => error.message === 'redirect: /es/panel/vender?start=2026-12-18&end=2026-12-22', 'casa ajena: no revela su id');
  await assert.rejects(() => open({}), error => error.message === 'redirect: /es/panel/vender');
  // 4) Página de paso vendedor → usuario: id → ficha pública si está publicada; borrador → portada; ajena → 404.
  const pub = (id, query = {}) => publicPage({ params: Promise.resolve({ locale: 'en', id }), searchParams: Promise.resolve(query) });
  await assert.rejects(() => pub('pa', { start: '2026-12-18', end: '2026-12-22', guests: '2' }), error => error.message === 'redirect: /en/casas/pa?start=2026-12-18&end=2026-12-22&guests=2');
  await assert.rejects(() => pub('hidden'), error => error.message === 'redirect: /en');
  await assert.rejects(() => pub('pb'), error => error.status === 404);
  // 5) Entrada /app (la usará la PWA): abre en el último modo; quien no tiene panel siempre va a la portada.
  const app = () => appPage({ params: Promise.resolve({ locale: 'fr' }) });
  for (const [value, target] of [[null, '/fr/panel/vender'], ['vendor', '/fr/panel/vender'], ['user', '/fr'], ['raro', '/fr/panel/vender']]) {
    cookie = value;
    await assert.rejects(app, error => error.message === `redirect: ${target}`, String(value));
  }
  setSession({ user: { id: 'client' } });
  cookie = 'vendor';
  await assert.rejects(app, error => error.message === 'redirect: /fr', 'un cliente nunca entra al panel');
  setSession(null);
  await assert.rejects(app, error => error.message === 'redirect: /fr');
  console.log('páginas de paso y entrada /app OK');
  memory.close();
}
main().catch(error => { console.error(error); process.exitCode = 1; });
