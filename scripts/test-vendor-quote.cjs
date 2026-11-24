// T-5208 (app del vendedor, Task 5): cotización, modo cliente y texto de WhatsApp.
// Offline: vendorQuote (SQL real sobre SQLite en memoria), quoteWhatsappText (puro) y SSR de /panel/vender/[id]/cotizar.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { load, memory, req, setSession, setLocale } = require('./test-property-access.cjs');
const React = req('react');
const { renderToStaticMarkup } = req('react-dom/server');
const { NextIntlClientProvider, createTranslator } = req('next-intl');
const { vendorQuote } = load('apps/web/src/lib/vendor-quote.ts');
const { quoteWhatsappText, quoteWhatsappUrl } = load('apps/web/src/lib/vendor-share.ts');
const { quoteStay } = load('apps/web/src/lib/stay-quote.ts');
const { ClientModeView } = load('apps/web/src/components/panel/vendor/ClientModeToggle.tsx');
const page = load('apps/web/src/app/[locale]/panel/vender/[id]/cotizar/page.tsx').default;
const { formatMoney } = load('apps/web/src/lib/booking-breakdown.ts');
const { inquiryToday } = load('apps/web/src/lib/inquiry-validation.ts');

const insert = (table, row) => memory.prepare(`INSERT INTO "${table}" (${Object.keys(row).map(k => `"${k}"`).join(',')}) VALUES (${Object.keys(row).map(() => '?').join(',')})`).run(...Object.values(row));
const admin = { id: 'admin', role: 'ADMIN', canPublishProperties: true };
const ownerA = { id: 'a', role: 'COLLABORATOR', canPublishProperties: false };
const ownerB = { id: 'b', role: 'COLLABORATOR', canPublishProperties: false };
const start = '2026-12-18', end = '2026-12-22'; // vie, sáb, dom, lun → 2 entre semana + 2 de fin de semana

memory.prepare('DELETE FROM "SeasonRate"').run();
memory.prepare('UPDATE "Property" SET "baseWeekdayPrice" = 1000, "baseWeekendPrice" = 1500, "cleaningPrice" = 800, "cleaningWhatsapp" = ?').run('5215599998888');
for (const id of ['pa', 'pb', 'hidden']) memory.prepare('UPDATE "Property" SET "titleEs" = ?, "titleEn" = ?, "titleFr" = ? WHERE id = ?').run(`Casa ${id}`, `House ${id}`, `Maison ${id}`, id);
// El vendedor COLLABORATOR 'a' es también referidor (Partner ligado a su usuario) con 10 %; el de 'b' está inactivo.
insert('Partner', { id: 'pt-a', name: 'Vendedor A', commissionPercent: '10.00', active: 1, userId: 'a', createdAt: 0, updatedAt: 0 });
insert('Partner', { id: 'pt-b', name: 'Vendedor B', commissionPercent: '20.00', active: 0, userId: 'b', createdAt: 0, updatedAt: 0 });

async function main() {
  // 1) Desglose: noches por tipo, renta, limpieza, IVA 16 % sobre renta + aseo (regla vigente, T-5206) y total.
  const q = await vendorQuote('pa', start, end, ownerA);
  assert.equal(q.nights, 4);
  assert.equal(q.weekdayNights, 2);
  assert.equal(q.weekendNights, 2);
  assert.equal(q.rent, '5000.00');
  assert.equal(q.cleaning, '800.00');
  assert.equal(q.taxes, '928.00', '16 % de 5,800');
  assert.equal(q.total, '6728.00');
  assert.equal(q.overlap, false);
  assert.deepEqual(q.lines, [
    { season: null, weekend: false, nights: 2, price: 1000 },
    { season: null, weekend: true, nights: 2, price: 1500 },
  ]);
  // Comisión = renta × % del referidor ligado a quien cotiza (misma fórmula que /panel/reservas: solo sobre la renta).
  assert.deepEqual(q.commission, { percent: '10.00', amount: '500.00' });
  // Quien no es referidor (ADMIN) o tiene el referidor inactivo no ve comisión.
  assert.equal((await vendorQuote('pa', start, end, admin)).commission, null);
  assert.equal((await vendorQuote('pb', start, end, ownerB)).commission, null);

  // 2) Temporada de mayor prioridad el 19-20: esas noches cambian y salen como línea aparte; la renta cuadra con quoteStay.
  insert('SeasonRate', { id: 'q-low', propertyId: 'pa', name: 'Diciembre', startDate: '2026-12-01', endDate: '2026-12-31', weekdayPrice: 1100, weekendPrice: 1600, priority: 0 });
  insert('SeasonRate', { id: 'q-high', propertyId: 'pa', name: 'Navidad', startDate: '2026-12-19', endDate: '2026-12-20', weekdayPrice: 2000, weekendPrice: 3000, priority: 1 });
  const season = await vendorQuote('pa', start, end, ownerA);
  assert.deepEqual(season.lines, [
    { season: 'Diciembre', weekend: false, nights: 2, price: 1100 },
    { season: 'Navidad', weekend: true, nights: 2, price: 3000 },
  ]);
  assert.equal(season.rent, '8200.00');
  const seasons = memory.prepare('SELECT "startDate" start, "endDate" end, "weekdayPrice" weekday, "weekendPrice" weekend, priority FROM "SeasonRate" WHERE "propertyId" = ?').all('pa');
  assert.equal(season.rent, quoteStay(start, end, { base: { weekday: 1000, weekend: 1500 }, seasons }).total + '.00', 'misma regla que la reserva');
  memory.prepare('DELETE FROM "SeasonRate"').run();

  // 3) Limpieza sin capturar → null («por confirmar»); total = renta + IVA de la renta.
  memory.prepare('UPDATE "Property" SET "cleaningPrice" = NULL WHERE id = ?').run('pa');
  const pending = await vendorQuote('pa', start, end, ownerA);
  assert.deepEqual([pending.cleaning, pending.taxes, pending.total], [null, '800.00', '5800.00']);
  // 4) Una noche sin precio → sin renta, sin IVA y sin total (nunca $0).
  memory.prepare('UPDATE "Property" SET "baseWeekendPrice" = NULL WHERE id = ?').run('hidden');
  const noPrice = await vendorQuote('hidden', start, end, ownerA);
  assert.deepEqual([noPrice.rent, noPrice.taxes, noPrice.total, noPrice.commission], [null, null, null, null]);
  // 5) Casa ajena o fechas inválidas → null.
  assert.equal(await vendorQuote('pb', start, end, ownerA), null);
  assert.equal(await vendorQuote('pa', end, start, ownerA), null);
  assert.equal(await vendorQuote('pa', '2026-02-30', end, ownerA), null);
  // 6) Fechas que chocan con una reserva → overlap (la pantalla no deja mandarla como libre).
  insert('Booking', { id: 'q-busy', propertyId: 'pa', startDate: '2026-12-21', endDate: '2026-12-24' });
  assert.equal((await vendorQuote('pa', start, end, ownerA)).overlap, true);
  memory.prepare('DELETE FROM "Booking" WHERE id = ?').run('q-busy');
  memory.prepare('UPDATE "Property" SET "cleaningPrice" = 800 WHERE id = ?').run('pa');

  // 7) Texto de WhatsApp: casa, fechas, noches, total y enlace; NUNCA comisión ni el WhatsApp de limpieza.
  const full = await vendorQuote('pa', start, end, ownerA);
  for (const locale of ['es', 'en', 'fr']) {
    const text = quoteWhatsappText(full, { title: 'Casa Azul', publicUrl: 'https://alia.example/es/casas/azul' }, { start, end }, locale);
    assert.ok(text.includes('Casa Azul') && text.includes('https://alia.example/es/casas/azul'));
    assert.ok(text.includes(formatMoney('6728.00', locale)) && text.includes(formatMoney('800.00', locale)));
    assert.ok(text.includes('2026'), 'fechas');
    assert.ok(/\b4\b/.test(text), 'noches');
    assert.ok(!/comisi|commission/i.test(text), locale + ': sin la palabra comisión');
    assert.ok(!text.includes(formatMoney('500.00', locale)) && !text.includes('10.00'), locale + ': sin el monto ni el % de comisión');
    assert.ok(!text.includes('5215599998888'), 'sin el WhatsApp de limpieza');
    const unknown = quoteWhatsappText({ ...noPrice }, { title: 'Casa X', publicUrl: null }, { start, end }, locale);
    assert.ok(!unknown.includes('$0') && !unknown.includes('null') && !unknown.includes('undefined'), locale + ': sin precio no inventa');
  }
  const url = quoteWhatsappUrl('Hola & adiós');
  assert.equal(url, 'https://wa.me/?text=Hola%20%26%20adi%C3%B3s');

  // 8) Modo cliente: la vista pura oculta «Solo para ti» cuando está encendido.
  const view = on => renderToStaticMarkup(React.createElement(ClientModeView, { on, onToggle() {}, label: 'Modo cliente', hint: 'h' }, React.createElement('p', null, 'SECRETO')));
  assert.ok(view(false).includes('SECRETO') && view(false).includes('aria-pressed="false"'));
  assert.ok(!view(true).includes('SECRETO') && view(true).includes('aria-pressed="true"'));
  console.log('vendorQuote, WhatsApp y modo cliente OK');

  // 9) Página /cotizar en es/en/fr. Fechas futuras para que el test no caduque.
  const plus = days => new Date(Date.parse(inquiryToday() + 'T00:00:00Z') + days * 86_400_000).toISOString().slice(0, 10);
  const from = plus(30), to = plus(33);
  memory.prepare('UPDATE "Property" SET "baseWeekdayPrice" = NULL, "baseWeekendPrice" = NULL WHERE id = ?').run('hidden'); // sin precio, caiga o no en fin de semana
  for (const locale of ['es', 'en', 'fr']) {
    setLocale(locale);
    const messages = JSON.parse(fs.readFileSync(path.join(__dirname, '../apps/web/messages/' + locale + '.json'), 'utf8'));
    const raw = createTranslator({ locale, messages, namespace: 'vendor', onError(error) { throw error; } });
    const t = (key, values) => raw(key, values).replace(/&/g, '&amp;').replace(/'/g, '&#x27;').replace(/"/g, '&quot;');
    const render = value => renderToStaticMarkup(React.createElement(NextIntlClientProvider, { locale, messages, timeZone: 'America/Mexico_City', onError(error) { throw error; } }, value));
    const call = (id, query) => page({ params: Promise.resolve({ locale, id }), searchParams: Promise.resolve(query) });
    setSession(null);
    await assert.rejects(() => call('pa', { start: from, end: to }), error => error.message === `redirect: /${locale}`);
    setSession({ user: { id: 'a' } });
    await assert.rejects(() => call('pb', { start: from, end: to }), error => error.status === 404, 'casa ajena → 404');
    const html = render(await call('pa', { start: from, end: to, guests: '2' }));
    const expected = await vendorQuote('pa', from, to, ownerA);
    assert.ok(html.includes(formatMoney(expected.total, locale)), 'total');
    assert.ok(html.includes(formatMoney(expected.cleaning, locale)));
    assert.ok(html.includes(t('onlyYou')) && html.includes(formatMoney(expected.commission.amount, locale)), 'bloque «Solo para ti» visible al entrar');
    assert.ok(html.includes('aria-pressed="false"'), 'modo cliente arranca apagado');
    const wa = /href="(https:\/\/wa\.me\/\?text=[^"]+)"/.exec(html);
    assert.ok(wa, 'botón de WhatsApp');
    const sent = decodeURIComponent(wa[1].replace(/&amp;/g, '&').split('text=')[1]);
    assert.ok(!/comisi|commission/i.test(sent) && !sent.includes(formatMoney(expected.commission.amount, locale)), 'WhatsApp sin comisión');
    assert.ok(sent.includes(`/${locale}/casas/pa`), 'enlace público de la casa publicada');
    assert.ok(html.includes(`href="/${locale}/panel/vender/pa?start=${from}&amp;end=${to}&amp;guests=2"`), 'volver a la ficha');
    // Limpieza sin capturar → «por confirmar».
    memory.prepare('UPDATE "Property" SET "cleaningPrice" = NULL WHERE id = ?').run('pa');
    assert.ok(render(await call('pa', { start: from, end: to })).includes(t('cleaningPending')));
    memory.prepare('UPDATE "Property" SET "cleaningPrice" = 800 WHERE id = ?').run('pa');
    // Casa no publicada: el WhatsApp no lleva enlace público.
    const draft = render(await call('hidden', { start: from, end: to }));
    assert.ok(!decodeURIComponent(/text=([^"]+)"/.exec(draft)[1]).includes('/casas/'));
    assert.ok(draft.includes(t('noPrice')), 'sin precio');
    // Fechas inválidas u ocupadas → aviso y sin WhatsApp.
    const invalid = render(await call('pa', { start: to, end: from }));
    assert.ok(invalid.includes(t('invalid')) && !invalid.includes('wa.me'));
    insert('Booking', { id: 'q-busy2', propertyId: 'pa', startDate: from, endDate: to });
    const busy = render(await call('pa', { start: from, end: to }));
    assert.ok(busy.includes(t('occupied')) && !busy.includes('wa.me'));
    memory.prepare('DELETE FROM "Booking" WHERE id = ?').run('q-busy2');
    // ADMIN: cotiza cualquier casa, sin bloque de comisión (no es referidor).
    setSession({ user: { id: 'admin' } });
    const adminHtml = render(await call('pb', { start: from, end: to }));
    assert.ok(adminHtml.includes(formatMoney((await vendorQuote('pb', from, to, admin)).total, locale)) && !adminHtml.includes(t('onlyYou')));
    console.log(locale + ': página de cotización OK');
  }
  memory.close();
}
main().catch(error => { console.error(error); process.exitCode = 1; });
