// T-4739 (añadido): calendarios iCal por propiedad desde el panel — validación de enlace (anti-SSRF básico),
// permisos, alta/edición/quitar (sin borrar datos capturados), mapeo de origen al sincronizar y vista.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { load, memory, setSession } = require('./test-property-access.cjs');

const lib = load('apps/web/src/lib/ical-feeds.ts');
const { maskIcalUrl } = load('apps/web/src/components/panel/IcalFeedsEditor.tsx');
const list = load('apps/web/src/app/api/properties/[id]/ical-feeds/route.ts');
const item = load('apps/web/src/app/api/properties/[id]/ical-feeds/[feedId]/route.ts');
const sync = load('apps/web/src/app/api/ical/sync/route.ts');

const json = (body, method = 'POST') => new Request('http://localhost/x', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
const ctx = (id, feedId) => ({ params: Promise.resolve(feedId ? { id, feedId } : { id }) });
const AIRBNB = 'https://www.airbnb.mx/calendar/ical/123456.ics?s=secrettoken987';
const feedsOf = propertyId => memory.prepare('SELECT * FROM "IcalFeed" WHERE "propertyId" = ? ORDER BY id').all(propertyId);

(async () => {
  try {
    // 1. Enlace: https público; webcal:// se normaliza; nada interno.
    assert.equal(lib.validateIcalUrl(AIRBNB), AIRBNB);
    assert.equal(lib.validateIcalUrl('webcal://calendar.google.com/calendar/ical/x/basic.ics'), 'https://calendar.google.com/calendar/ical/x/basic.ics');
    assert.equal(lib.validateIcalUrl('  https://admin.booking.com/hotel/ical.html?t=abc  '), 'https://admin.booking.com/hotel/ical.html?t=abc');
    for (const bad of ['http://www.airbnb.mx/x.ics', 'https://localhost/x.ics', 'https://127.0.0.1/x.ics', 'https://[::1]/x.ics', 'https://169.254.169.254/latest',
      'https://intranet/x.ics', 'https://cal.example.com:8080/x.ics', 'https://user:pw@cal.example.com/x.ics', 'https://srv.local/x.ics', 'https://db.internal/x',
      'javascript:alert(1)', 'ftp://a.b/c', '', '   ', null, 42, 'https://a.b/' + 'x'.repeat(2001)]) {
      assert.equal(lib.validateIcalUrl(bad), null, String(bad).slice(0, 60));
    }
    assert.deepEqual(['airbnb', 'booking', 'vrbo', 'other', 'google', 'MANUAL', 'cualquiera'].map(lib.bookingSourceFor),
      ['airbnb', 'booking', 'vrbo', 'other', 'google', 'google', 'google'], 'Feeds antiguos siguen como google');
    assert.equal(maskIcalUrl(AIRBNB), 'www.airbnb.mx/…ken987', 'El token no se muestra completo');
    assert.ok(!maskIcalUrl(AIRBNB).includes('secrettoken'));

    // 2. Permisos: sin sesión 401, cliente 403, colaboradora ajena 404.
    for (const [id, status] of [[null, 401], ['client', 403]]) {
      setSession(id ? { user: { id } } : null);
      assert.equal((await list.POST(json({ url: AIRBNB }), ctx('pa'))).status, status);
      assert.equal((await list.GET(new Request('http://localhost/x'), ctx('pa'))).status, status);
    }
    setSession({ user: { id: 'b' } });
    assert.equal((await list.POST(json({ url: AIRBNB }), ctx('pa'))).status, 404, 'b no gestiona pa');
    assert.equal((await item.PATCH(json({ url: AIRBNB }, 'PATCH'), ctx('pa', 'fa'))).status, 404);
    assert.equal((await item.DELETE(new Request('http://localhost/x', { method: 'DELETE' }), ctx('pa', 'fa'))).status, 404);

    // 3. Alta (dueña), duplicado, inválido y tope.
    setSession({ user: { id: 'a' } });
    let res = await list.POST(json({ url: AIRBNB, source: 'airbnb' }), ctx('pa'));
    assert.equal(res.status, 201); const added = await res.json();
    assert.equal((await list.POST(json({ url: AIRBNB }), ctx('pa'))).status, 409, 'Mismo enlace dos veces');
    res = await list.POST(json({ url: 'http://x.mx/a.ics' }), ctx('pa'));
    assert.equal(res.status, 400); assert.equal((await res.json()).code, 'INVALID_ICAL_URL');
    assert.equal((await list.POST(json({ url: 'https://cal.example.com/b.ics', source: 'inventado' }), ctx('pa'))).status, 201);
    assert.equal(feedsOf('pa').find(f => f.url === 'https://cal.example.com/b.ics').source, 'other', 'Origen desconocido → other');
    for (let i = 0; i < 2; i++) assert.equal((await list.POST(json({ url: `https://cal.example.com/c${i}.ics` }), ctx('pa'))).status, 201);
    assert.equal(feedsOf('pa').length, 5, 'fa (sembrado) + 4');
    assert.equal((await list.POST(json({ url: 'https://cal.example.com/sobra.ics' }), ctx('pa'))).status, 400, 'Máximo 5 por propiedad');
    const listed = await (await list.GET(new Request('http://localhost/x'), ctx('pa'))).json();
    assert.equal(listed.feeds.length, 5); assert.ok(listed.feeds.every(f => typeof f.imported === 'number'));

    // 4. Editar: cambia enlace y plataforma; solo feeds de la propiedad.
    assert.equal((await item.PATCH(json({ url: 'https://admin.booking.com/ical/casa.ics', source: 'booking' }, 'PATCH'), ctx('pa', added.id))).status, 200);
    assert.deepEqual([feedsOf('pa').find(f => f.id === added.id).url, feedsOf('pa').find(f => f.id === added.id).source], ['https://admin.booking.com/ical/casa.ics', 'booking']);
    assert.equal((await item.PATCH(json({ url: AIRBNB }, 'PATCH'), ctx('pa', 'fb'))).status, 404, 'fb es de pb');
    assert.equal((await item.PATCH(json({ url: 'https://localhost/x' }, 'PATCH'), ctx('pa', added.id))).status, 400);

    // 5. Sincronizar: el origen del feed llega a Booking.source.
    memory.prepare('DELETE FROM "IcalFeed" WHERE "propertyId" = ? AND id <> ?').run('pa', added.id);
    res = await sync.POST();
    assert.equal(res.status, 200);
    const imported = memory.prepare('SELECT * FROM "Booking" WHERE "icalFeedId" = ?').all(added.id);
    assert.equal(imported.length, 1); assert.equal(imported[0].source, 'booking', 'Booking.com, no «google»');

    // 6. Quitar: borra el feed y sus fechas importadas, salvo que tengan datos capturados (409, nada cambia).
    memory.prepare('UPDATE "Booking" SET "rentAmount" = ? WHERE id = ?').run('3000.00', imported[0].id);
    const del = () => item.DELETE(new Request('http://localhost/x', { method: 'DELETE' }), ctx('pa', added.id));
    assert.equal((await del()).status, 409, 'Con desglose capturado no se quita');
    assert.equal(feedsOf('pa').length, 1); assert.equal(memory.prepare('SELECT count(*) n FROM "Booking" WHERE "icalFeedId" = ?').get(added.id).n, 1);
    memory.prepare('UPDATE "Booking" SET "rentAmount" = NULL WHERE id = ?').run(imported[0].id);
    res = await del();
    assert.equal(res.status, 200); assert.equal((await res.json()).removedDates, 1);
    assert.equal(feedsOf('pa').length, 0); assert.equal(memory.prepare('SELECT count(*) n FROM "Booking" WHERE "icalFeedId" = ?').get(added.id).n, 0);
    assert.equal((await del()).status, 404);

    // 7. La ficha de la propiedad monta el editor (dentro de los recursos que se ocultan en renta anual).
    const pageSource = fs.readFileSync('apps/web/src/app/[locale]/panel/propiedades/[id]/page.tsx', 'utf8');
    assert.match(pageSource, /<AvailabilityEditor[^\n]*\r?\n\s*<IcalFeedsEditor propertyId=\{id\} feeds=\{feeds\} notice=\{icalNotice\} \/>\r?\n\s*<\/RentalTypeResources>/);
    assert.match(fs.readFileSync('apps/web/src/app/api/ical/sync/route.ts', 'utf8'), /const source = bookingSourceFor\(feed\.source\)/);
    const es = JSON.parse(fs.readFileSync('apps/web/messages/es.json', 'utf8'));
    for (const lang of ['en', 'fr']) {
      const other = JSON.parse(fs.readFileSync(`apps/web/messages/${lang}.json`, 'utf8'));
      assert.deepEqual(Object.keys(other.icalFeeds).sort(), Object.keys(es.icalFeeds).sort(), lang);
      assert.ok(other.panel.invalidIcalUrl, `${lang}.panel.invalidIcalUrl`);
    }
    // 8. Crear propiedad + calendario en un paso.
    const { airbnbListingId, provisionalTitle } = load('apps/web/src/lib/ical-link.ts');
    assert.equal(airbnbListingId('https://www.airbnb.mx/calendar/ical/1234567890123456789.ics?t=abcdef'), '1234567890123456789', 'Formato real verificado (con ?t=)');
    assert.equal(airbnbListingId('webcal://www.airbnb.com/calendar/ical/42424.ics?s=x'), '42424');
    for (const other of ['https://admin.booking.com/ical/1.ics', 'https://evilairbnb.com/calendar/ical/1.ics', 'https://www.airbnb.mx/rooms/123', 'no-url']) assert.equal(airbnbListingId(other), null, other);
    assert.equal(provisionalTitle('42424'), 'Airbnb · anuncio 42424');
    const create = load('apps/web/src/app/api/properties/route.ts');
    const values = { titleEs: 'Casa iCal', titleEn: 'iCal home', titleFr: 'Logement iCal', descEs: 'D', descEn: 'D', descFr: 'D', address: 'Calle 1', city: 'X',
      maxGuests: 4, bedrooms: 2, bathrooms: 1, baseWeekdayPrice: 1000, baseWeekendPrice: 1500, lat: null, lng: null, rentalType: 'nocturna' };
    const countProps = () => memory.prepare('SELECT count(*) n FROM "Property"').get().n;
    setSession({ user: { id: 'a' } });
    let before = countProps();
    res = await create.POST(json({ ...values, icalUrl: 'https://localhost/x.ics' }));
    assert.equal(res.status, 400, 'Enlace inválido'); assert.equal((await res.json()).code, 'INVALID_ICAL_URL');
    assert.equal(countProps(), before, 'Con enlace inválido NO se crea la propiedad');
    res = await create.POST(json({ ...values, icalUrl: AIRBNB, icalSource: 'airbnb' }));
    assert.equal(res.status, 201);
    const createdWithFeed = await res.json();
    assert.equal(createdWithFeed.icalRequested, true); assert.ok(createdWithFeed.icalFeedId);
    assert.deepEqual(feedsOf(createdWithFeed.id).map(f => [f.url, f.source]), [[AIRBNB, 'airbnb']]);
    assert.equal(memory.prepare('SELECT "ownerId" o FROM "Property" WHERE id = ?').get(createdWithFeed.id).o, 'a', 'Dueña: quien la crea');
    res = await create.POST(json({ ...values, rentalType: 'anual', icalUrl: AIRBNB }));
    const annual = await res.json();
    assert.equal(res.status, 201); assert.equal(annual.icalRequested, false); assert.equal(feedsOf(annual.id).length, 0, 'Renta anual: sin calendario');
    res = await create.POST(json(values));
    const plain = await res.json();
    assert.deepEqual([res.status, plain.icalRequested, plain.icalFeedId], [201, false, null], 'Sin enlace, alta normal');
    const form = fs.readFileSync('apps/web/src/components/panel/PropertyForm.tsx', 'utf8');
    assert.match(form, /if \(!property && icalUrl\.trim\(\)\) \{ body\.icalUrl = icalUrl\.trim\(\); body\.icalSource = icalSource; \}/, 'Solo en el alta');
    assert.match(form, /router\.push\(`\/panel\/propiedades\/\$\{result\.id\}\$\{ical \? `\?ical=\$\{ical\}` : ''\}`\)/);
    assert.match(fs.readFileSync('apps/web/src/app/[locale]/panel/nueva/page.tsx', 'utf8'), /<PropertyRentalType initial="nocturna"><PropertyForm \/><\/PropertyRentalType>/);
    console.log('OK calendarios iCal: alta con la propiedad, enlace validado, permisos, alta/edición/quitar sin perder datos, origen al sincronizar.');
  } catch (error) { console.error(error); process.exit(1); }
})();
