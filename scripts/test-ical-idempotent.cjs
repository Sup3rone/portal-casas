// T-4680: sync iCal idempotente — el mismo feed dos veces deja una sola reserva por UID.
const fs = require('node:fs'), assert = require('node:assert/strict');
const { load, memory, mockModule, setSession } = require('./test-property-access.cjs');
const lib = load('apps/web/src/lib/ical-sync.ts');

// Normalización pura
const dateOnly = d => Object.assign(new Date(d), { dateOnly: true });
assert.equal(lib.icalDay(dateOnly(new Date(2027, 2, 1))), '2027-03-01', 'Día completo usa la fecha local, no UTC');
assert.equal(lib.icalDay(new Date('2027-03-01T23:30:00Z')), '2027-03-01');
assert.equal(lib.isCalendar({}), false, 'HTML/error parsea a {}: no es calendario');
assert.equal(lib.isCalendar({ vcalendar: { type: 'VCALENDAR' } }), true, 'Calendario vacío válido');
const parsed = {
  vcalendar: { type: 'VCALENDAR' },
  a: { type: 'VEVENT', uid: 'a@airbnb.com', start: dateOnly(new Date(2027, 2, 1)), end: dateOnly(new Date(2027, 2, 5)) },
  c: { type: 'VEVENT', uid: 'c@airbnb.com', status: 'cancelled', start: dateOnly(new Date(2027, 2, 8)), end: dateOnly(new Date(2027, 2, 9)) },
  r: { type: 'VEVENT', uid: 'r@x', recurrenceid: new Date('2027-04-01T00:00:00Z'), start: new Date('2027-04-02T10:00:00Z'), end: new Date('2027-04-03T10:00:00Z') },
  n: { type: 'VEVENT', start: new Date('2027-05-01T00:00:00Z'), end: new Date('2027-05-02T00:00:00Z') },
  bad: { type: 'VEVENT', uid: 'bad' },
};
assert.deepEqual(lib.feedEvents(parsed), [
  { uid: 'a@airbnb.com', startDate: '2027-03-01', endDate: '2027-03-05' },
  { uid: 'r@x|2027-04-01T00:00:00.000Z', startDate: '2027-04-02', endDate: '2027-04-03' },
  { uid: 'nouid:2027-05-01:2027-05-02', startDate: '2027-05-01', endDate: '2027-05-02' },
], 'Cancelados fuera; RECURRENCE-ID en la clave; sin UID clave estable; sin fecha se ignora');

// Endpoint con BD en memoria
const ev = (uid, start, end, extra = {}) => ({ type: 'VEVENT', uid, start: dateOnly(new Date(start + 'T00:00:00')), end: dateOnly(new Date(end + 'T00:00:00')), ...extra });
const feeds = { fa: null, fb: null };
mockModule('node-ical', { fromURL: async url => { const value = feeds[url]; if (value instanceof Error) throw value; return value; } });
const sync = load('apps/web/src/app/api/ical/sync/idempotent-test.ts', fs.readFileSync('apps/web/src/app/api/ical/sync/route.ts', 'utf8'));
const rows = feed => memory.prepare(`SELECT id, "icalUid" uid, "startDate" s, "endDate" e, source FROM "Booking" WHERE "icalFeedId" = ? ORDER BY "startDate", "icalUid"`).all(feed).map(r => ({ ...r }));
const run = async () => { const res = await sync.POST(); return { status: res.status, body: await res.json() }; };
const insert = row => memory.prepare(`INSERT INTO "Booking" (${Object.keys(row).map(k => `"${k}"`).join(',')}) VALUES (${Object.keys(row).map(() => '?').join(',')})`).run(...Object.values(row));

(async () => {
  try {
    setSession({ user: { id: 'admin' } });
    // Filas antiguas (antes del fix): duplicadas y sin UID; y reservas propias que no se tocan.
    insert({ id: 'old1', propertyId: 'pa', icalFeedId: 'fa', startDate: '2027-03-01', endDate: '2027-03-05', source: 'airbnb' });
    insert({ id: 'old2', propertyId: 'pa', icalFeedId: 'fa', startDate: '2027-03-01', endDate: '2027-03-05', source: 'airbnb' });
    insert({ id: 'own', propertyId: 'pa', startDate: '2027-03-20', endDate: '2027-03-22', source: 'manual' });
    insert({ id: 'host', propertyId: 'pa', startDate: '2027-03-25', endDate: '2027-03-26', source: 'host-block' });

    feeds.fa = { vcalendar: { type: 'VCALENDAR' }, r1: ev('r1@airbnb.com', '2027-03-01', '2027-03-05'), b1: ev('b1@airbnb.com', '2027-03-10', '2027-03-12') };
    feeds.fb = { vcalendar: { type: 'VCALENDAR' } };
    let out = await run();
    assert.equal(out.status, 200); assert.equal(out.body.synced, 2); assert.equal(out.body.removed, 2, 'Retira las filas antiguas sin UID');
    const first = rows('fa');
    assert.deepEqual(first.map(r => [r.uid, r.s, r.e]), [['r1@airbnb.com', '2027-03-01', '2027-03-05'], ['b1@airbnb.com', '2027-03-10', '2027-03-12']]);

    // EL CASO DEL BUG: mismo feed dos veces → una sola reserva por UID, mismas filas.
    out = await run();
    assert.equal(out.body.removed, 0); assert.deepEqual(rows('fa'), first, 'Segundo sync idéntico no duplica ni cambia ids');
    out = await run(); assert.equal(rows('fa').length, 2, 'Tercer sync igual');

    // Reserva movida (mismo UID): se actualiza la misma fila, no se crea otra.
    feeds.fa.r1 = ev('r1@airbnb.com', '2027-03-02', '2027-03-06');
    await run(); const moved = rows('fa');
    assert.equal(moved.length, 2); const r1 = moved.find(r => r.uid === 'r1@airbnb.com');
    assert.equal(r1.id, first.find(r => r.uid === 'r1@airbnb.com').id); assert.deepEqual([r1.s, r1.e], ['2027-03-02', '2027-03-06']);

    // Cancelada y retirada del feed: desaparecen del calendario.
    feeds.fa = { vcalendar: { type: 'VCALENDAR' }, r1: ev('r1@airbnb.com', '2027-03-02', '2027-03-06', { status: 'CANCELLED' }) };
    out = await run(); assert.equal(out.body.removed, 2); assert.deepEqual(rows('fa'), [], 'Cancelada y ausente se retiran');

    // Feed caído (error o página HTML): no se borra nada de ese feed.
    feeds.fa = { vcalendar: { type: 'VCALENDAR' }, r2: ev('r2@airbnb.com', '2027-04-01', '2027-04-04') };
    await run(); const kept = rows('fa');
    for (const down of [new Error('timeout'), {}, null]) {
      feeds.fa = down; out = await run();
      assert.equal(out.status, 200, 'Otro feed sí se leyó'); assert.equal(out.body.failedFeeds, 1); assert.deepEqual(rows('fa'), kept, 'Feed caído conserva sus fechas');
    }
    feeds.fb = new Error('down'); out = await run(); assert.equal(out.status, 502, 'Ningún feed legible'); assert.deepEqual(rows('fa'), kept);

    // Calendario vacío válido: no hay reservas → se retiran todas las del feed.
    feeds.fa = { vcalendar: { type: 'VCALENDAR' } }; feeds.fb = { vcalendar: { type: 'VCALENDAR' } };
    await run(); assert.deepEqual(rows('fa'), []);

    // Reservas propias y bloqueos nunca se tocan.
    assert.equal(memory.prepare(`SELECT count(*) n FROM "Booking" WHERE id IN ('own', 'host')`).get().n, 2);

    // Colaborador: solo reconcilia sus feeds; el ajeno queda intacto.
    feeds.fa = { vcalendar: { type: 'VCALENDAR' }, x: ev('x@airbnb.com', '2027-06-01', '2027-06-03') };
    feeds.fb = { vcalendar: { type: 'VCALENDAR' }, y: ev('y@airbnb.com', '2027-06-01', '2027-06-03') };
    setSession({ user: { id: 'a' } }); await run();
    assert.deepEqual(rows('fa').map(r => r.uid), ['x@airbnb.com']); assert.deepEqual(rows('fb'), [], 'Feed de otra propietaria intacto');

    console.log('OK iCal idempotente: mismo feed 2-3 veces = 1 fila por UID e ids estables; movida actualiza; cancelada/ausente se retiran; filas antiguas sin UID se reemplazan; feed caído/HTML conserva fechas; 502 si ninguno; vacío válido limpia; manual/host-block intactos; scoping de colaborador; fechas de día completo y RECURRENCE-ID.');
  } finally { memory.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
