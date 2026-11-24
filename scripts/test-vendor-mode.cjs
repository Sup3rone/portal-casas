// T-5210 (pedido de Gabriel, replanteado 23-nov): switch «Usuario | Vendedor» SOLO en la app instalada (teléfono),
// para quien tiene panel. Cambiar de modo lleva SIEMPRE al inicio: usuario → portada; vendedor → «¿Qué está libre?».
// Offline: mapeo puro, detección de app instalada (pura), vista del switch y entrada /[locale]/app (route handler).
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { load, memory, req, setSession } = require('./test-property-access.cjs');
const React = req('react');
const { renderToStaticMarkup } = req('react-dom/server');
const { NextIntlClientProvider } = req('next-intl');
const { modeTarget, isInstalledApp, MODE_COOKIE, APP_COOKIE } = load('apps/web/src/lib/vendor-mode.ts');
const { ModeSwitchView } = load('apps/web/src/components/ModeSwitch.tsx');
const appEntry = load('apps/web/src/app/[locale]/app/route.ts');

// 1) Mapeo: panel/admin = vendedor → portada; todo lo demás = usuario → inicio del vendedor. Sin «página equivalente».
assert.deepEqual([MODE_COOKIE, APP_COOKIE], ['alia_mode', 'alia_app']);
for (const [pathname, expected] of [
  ['/panel/vender', { mode: 'vendor', target: '/' }],
  ['/es/panel/vender/abc/cotizar', { mode: 'vendor', target: '/' }],
  ['/admin/calendario', { mode: 'vendor', target: '/' }],
  ['/', { mode: 'user', target: '/panel/vender' }],
  ['/fr', { mode: 'user', target: '/panel/vender' }],
  ['/casas/casa-azul', { mode: 'user', target: '/panel/vender' }],
  ['/en/casas', { mode: 'user', target: '/panel/vender' }],
  ['/panelista', { mode: 'user', target: '/panel/vender' }],
]) assert.deepEqual(modeTarget(pathname), expected, pathname);

// 2) ¿App instalada? Modo standalone (Android/PWA/TWA), navigator.standalone (iPhone) o la marca de la entrada /app.
const win = ({ standalone = false, iosStandalone, cookie = '' } = {}) => ({ matchMedia: query => ({ matches: query === '(display-mode: standalone)' && standalone }), navigator: { standalone: iosStandalone }, document: { cookie } });
assert.equal(isInstalledApp(win()), false, 'navegador normal');
assert.equal(isInstalledApp(win({ cookie: 'theme=dark; alia_mode=vendor' })), false);
assert.equal(isInstalledApp(win({ standalone: true })), true, 'Android / PWA / TWA');
assert.equal(isInstalledApp(win({ iosStandalone: true })), true, 'iPhone desde la pantalla de inicio');
assert.equal(isInstalledApp(win({ cookie: 'theme=dark; alia_app=1' })), true, 'entró por /app');
assert.equal(isInstalledApp(win({ cookie: 'xalia_app=1' })), false);
assert.equal(isInstalledApp({ matchMedia: undefined, navigator: {}, document: { cookie: '' } }), false, 'sin matchMedia no rompe');
console.log('modeTarget e isInstalledApp OK');

// 3) Vista: interruptor tipo iOS «Modo vendedor» (role=switch). Encendido = vendedor; apagado = usuario.
//    Al tocarlo va al inicio del otro modo, con idioma.
for (const locale of ['es', 'en', 'fr']) {
  const messages = JSON.parse(fs.readFileSync(path.join(__dirname, '../apps/web/messages/' + locale + '.json'), 'utf8'));
  const render = pathname => renderToStaticMarkup(React.createElement(NextIntlClientProvider, { locale, messages, timeZone: 'America/Mexico_City', onError(error) { throw error; } },
    React.createElement(ModeSwitchView, { pathname, locale })));
  const user = render('/casas/casa-azul');
  assert.ok(user.includes('data-mode-switch') && user.includes('role="switch"') && user.includes(messages.vendor.modeSwitch));
  assert.ok(user.includes('aria-checked="false"'), locale + ': en el sitio, apagado');
  assert.ok(user.includes(`data-target="/${locale}/panel/vender"`), locale + ': al encender, inicio del vendedor');
  const vendor = render('/panel/vender/abc');
  assert.ok(vendor.includes('aria-checked="true"'), locale + ': en el panel, encendido');
  assert.ok(vendor.includes(`data-target="/${locale}"`), locale + ': al apagar, la portada');
  assert.ok(!vendor.includes('<a '), 'es un interruptor, no enlaces');
  // El identificador SIEMPRE se ve: «Vendedor» bajo el interruptor en el teléfono (cabe en la fila) y
  // «Modo vendedor» en pantallas grandes; nombre completo para lectores de pantalla; ícono de tienda en la bolita.
  assert.ok(user.includes(`aria-label="${messages.vendor.modeSwitch}"`));
  assert.match(user, new RegExp(`<span [^>]*class="(?:[^"]* )?sm:hidden[^"]*"[^>]*>${messages.vendor.modeShort}</span>`));
  assert.match(user, new RegExp(`<span [^>]*class="[^"]*max-sm:hidden[^"]*"[^>]*>${messages.vendor.modeSwitch}</span>`));
  assert.ok(!user.includes('sr-only'), 'nada escondido: el texto se ve');
  assert.ok(user.includes('data-mode-icon'), 'ícono en la bolita');
}
// En la portada (header transparente sobre el video) el interruptor va en blanco como los demás iconos.
assert.match(fs.readFileSync(path.join(__dirname, '../apps/web/src/app/home-composition.css'), 'utf8'), /\.home-navbar\[data-home-top\] \[data-mode-switch\][^{]*\{[^}]*color: var\(--color-white\)/);
console.log('ModeSwitchView es/en/fr OK');

async function main() {
  // 4) Entrada /[locale]/app (inicio de la app instalada): marca el navegador como app y abre en el último modo;
  //    quien no tiene panel va a la portada (también marcado: es la app).
  const enter = async (locale, cookie) => {
    const response = await appEntry.GET(new Request(`http://localhost/${locale}/app`, { headers: cookie ? { cookie } : {} }), { params: Promise.resolve({ locale }) });
    return { status: response.status, location: new URL(response.headers.get('location')).pathname, setCookie: response.headers.get('set-cookie') || '' };
  };
  setSession({ user: { id: 'a' } });
  for (const [cookie, target] of [[null, '/fr/panel/vender'], ['alia_mode=vendor', '/fr/panel/vender'], ['alia_mode=user', '/fr'], ['alia_mode=raro', '/fr/panel/vender']]) {
    const result = await enter('fr', cookie);
    assert.equal(result.status, 307, String(cookie));
    assert.equal(result.location, target, String(cookie));
    assert.match(result.setCookie, /alia_app=1/);
    assert.match(result.setCookie, /Path=\//i);
  }
  setSession({ user: { id: 'client' } });
  assert.equal((await enter('es', 'alia_mode=vendor')).location, '/es', 'un cliente nunca entra al panel');
  setSession(null);
  const anonymous = await enter('en');
  assert.deepEqual([anonymous.location, /alia_app=1/.test(anonymous.setCookie)], ['/en', true]);
  assert.equal((await enter('xx')).location, '/es', 'idioma desconocido → es');
  console.log('entrada /app OK');
  memory.close();
}
main().catch(error => { console.error(error); process.exitCode = 1; });
