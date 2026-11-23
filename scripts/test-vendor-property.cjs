// T-5205 (app del vendedor, Task 4): ficha de la casa para enseñarla delante del cliente.
// Offline: monthCells (pura) + SSR real de /panel/vender/[id] en es/en/fr sobre SQLite en memoria. Sin navegador, red ni Neon.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { load, memory, req, setSession, setLocale } = require('./test-property-access.cjs');
const React = req('react');
const { renderToStaticMarkup } = req('react-dom/server');
const { NextIntlClientProvider, createTranslator } = req('next-intl');
const { monthCells } = load('apps/web/src/components/panel/vendor/MonthAvailability.tsx');
const page = load('apps/web/src/app/[locale]/panel/vender/[id]/page.tsx').default;
const { formatMoney } = load('apps/web/src/lib/booking-breakdown.ts');
const { inquiryToday } = load('apps/web/src/lib/inquiry-validation.ts');

// 1) Calendario de un mes, semana lunes-primero. Dic-2026 empieza en martes → una celda vacía delante.
const cells = monthCells(2026, 12, [{ start: '2026-12-05', end: '2026-12-09' }], { start: '2026-12-18', end: '2026-12-22' });
assert.deepEqual(cells[0], { day: null, state: 'free' });
const cell = day => cells.find(item => item.day === day);
assert.equal(cells.filter(item => item.day !== null).length, 31);
for (const day of [5, 6, 7, 8]) assert.equal(cell(day).state, 'occupied', 'día ' + day);
assert.equal(cell(9).state, 'free', 'la noche de salida de la reserva no ocupa');
for (const day of [18, 19, 20, 21]) assert.equal(cell(day).state, 'selected', 'día ' + day);
assert.equal(cell(22).state, 'checkout');
assert.equal(cell(4).state, 'free');
// Lo ocupado gana a lo elegido (no se puede enseñar como libre una noche ocupada) y feb-2027 empieza en lunes.
assert.equal(monthCells(2026, 12, [{ start: '2026-12-19', end: '2026-12-20' }], { start: '2026-12-18', end: '2026-12-22' }).find(item => item.day === 19).state, 'occupied');
const february = monthCells(2027, 2, []);
assert.deepEqual(february[0], { day: 1, state: 'free' });
assert.equal(february.length, 28);
// Una estancia que cruza de mes ocupa el principio del siguiente.
assert.equal(monthCells(2027, 1, [{ start: '2026-12-30', end: '2027-01-03' }]).find(item => item.day === 2).state, 'occupied');
console.log('monthCells: semana lunes-primero, [start,end), salida y prioridad de ocupado OK');

// 2) La página. Fechas siempre futuras (el test no caduca); base 1000 entre semana y 1000 en fin de semana.
const plus = days => new Date(Date.parse(inquiryToday() + 'T00:00:00Z') + days * 86_400_000).toISOString().slice(0, 10);
const start = plus(40), end = plus(44), busy = plus(60), busyEnd = plus(63);
const insert = (table, row) => memory.prepare(`INSERT INTO "${table}" (${Object.keys(row).map(k => `"${k}"`).join(',')}) VALUES (${Object.keys(row).map(() => '?').join(',')})`).run(...Object.values(row));
memory.prepare('DELETE FROM "SeasonRate"').run();
memory.prepare('UPDATE "Property" SET bedrooms = 3, bathrooms = 2, "maxGuests" = 6, "baseWeekdayPrice" = 1000, "baseWeekendPrice" = 1000, state = ?, "destinationCity" = ?').run('Quintana Roo', 'Cancún');
for (const id of ['pa', 'pb', 'hidden']) memory.prepare('UPDATE "Property" SET "titleEs" = ?, "titleEn" = ?, "titleFr" = ? WHERE id = ?').run(`Casa ${id}`, `House ${id}`, `Maison ${id}`, id);
insert('Booking', { id: 'v-busy', propertyId: 'pa', startDate: busy, endDate: busyEnd });
insert('BlockDate', { id: 'v-block', propertyId: 'pa', startDate: plus(70), endDate: plus(71) });
// Temporada que toca la estancia elegida (prioridad alta) y otra que no la toca.
insert('SeasonRate', { id: 'v-high', propertyId: 'pa', name: 'Alta invierno', startDate: plus(41), endDate: plus(42), weekdayPrice: 2000, weekendPrice: 2000, priority: 1 });
insert('SeasonRate', { id: 'v-other', propertyId: 'pa', name: 'Pascua lejana', startDate: plus(200), endDate: plus(210), weekdayPrice: 9000, weekendPrice: 9000, priority: 1 });
insert('Media', { id: 'v-photo', propertyId: 'pa', url: 'https://x.public.blob.vercel-storage.com/sala.jpg', type: 'PHOTO', order: 1, isCover: 0 });

async function main() {
  for (const locale of ['es', 'en', 'fr']) {
    setLocale(locale);
    const messages = JSON.parse(fs.readFileSync(path.join(__dirname, '../apps/web/messages/' + locale + '.json'), 'utf8'));
    const raw = createTranslator({ locale, messages, namespace: 'vendor', onError(error) { throw error; } });
    const t = (key, values) => raw(key, values).replace(/&/g, '&amp;').replace(/'/g, '&#x27;').replace(/"/g, '&quot;');
    const title = id => ({ es: `Casa ${id}`, en: `House ${id}`, fr: `Maison ${id}` })[locale];
    const render = value => renderToStaticMarkup(React.createElement(NextIntlClientProvider, { locale, messages, timeZone: 'America/Mexico_City', onError(error) { throw error; } }, value));
    const call = (id, query) => page({ params: Promise.resolve({ locale, id }), searchParams: Promise.resolve(query) });
    const show = async (id, query) => render(await call(id, query));

    // Sin sesión o sin rol de panel → portada; COLLABORATOR con casa ajena → 404 sin datos.
    setSession(null);
    await assert.rejects(() => call('pa', {}), error => error.message === `redirect: /${locale}`);
    setSession({ user: { id: 'client' } });
    await assert.rejects(() => call('pa', {}), error => error.message === `redirect: /${locale}`);
    setSession({ user: { id: 'a' } });
    await assert.rejects(() => call('pb', { start, end }), error => error.status === 404);
    await assert.rejects(() => call('no-existe', {}), error => error.status === 404);

    // Con fechas libres: ficha, datos, calendario de ese mes, tarifas, temporada que toca, total y «Cotizar».
    const html = await show('pa', { start, end, guests: '2' });
    assert.ok(html.includes(title('pa')));
    assert.ok(html.includes(t('specs', { bedrooms: 3, bathrooms: 2, maxGuests: 6 })));
    assert.ok(html.includes('sala.jpg'), 'galería con las fotos de la casa');
    assert.ok(html.includes(`data-day="${Number(start.slice(8))}" data-state="selected"`));
    assert.ok(html.includes(`data-day="${Number(end.slice(8))}" data-state="checkout"`) || start.slice(0, 7) !== end.slice(0, 7));
    assert.ok(html.includes(t('weekday')) && html.includes(formatMoney('1000', locale)));
    assert.ok(html.includes('Alta invierno') && !html.includes('Pascua lejana'), 'solo la temporada que toca esas fechas');
    assert.ok(html.includes(formatMoney('6000', locale)), '2 noches de temporada (2000) + 2 de base (1000)');
    assert.ok(html.includes(t('nights', { count: 4 })));
    const quoteHref = `href="/${locale}/panel/vender/pa/cotizar?start=${start}&amp;end=${end}&amp;guests=2"`;
    assert.ok(html.includes(quoteHref), 'Cotizar lleva a la cotización con las mismas fechas');
    assert.ok(html.includes(`href="/${locale}/panel/vender?start=${start}&amp;end=${end}&amp;guests=2"`), 'volver conserva la búsqueda');
    assert.ok(html.includes(`data-share-url="/${locale}/casas/pa"`), 'compartir la ficha pública de una casa publicada');
    for (const key of ['legendFree', 'legendOccupied', 'legendSelected', 'legendCheckout']) assert.ok(html.includes(t(key)), key);

    // Mes con una reserva: lo ocupado sale tachado (no solo color).
    const busyMonth = await show('pa', { month: busy.slice(0, 7) });
    assert.match(busyMonth, new RegExp(`data-day="${Number(busy.slice(8))}" data-state="occupied"[^>]*line-through`));
    assert.ok(!busyMonth.includes('/cotizar'), 'sin fechas no hay cotización');
    assert.ok(busyMonth.includes(t('pickStay')));
    // Meses anterior y siguiente conservan las fechas elegidas.
    assert.ok(busyMonth.includes(`href="/${locale}/panel/vender/pa?month=`));

    // Fechas que chocan con la reserva → aviso, sin «Cotizar».
    const clash = await show('pa', { start: busy, end: busyEnd });
    assert.ok(clash.includes(t('occupied')) && !clash.includes('/cotizar'));
    // Fechas inválidas → aviso, sin «Cotizar».
    const invalid = await show('pa', { start: end, end: start });
    assert.ok(invalid.includes(t('invalid')) && !invalid.includes('/cotizar'));
    // Mes basura → mes de las fechas o el actual, sin romper.
    assert.ok((await show('pa', { month: '2026-13' })).includes('data-state='));

    // Casa no publicada: chip «No publicada» y sin enlace público que compartir.
    const draft = await show('hidden', {});
    assert.ok(draft.includes(t('draft')) && !draft.includes('data-share-url'));

    // ADMIN abre la casa de otro dueño.
    setSession({ user: { id: 'admin' } });
    assert.ok((await show('pb', {})).includes(title('pb')));
    console.log(locale + ': ficha de la casa, calendario, tarifas, 404 ajena y avisos OK');
  }
  memory.close();
}
main().catch(error => { console.error(error); process.exitCode = 1; });
