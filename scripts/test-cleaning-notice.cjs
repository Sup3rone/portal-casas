// T-4683: aviso manual a limpieza por WhatsApp (wa.me) — utilidad, validación, API y calendario.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { load, memory, req, mockModule, setSession } = require('./test-property-access.cjs');
const React = req('react');
let hooks, index, locale = 'es';
mockModule('react', { ...React, useState(initial) {
  const slot = index++;
  if (!(slot in hooks)) hooks[slot] = typeof initial === 'function' ? initial() : initial;
  return [hooks[slot], value => { hooks[slot] = typeof value === 'function' ? value(hooks[slot]) : value; }];
} });
mockModule('next-intl', { useLocale: () => locale, useTranslations: namespace => req('next-intl').createTranslator({ locale, namespace, messages: JSON.parse(fs.readFileSync('apps/web/messages/' + locale + '.json', 'utf8')), onError: error => { throw error; } }) });
mockModule('@/i18n/navigation', { useRouter: () => ({ refresh() {} }) });
const lib = load('apps/web/src/lib/cleaning-notice.ts');
const { default: Board } = load('apps/web/src/components/CalendarBoard.tsx');
const booking = load('apps/web/src/app/api/bookings/create/route.ts');
const property = load('apps/web/src/app/api/properties/[id]/route.ts');

// Utilidad
assert.equal(lib.cleaningNoticeHref('5215512345678', 'Hola & adiós'), 'https://wa.me/5215512345678?text=Hola%20%26%20adi%C3%B3s');
for (const bad of ['', '+5215512345678', '123', 'abc12345678']) assert.equal(lib.cleaningNoticeHref(bad, 'x'), null, bad);
assert.equal(lib.isCleaningNoticeBooking({ source: 'manual' }), true);
assert.equal(lib.isCleaningNoticeBooking({ source: 'airbnb' }), true);
assert.equal(lib.isCleaningNoticeBooking({ source: 'host-block', manualBlock: true }), false);
assert.equal(lib.isCleaningNoticeBooking({ source: 'manual', manualBlock: true }), false, 'Bloqueo manual (BlockDate) no avisa');
assert.match(lib.noticeDate('2027-03-01', 'es'), /1/, 'Sin desfase de zona horaria');
assert.ok(!lib.noticeDate('2027-03-01', 'es').includes('28'), 'No retrocede al 28 de febrero');

const json = (body, method = 'POST') => new Request('http://localhost/test', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
const ctx = id => ({ params: Promise.resolve({ id }) });
(async () => {
  try {
    setSession({ user: { id: 'admin' } });
    // Validación del número en la propiedad
    for (const bad of ['abc', '+5215512345678', '1234567', '1234567890123456']) assert.equal((await property.PATCH(json({ cleaningWhatsapp: bad }, 'PATCH'), ctx('pa'))).status, 400, bad);
    assert.equal((await property.PATCH(json({ cleaningWhatsapp: '5215512345678' }, 'PATCH'), ctx('pa'))).status, 200);
    assert.equal(memory.prepare('SELECT "cleaningWhatsapp" v FROM "Property" WHERE id = ?').get('pa').v, '5215512345678');

    // La API de confirmación devuelve los datos del aviso solo si la casa tiene número
    let res = await booking.POST(json({ propertyId: 'pa', startDate: '2027-05-01', endDate: '2027-05-04' }));
    assert.equal(res.status, 200); const body = await res.json();
    assert.equal(body.cleaningNotice.phone, '5215512345678'); assert.equal(body.cleaningNotice.property, 'pa');
    assert.deepEqual(Object.keys(body.cleaningNotice).sort(), ['location', 'phone', 'property'], 'Sin datos del huésped');
    res = await booking.POST(json({ propertyId: 'pb', startDate: '2027-05-01', endDate: '2027-05-04' }));
    assert.equal((await res.json()).cleaningNotice, null, 'Sin número, sin aviso');
    setSession({ user: { id: 'b' } });
    assert.equal((await booking.POST(json({ propertyId: 'pa', startDate: '2027-06-01', endDate: '2027-06-04' }))).status, 404, 'Otra colaboradora no obtiene el número');
    setSession({ user: { id: 'admin' } });
    assert.equal((await property.PATCH(json({ cleaningWhatsapp: null }, 'PATCH'), ctx('pa'))).status, 200, 'Se puede vaciar');

    // Calendario: enlace solo en reservas reales y solo si hay número
    const find = (node, predicate, out = []) => { if (!node || typeof node !== 'object') return out; if (predicate(node)) out.push(node); for (const child of [node.props?.children].flat(Infinity)) find(child, predicate, out); return out; };
    const bookings = [
      { id: 'r', propertyId: 'pa', source: 'manual', start: '2027-03-01', end: '2027-03-04', manualBlock: false, ownBlock: false, guestName: 'Ana' },
      { id: 'h', propertyId: 'pa', source: 'host-block', start: '2027-03-01', end: '2027-03-04', manualBlock: true, ownBlock: false, guestName: null },
    ];
    for (const lang of ['es', 'en', 'fr']) {
      locale = lang; hooks = {};
      const props = phone => ({ propiedades: [{ id: 'pa', slug: 'casa', title: 'Casa Azul', cleaningWhatsapp: phone, state: 'Jalisco', destinationCity: 'Puerto Vallarta' }], bookings });
      index = 0; Board(props('5215512345678'));
      hooks[0] = new Date(2027, 2, 1); hooks[4] = { id: 'pa', day: '2027-03-02' }; // month y detail (orden de useState en CalendarBoard)
      index = 0; let tree = Board(props('5215512345678'));
      const links = find(tree, n => n.type === 'a' && String(n.props.href).startsWith('https://wa.me/'));
      assert.equal(links.length, 1, lang + ': un aviso para la reserva, ninguno para el bloqueo');
      const text = decodeURIComponent(links[0].props.href.split('text=')[1]);
      assert.ok(text.includes('Casa Azul') && text.includes('Puerto Vallarta') && !text.includes('Ana'), lang + ': casa y ciudad, sin huésped: ' + text);
      assert.equal(links[0].props.rel, 'noopener noreferrer');
      index = 0; tree = Board(props(null));
      assert.equal(find(tree, n => n.type === 'a' && String(n.props.href).startsWith('https://wa.me/')).length, 0, lang + ': sin número no hay enlace');
    }
    console.log('OK aviso a limpieza: wa.me con texto codificado y teléfono validado, solo reservas reales, fechas sin desfase, validación 400/200/vaciar, API devuelve casa/ubicación sin huésped y solo a quien gestiona, calendario es/en/fr con y sin número.');
  } finally { memory.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
