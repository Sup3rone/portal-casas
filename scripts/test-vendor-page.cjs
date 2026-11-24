// T-5201 (app del vendedor, Task 3): pantalla «¿Qué está libre?» y barra inferior del panel en móvil.
// Offline: SSR real de la página y del layout en es/en/fr sobre SQLite en memoria. Sin navegador, red ni Neon.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { load, memory, req, setSession, setLocale } = require('./test-property-access.cjs');
const React = req('react');
const { renderToStaticMarkup } = req('react-dom/server');
const { NextIntlClientProvider, createTranslator } = req('next-intl');
const layout = load('apps/web/src/app/[locale]/panel/layout.tsx').default;
const page = load('apps/web/src/app/[locale]/panel/vender/page.tsx').default;
const { formatMoney } = load('apps/web/src/lib/booking-breakdown.ts');
const { inquiryToday } = load('apps/web/src/lib/inquiry-validation.ts');

// Fechas siempre futuras: el test no caduca. Precio igual entre semana y fin de semana → total = noches × 1000.
const plus = days => new Date(Date.parse(inquiryToday() + 'T00:00:00Z') + days * 86_400_000).toISOString().slice(0, 10);
const start = plus(30), end = plus(34), yesterday = plus(-1);
memory.prepare('UPDATE "Property" SET bedrooms = 2, bathrooms = 1, "baseWeekdayPrice" = 1000, "baseWeekendPrice" = 1000').run();
memory.prepare('UPDATE "Property" SET "baseWeekdayPrice" = NULL, "baseWeekendPrice" = NULL WHERE id = ?').run('hidden');
memory.prepare('UPDATE "Property" SET state = ?, "destinationCity" = ? WHERE id IN (?, ?)').run('Quintana Roo', 'Cancún', 'pa', 'hidden');
memory.prepare('UPDATE "Property" SET state = ?, "destinationCity" = ? WHERE id = ?').run('Yucatán', 'Mérida', 'pb');
for (const id of ['pa', 'pb', 'hidden']) memory.prepare('UPDATE "Property" SET "titleEs" = ?, "titleEn" = ?, "titleFr" = ? WHERE id = ?').run(`Casa ${id}`, `House ${id}`, `Maison ${id}`, id);

async function main() {
  for (const locale of ['es', 'en', 'fr']) {
    setLocale(locale);
    const messages = JSON.parse(fs.readFileSync(path.join(__dirname, '../apps/web/messages/' + locale + '.json'), 'utf8'));
    const raw = createTranslator({ locale, messages, namespace: 'vendor', onError(error) { throw error; } });
    // Texto tal como sale en el HTML de React (apóstrofos en en/fr).
    const t = (key, values) => raw(key, values).replace(/&/g, '&amp;').replace(/'/g, '&#x27;').replace(/"/g, '&quot;');
    const title = id => ({ es: `Casa ${id}`, en: `House ${id}`, fr: `Maison ${id}` })[locale];
    const params = Promise.resolve({ locale });
    const render = value => renderToStaticMarkup(React.createElement(NextIntlClientProvider, { locale, messages, timeZone: 'America/Mexico_City', onError(error) { throw error; } }, value));
    const show = async query => render(await page({ params, searchParams: Promise.resolve(query) }));

    // Sin sesión o sin rol de panel → a la portada, como el resto del panel.
    setSession(null);
    await assert.rejects(() => page({ params, searchParams: Promise.resolve({}) }), error => error.message === `redirect: /${locale}`);
    setSession({ user: { id: 'client' } });
    await assert.rejects(() => page({ params, searchParams: Promise.resolve({ start, end }) }), error => error.message === `redirect: /${locale}`);

    // COLLABORATOR 'a': sus dos casas (una sin precio), nunca la de 'b'.
    setSession({ user: { id: 'a' } });
    const found = await show({ start, end, guests: '2' });
    assert.ok(found.includes(t('title')));
    assert.ok(found.includes(t('count', { count: 2 })));
    assert.ok(found.includes(title('pa')) && found.includes(title('hidden')) && !found.includes(title('pb')));
    assert.ok(found.includes(formatMoney('4000', locale)), 'total de 4 noches × 1000 formateado en MXN');
    assert.ok(found.includes(t('noPrice')), 'casa sin tarifa → «Sin precio», nunca $0');
    assert.ok(!found.includes(formatMoney('0', locale)));
    assert.ok(found.includes(t('free')));
    assert.ok(found.includes(t('nights', { count: 4 })));
    assert.ok(found.includes(t('draft')), 'la casa no publicada se marca como tal');
    assert.ok(found.includes(`href="/${locale}/panel/vender/pa?start=${start}&amp;end=${end}&amp;guests=2"`));
    // El formulario conserva lo buscado y solo ofrece los destinos de las casas que gestiona.
    assert.ok(found.includes(`value="${start}"`) && found.includes(`value="${end}"`));
    assert.ok(found.includes('>Quintana Roo</option>') && !found.includes('Yucatán'));
    const byState = await show({ start, end, state: 'Quintana Roo', destinationCity: 'Cancún' });
    assert.ok(byState.includes('>Cancún</option>') && byState.includes(title('pa')));

    // Fechas pasadas o al revés → aviso y cero tarjetas.
    for (const query of [{ start: yesterday, end }, { start: end, end: start }, { start: 'x', end }]) {
      const invalid = await show(query);
      assert.ok(invalid.includes(t('invalid')));
      assert.ok(!invalid.includes(`/${locale}/panel/vender/pa`));
    }
    // Sin fechas → se piden, sin tarjetas.
    const empty = await show({});
    assert.ok(empty.includes(t('pickDates')) && !empty.includes(`/${locale}/panel/vender/pa`));
    // Nada libre → mensaje propio.
    const none = await show({ start, end, guests: '99' });
    assert.ok(none.includes(t('empty')) && !none.includes(`/${locale}/panel/vender/pa`));

    // Layout: «Vender» en el panel; barra inferior solo en móvil, con accesos por rol; el menú de siempre solo en md+.
    const own = render(await layout({ params, children: null }));
    assert.ok(own.includes(`href="/${locale}/panel/vender"`));
    const bar = own.slice(own.indexOf('data-mobile-nav'));
    assert.ok(own.includes('data-mobile-nav') && /data-mobile-nav[^>]*md:hidden/.test(own));
    for (const href of ['/panel/vender', '/panel/calendario', '/panel/consultas']) assert.ok(bar.includes(`href="/${locale}${href}"`), href);
    assert.ok(bar.includes(t('more')));
    assert.ok(/<nav[^>]*hidden md:flex/.test(own), 'el menú de escritorio se oculta en móvil');
    setSession({ user: { id: 'admin' } });
    const admin = render(await layout({ params, children: null }));
    const adminBar = admin.slice(admin.indexOf('data-mobile-nav'));
    for (const href of ['/panel/vender', '/admin/calendario', '/panel/reservas']) assert.ok(adminBar.includes(`href="/${locale}${href}"`), href);
    assert.ok(!admin.includes(`/${locale}/panel/consultas`), 'el ADMIN no tiene «Consultas» hoy');
    // ADMIN ve también la casa de 'b'.
    assert.ok((await show({ start, end })).includes(title('pb')));
    console.log(locale + ': búsqueda del vendedor, tarjetas, avisos y barra móvil OK');
  }
  memory.close();
}
main().catch(error => { console.error(error); process.exitCode = 1; });
