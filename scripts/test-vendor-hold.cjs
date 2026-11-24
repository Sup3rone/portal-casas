// T-5209 (app del vendedor, Task 6): apartar = consulta + bloqueo de fechas, y liberar.
// Offline: lógica y rutas reales sobre SQLite en memoria (la carrera real contra Postgres se prueba aparte en Respaldo).
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { load, memory, req, setSession, setLocale } = require('./test-property-access.cjs');
const React = req('react');
const { renderToStaticMarkup } = req('react-dom/server');
const { NextIntlClientProvider, createTranslator } = req('next-intl');
const { holdInput, holdDates, releaseHold, propertyHolds } = load('apps/web/src/lib/vendor-hold.ts');
const { availableForVendor } = load('apps/web/src/lib/vendor-availability.ts');
const holdRoute = load('apps/web/src/app/api/panel/vender/apartar/route.ts');
const releaseRoute = load('apps/web/src/app/api/panel/vender/liberar/route.ts');
const quotePage = load('apps/web/src/app/[locale]/panel/vender/[id]/cotizar/page.tsx').default;
const propertyPage = load('apps/web/src/app/[locale]/panel/vender/[id]/page.tsx').default;
const { inquiryToday } = load('apps/web/src/lib/inquiry-validation.ts');

const insert = (table, row) => memory.prepare(`INSERT INTO "${table}" (${Object.keys(row).map(k => `"${k}"`).join(',')}) VALUES (${Object.keys(row).map(() => '?').join(',')})`).run(...Object.values(row));
const count = (table, where = '1 = 1', ...args) => memory.prepare(`SELECT count(*) n FROM "${table}" WHERE ${where}`).get(...args).n;
const admin = { id: 'admin', role: 'ADMIN', canPublishProperties: true };
const ownerA = { id: 'a', role: 'COLLABORATOR', canPublishProperties: false };
const plus = days => new Date(Date.parse(inquiryToday() + 'T00:00:00Z') + days * 86_400_000).toISOString().slice(0, 10);
const start = plus(20), end = plus(23);
const base = { propertyId: 'pa', start, end, guests: 2, name: 'Ana Cliente', phone: '5215511112222', email: 'ana@example.invalid', note: 'Llega tarde' };
const json = (body, method = 'POST') => new Request('http://localhost/test', { method, headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '198.51.100.7' }, body: typeof body === 'string' ? body : JSON.stringify(body) });

memory.prepare('UPDATE "Property" SET "maxGuests" = 6, "baseWeekdayPrice" = 1000, "baseWeekendPrice" = 1000, "rentalType" = ?').run('nocturna');
insert('Partner', { id: 'pt-a', name: 'Vendedor A', commissionPercent: '10.00', active: 1, userId: 'a', createdAt: 0, updatedAt: 0 });
insert('ReferralLink', { id: 'rl-a-pa', partnerId: 'pt-a', propertyId: 'pa', code: 'VENDEPA1', createdAt: 0, updatedAt: 0 });

async function main() {
  // 1) Validación de la entrada (servidor): fechas futuras [start,end), ≤ 365 noches, huéspedes 1..cupo, nombre y correo válidos.
  assert.deepEqual(holdInput(base), { ...base });
  assert.deepEqual(holdInput({ ...base, phone: '', email: '', note: '' }), { ...base, phone: null, email: null, note: null });
  for (const bad of [{ name: '' }, { start: plus(-1) }, { end: start }, { end: plus(20 + 366) }, { guests: 0 }, { guests: 1.5 }, { email: 'no-es-correo' }, { start: '2026-02-30' }, { note: 'x'.repeat(1001) }, { extra: 1 }, { propertyId: '' }]) {
    assert.throws(() => holdInput({ ...base, ...bad }), error => error.message === 'validation', JSON.stringify(bad));
  }

  // 2) Apartar libre → UNA consulta del vendedor y UN bloqueo ligado a ella.
  const { messageId, blockId } = await holdDates(holdInput(base), ownerA, 'es');
  const message = memory.prepare('SELECT * FROM "Message" WHERE id = ?').get(messageId);
  assert.deepEqual([message.propertyId, message.startDate, message.endDate, message.userId, message.name, message.email, message.phone, message.lang], ['pa', start, end, 'a', 'Ana Cliente', 'ana@example.invalid', '5215511112222', 'es']);
  assert.ok(message.body.includes('2') && message.body.includes('Llega tarde'), 'huéspedes y nota en la consulta');
  // Atribución: la consulta apartada lleva el referidor del vendedor (al confirmarla se congela su comisión).
  assert.deepEqual([message.referredByPartnerId, message.referralLinkId], ['pt-a', 'rl-a-pa']);
  const block = memory.prepare('SELECT * FROM "BlockDate" WHERE id = ?').get(blockId);
  assert.deepEqual([block.propertyId, block.startDate, block.endDate, block.createdBy, block.messageId], ['pa', start, end, 'a', messageId]);
  // La casa ya no sale libre en esas fechas.
  assert.ok(!(await availableForVendor({ start, end }, ownerA)).some(card => card.id === 'pa'));

  // 3) Ya no está libre (traslapa con el apartado, con un bloqueo o con una reserva) → notAvailable y nada escrito.
  const before = [count('Message'), count('BlockDate')];
  await assert.rejects(() => holdDates(holdInput({ ...base, start: plus(22), end: plus(25) }), ownerA), error => error.message === 'notAvailable');
  insert('Booking', { id: 'h-booking', propertyId: 'pa', startDate: plus(30), endDate: plus(32) });
  await assert.rejects(() => holdDates(holdInput({ ...base, start: plus(31), end: plus(33) }), ownerA), error => error.message === 'notAvailable');
  assert.deepEqual([count('Message'), count('BlockDate')], before, 'sin consulta ni bloqueo huérfanos');
  // Salida el mismo día que otra llegada → sí se puede.
  const touching = await holdDates(holdInput({ ...base, start: end, end: plus(25) }), ownerA);
  await releaseHold(touching.blockId, ownerA);

  // 4) Dos vendedores a la vez sobre el mismo rango → exactamente uno gana.
  const race = await Promise.allSettled([holdDates(holdInput({ ...base, start: plus(40), end: plus(42) }), ownerA), holdDates(holdInput({ ...base, start: plus(41), end: plus(43) }), admin)]);
  assert.equal(race.filter(result => result.status === 'fulfilled').length, 1);
  assert.equal(race.find(result => result.status === 'rejected').reason.message, 'notAvailable');
  assert.equal(count('BlockDate', '"startDate" >= ? AND "startDate" <= ?', plus(40), plus(41)), 1);

  // 5) Permisos: COLLABORATOR sobre casa ajena → 404 sin escribir; más huéspedes que el cupo → validation.
  const writes = [count('Message'), count('BlockDate')];
  await assert.rejects(() => holdDates(holdInput({ ...base, propertyId: 'pb', start: plus(50), end: plus(51) }), ownerA), error => error.status === 404);
  await assert.rejects(() => holdDates(holdInput({ ...base, guests: 7, start: plus(50), end: plus(51) }), ownerA), error => error.message === 'validation');
  assert.deepEqual([count('Message'), count('BlockDate')], writes);

  // 6) Liberar: borra el bloqueo y deja la consulta; un bloqueo manual (sin consulta) o ajeno → 404.
  insert('BlockDate', { id: 'manual', propertyId: 'pa', startDate: plus(60), endDate: plus(61), createdBy: 'a' });
  insert('BlockDate', { id: 'foreign', propertyId: 'pb', startDate: plus(60), endDate: plus(61), createdBy: 'b', messageId: 'm-b' });
  await assert.rejects(() => releaseHold('manual', ownerA), error => error.status === 404);
  await assert.rejects(() => releaseHold('foreign', ownerA), error => error.status === 404);
  await assert.rejects(() => releaseHold('no-existe', ownerA), error => error.status === 404);
  assert.deepEqual((await propertyHolds('pa', ownerA)).map(hold => [hold.blockId, hold.name]), [[blockId, 'Ana Cliente']].concat(
    memory.prepare('SELECT b.id, m.name FROM "BlockDate" b JOIN "Message" m ON m.id = b."messageId" WHERE b."propertyId" = ? AND b.id <> ? ORDER BY b."startDate"').all('pa', blockId).map(row => [row.id, row.name])));
  await releaseHold(blockId, ownerA);
  assert.equal(count('BlockDate', 'id = ?', blockId), 0);
  assert.equal(count('Message', 'id = ?', messageId), 1, 'la consulta queda');
  assert.equal(count('BlockDate', 'id = ?', 'manual'), 1);
  assert.deepEqual(await propertyHolds('pb', ownerA), [], 'no lista apartados de casas ajenas');

  // 7) Rutas: sin sesión → 401; libre → 201; ocupado → 409 conflict; inválido → 400; JSON roto → 400; liberar → 200 / 404.
  setSession(null);
  assert.equal((await holdRoute.POST(json({ ...base, start: plus(70), end: plus(71) }))).status, 401);
  setSession({ user: { id: 'a' } });
  const created = await holdRoute.POST(json({ ...base, start: plus(70), end: plus(71) }));
  assert.equal(created.status, 201);
  const { blockId: routeBlock } = await created.json();
  const taken = await holdRoute.POST(json({ ...base, start: plus(70), end: plus(71) }));
  assert.equal(taken.status, 409);
  assert.equal((await taken.json()).error, 'conflict');
  assert.equal((await holdRoute.POST(json({ ...base, name: '' }))).status, 400);
  assert.equal((await holdRoute.POST(json('{roto'))).status, 400);
  assert.equal((await holdRoute.POST(json({ ...base, propertyId: 'pb', start: plus(70), end: plus(71) }))).status, 404);
  assert.equal((await releaseRoute.POST(json({ blockId: 'manual' }))).status, 404);
  assert.equal((await releaseRoute.POST(json({ blockId: routeBlock }))).status, 200);
  assert.equal(count('BlockDate', 'id = ?', routeBlock), 0);

  // 8) Pantallas: formulario «Apartar» en la cotización libre (no si está ocupada); «Apartados» con «Liberar» en la ficha.
  const held = await holdDates(holdInput({ ...base, start: plus(80), end: plus(82) }), ownerA);
  for (const locale of ['es', 'en', 'fr']) {
    setLocale(locale);
    const messages = JSON.parse(fs.readFileSync(path.join(__dirname, '../apps/web/messages/' + locale + '.json'), 'utf8'));
    const raw = createTranslator({ locale, messages, namespace: 'vendor', onError(error) { throw error; } });
    const t = (key, values) => raw(key, values).replace(/&/g, '&amp;').replace(/'/g, '&#x27;').replace(/"/g, '&quot;');
    const render = value => renderToStaticMarkup(React.createElement(NextIntlClientProvider, { locale, messages, timeZone: 'America/Mexico_City', onError(error) { throw error; } }, value));
    const call = (page, query) => page({ params: Promise.resolve({ locale, id: 'pa' }), searchParams: Promise.resolve(query) });
    const free = render(await call(quotePage, { start: plus(90), end: plus(92), guests: '2' }));
    assert.ok(free.includes(t('hold')) && free.includes('name="name"') && free.includes('name="phone"'), 'formulario de apartar');
    const busy = render(await call(quotePage, { start: plus(80), end: plus(82) }));
    assert.ok(!busy.includes('name="name"'), 'sin apartar si ya está ocupada');
    const house = render(await call(propertyPage, {}));
    assert.ok(house.includes(t('holdsTitle')) && house.includes('Ana Cliente') && house.includes(`data-release="${held.blockId}"`), 'apartados con liberar');
    assert.ok(!house.includes('data-release="manual"'), 'un bloqueo manual no se libera desde aquí');
    console.log(locale + ': apartar y liberar en pantalla OK');
  }
  console.log('apartar = consulta + bloqueo, sin huérfanos, uno gana, permisos, liberar y rutas OK');
  memory.close();
}
main().catch(error => { console.error(error); process.exitCode = 1; });
