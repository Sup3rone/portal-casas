// T-4739: sincronización automática de calendarios iCal — cron diario único (Hobby) con reporte mensual el día 1,
// refresco ANTES de una consulta pública (bloquea fechas recién reservadas en Airbnb, nunca bloquea la consulta),
// límite de tiempo, estado por calendario y avisos en el panel.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { load, memory, mockModule, portal, setSession } = require('./test-property-access.cjs');
// SQLite: jsonb_array_length → json_array_length (solo para este test).
const query = portal.db.$client.query;
portal.db.$client.query = (sql, values, options) => query(sql.replace(/jsonb_array_length/g, 'json_array_length'), values, options);

// Calendario simulado por URL (los feeds sembrados del arnés tienen url 'fa' y 'fb').
const calendars = {}, downloads = [];
const ev = (uid, start, end) => ({ type: 'VEVENT', uid, start: Object.assign(new Date(`${start}T00:00:00`), { dateOnly: true }), end: Object.assign(new Date(`${end}T00:00:00`), { dateOnly: true }) });
mockModule('node-ical', { fromURL: async url => {
  downloads.push(url);
  const value = calendars[url];
  if (value === 'hang') return new Promise(() => {}); // Airbnb no responde
  if (value instanceof Error) throw value;
  return value ?? { vcalendar: { type: 'VCALENDAR' } };
} });
mockModule('@/lib/mailer', { sendEmail: async () => {} });

const runner = load('apps/web/src/lib/ical-sync-runner.ts');
const daily = load('apps/web/src/app/api/cron/daily/route.ts');
const inquiry = load('apps/web/src/app/api/messages/route.ts');
const { feedHealth, STALE_MS } = load('apps/web/src/components/panel/IcalFeedsEditor.tsx');
const feed = id => memory.prepare('SELECT * FROM "IcalFeed" WHERE id = ?').get(id);
const imported = feedId => memory.prepare('SELECT "startDate" s, "endDate" e FROM "Booking" WHERE "icalFeedId" = ? ORDER BY "startDate"').all(feedId).map(r => [r.s, r.e]);
let ip = 0;
const send = (propertyId, startDate, endDate) => {
  const form = new FormData();
  for (const [key, value] of Object.entries({ propertyId, name: 'Guest', email: 'guest@test.invalid', startDate, endDate, guests: '1', body: 'Hola' })) form.set(key, value);
  return inquiry.POST(new Request('http://localhost/api/messages', { method: 'POST', headers: { 'x-forwarded-for': `10.9.0.${++ip}` }, body: form }));
};
const call = (auth, qs = '') => daily.GET(new Request(`http://localhost/api/cron/daily${qs}`, { headers: auth ? { authorization: auth } : {} }));
const AUTH = 'Bearer secreto-diario-de-prueba-1234';

(async () => {
  try {
    // 1. Un solo cron diario en vercel.json (Hobby).
    assert.deepEqual(JSON.parse(fs.readFileSync('apps/web/vercel.json', 'utf8')).crons, [{ path: '/api/cron/daily', schedule: '0 12 * * *' }]);

    // 2. Cron: secreto obligatorio; sincroniza todos los feeds; reporte mensual solo el día 1 (hora MX).
    delete process.env.CRON_SECRET;
    assert.equal((await call(AUTH)).status, 401, 'Sin CRON_SECRET: cerrado');
    process.env.CRON_SECRET = AUTH.slice(7);
    assert.equal((await call()).status, 401);
    assert.equal((await call(AUTH, '?today=2026-13-01')).status, 400);
    calendars.fa = { vcalendar: { type: 'VCALENDAR' }, a1: ev('a1', '2027-07-10', '2027-07-12') };
    calendars.fb = new Error('ENOTFOUND');
    let res = await call(AUTH, '?today=2026-11-15');
    let body = await res.json();
    assert.equal(res.status, 200);
    assert.deepEqual([body.ical.feeds, body.ical.failedFeeds, body.ical.failed[0].feedId, body.ical.failed[0].error], [2, 1, 'fb', 'FETCH_FAILED']);
    assert.equal(body.monthlyReport, undefined, 'Día 15: sin reporte mensual');
    assert.deepEqual(imported('fa'), [['2027-07-10', '2027-07-12']]);
    assert.ok(feed('fa').lastSyncedAt && !feed('fa').lastError, 'Estado OK guardado');
    assert.deepEqual([Boolean(feed('fb').lastSyncedAt), feed('fb').lastError], [false, 'FETCH_FAILED'], 'Fallo registrado, fechas intactas');
    body = await (await call(AUTH, '?today=2026-12-01')).json();
    assert.equal(body.monthlyReport.month, '2026-11', 'Día 1: también envía el reporte del mes anterior');
    assert.equal(body.monthlyReport.error, undefined, 'El reporte corrió sin error');
    calendars.fb = { vcalendar: { type: 'VCALENDAR' } };

    // 3. Antes de una consulta: si el calendario está viejo, se refresca y las fechas recién tomadas en Airbnb bloquean.
    memory.prepare('UPDATE "IcalFeed" SET "lastSyncedAt" = ? WHERE id = ?').run(new Date(Date.now() - 60 * 60_000).toISOString(), 'fa');
    calendars.fa = { vcalendar: { type: 'VCALENDAR' }, a1: ev('a1', '2027-07-10', '2027-07-12'), a2: ev('a2', '2027-08-01', '2027-08-05') };
    downloads.length = 0;
    res = await send('pa', '2027-08-02', '2027-08-04');
    assert.equal(res.status, 400, 'Fechas recién reservadas en Airbnb: la consulta no pasa');
    assert.deepEqual(downloads, ['fa'], 'Refrescó solo el calendario de esa casa');
    assert.deepEqual(imported('fa'), [['2027-07-10', '2027-07-12'], ['2027-08-01', '2027-08-05']]);
    // Recién sincronizado (< 10 min): no se vuelve a descargar.
    downloads.length = 0;
    assert.equal((await send('pa', '2027-09-02', '2027-09-04')).status, 201);
    assert.deepEqual(downloads, [], 'Sin descarga si se sincronizó hace menos de 10 min');

    // 4. Airbnb no responde: la consulta espera como mucho ~4 s y se guarda igual con las fechas que había.
    memory.prepare('UPDATE "IcalFeed" SET "lastSyncedAt" = NULL WHERE id = ?').run('fa');
    calendars.fa = 'hang';
    const started = Date.now();
    res = await send('pa', '2027-10-02', '2027-10-04');
    const elapsed = Date.now() - started;
    assert.equal(res.status, 201, 'La consulta no se bloquea');
    assert.ok(elapsed >= runner.INQUIRY_BUDGET_MS - 200 && elapsed < runner.INQUIRY_BUDGET_MS + 1500, `Esperó ${elapsed} ms`);
    assert.equal(feed('fa').lastError, 'TIMEOUT', 'Tiempo agotado registrado');
    assert.deepEqual(imported('fa'), [['2027-07-10', '2027-07-12'], ['2027-08-01', '2027-08-05']], 'Fechas anteriores intactas');
    // Un feed caído tampoco rompe la consulta.
    calendars.fa = new Error('ECONNRESET');
    memory.prepare('UPDATE "IcalFeed" SET "lastSyncedAt" = NULL WHERE id = ?').run('fa');
    assert.equal((await send('pa', '2027-11-02', '2027-11-04')).status, 201);
    // Propiedad anual: no se descarga nada.
    memory.prepare('UPDATE "Property" SET "rentalType" = ? WHERE id = ?').run('anual', 'pb');
    downloads.length = 0;
    assert.deepEqual(await runner.refreshPropertyCalendars('pb'), { refreshed: 0, failedFeeds: 0 });
    assert.deepEqual(downloads, []);
    memory.prepare('UPDATE "Property" SET "rentalType" = ? WHERE id = ?').run('nocturna', 'pb');

    // 5. El botón «Sincronizar ahora» sigue funcionando (gestor) y conserva su respuesta.
    calendars.fa = { vcalendar: { type: 'VCALENDAR' }, a1: ev('a1', '2027-07-10', '2027-07-12') };
    setSession({ user: { id: 'a' } });
    const button = load('apps/web/src/app/api/ical/sync/route.ts');
    res = await button.POST();
    body = await res.json();
    assert.equal(res.status, 200); assert.equal(body.synced, 1); assert.equal(body.failedFeeds, 0);
    assert.deepEqual(imported('fa'), [['2027-07-10', '2027-07-12']], 'La reserva de agosto se canceló en Airbnb → se libera');

    // 6. Panel: estado por calendario.
    const now = Date.parse('2026-11-10T12:00:00Z');
    assert.equal(feedHealth({ lastError: 'TIMEOUT', lastSyncedAt: '2026-11-10T11:00:00Z' }, now), 'error');
    assert.equal(feedHealth({ lastSyncedAt: null }, now), 'never');
    assert.equal(feedHealth({ lastSyncedAt: new Date(now - STALE_MS - 1).toISOString() }, now), 'stale');
    assert.equal(feedHealth({ lastSyncedAt: new Date(now - 60_000).toISOString() }, now), 'ok');
    const listed = await load('apps/web/src/lib/ical-feeds.ts').listIcalFeeds('pa', { id: 'a', role: 'COLLABORATOR', canPublishProperties: false });
    assert.ok(listed[0].lastSyncedAt && /^\d{4}-\d{2}-\d{2}T/.test(listed[0].lastSyncedAt), 'Fecha de última sincronización en el panel');
    for (const lang of ['es', 'en', 'fr']) {
      const t = JSON.parse(fs.readFileSync(`apps/web/messages/${lang}.json`, 'utf8'));
      for (const key of ['autoSync', 'lastSynced', 'neverSynced', 'lastFailed', 'stale']) assert.ok(t.icalFeeds[key], `${lang}.${key}`);
      assert.match(t.monthlyReport.autoIntro, /06:00/, `${lang}: hora del envío mensual actualizada`);
    }
    console.log('OK sync automático: cron diario + reporte el día 1, refresco antes de consultar (con tope de tiempo), botón y estado.');
    process.exit(0);
  } catch (error) { console.error(error); process.exit(1); }
})();
