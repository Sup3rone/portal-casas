// Validación compartida, API real y render inicial es/en/fr; sin red ni BD real.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { load, req, memory, queryLog, setLocale } = require('./test-property-access.cjs');
const { validateInquiry, inquiryToday } = load('apps/web/src/lib/inquiry-validation.ts');
const { POST } = load('apps/web/src/app/api/messages/route.ts');
const today = inquiryToday();
function day(delta) { const date = new Date(today + 'T12:00:00Z'); date.setUTCDate(date.getUTCDate() + delta); return date.toISOString().slice(0, 10); }
const valid = { name: 'Guest', email: 'guest@example.com', phone: '', startDate: day(1), endDate: day(3), guests: 2, body: 'Inquiry' };
const context = { today, maxGuests: 4, bookings: [] };
const cases = [
  ['name', '', 'nameLength'], ['name', ' A ', 'nameLength'], ['name', 'x'.repeat(101), 'nameLength'],
  ['email', '', 'emailFormat'], ['email', 'invalid', 'emailFormat'], ['email', 'x@@example.com', 'emailFormat'],
  ['phone', '555-123-4567', 'phoneFormat'], ['phone', 'abcdefg', 'phoneFormat'], ['phone', '+123', 'phoneFormat'], ['phone', '1'.repeat(16), 'phoneFormat'],
  ['startDate', '', 'startRequired'], ['startDate', day(-1), 'startPast'], ['startDate', '2027-02-30', 'dateInvalid'],
  ['endDate', '', 'endRequired'], ['endDate', day(0), 'endOrder'], ['endDate', day(1), 'endOrder'],
  ['guests', '', 'guestsRange'], ['guests', 0, 'guestsRange'], ['guests', -1, 'guestsRange'], ['guests', 1.5, 'guestsRange'], ['guests', 5, 'guestsRange'],
  ['body', '   ', 'messageRequired'],
];
for (const [field, value, code] of cases) assert.equal(validateInquiry({ ...valid, [field]: value }, context)[field], code);
assert.deepEqual(validateInquiry(valid, context), {});
assert.deepEqual(validateInquiry({ ...valid, name: 'AB', phone: '+52 555 123 4567', startDate: today, guests: 4 }, context), {});
assert.deepEqual(validateInquiry({ ...valid, name: 'x'.repeat(100), phone: null }, context), {});
assert.equal(inquiryToday(new Date('2026-10-06T05:59:00Z')), '2026-10-05');
assert.equal(inquiryToday(new Date('2026-10-06T06:00:00Z')), '2026-10-06');
const occupied = [{ startDate: day(2), endDate: day(5) }];
assert.equal(validateInquiry(valid, { ...context, bookings: occupied }).endDate, 'datesOccupied');
assert.equal(validateInquiry({ ...valid, endDate: day(2) }, { ...context, bookings: occupied }).endDate, 'datesOccupied');
assert.equal(validateInquiry({ ...valid, startDate: day(2), endDate: day(6) }, { ...context, bookings: occupied }).startDate, 'datesOccupied');
assert.deepEqual(validateInquiry({ ...valid, startDate: day(5), endDate: day(6) }, { ...context, bookings: occupied }), {});
const form = values => { const data = new FormData(); for (const [key, value] of Object.entries({ propertyId: 'pa', ...values })) data.set(key, String(value)); return data; };
const send = values => POST(new Request('http://localhost/api/messages', { method: 'POST', body: form(values) }));
const count = () => memory.prepare('SELECT count(*) AS count FROM "Message"').get().count;
async function main() {
  for (const [field, value, code] of cases.filter(([field]) => field !== 'guests')) {
    const before = count(), reads = queryLog.length;
    const response = await send({ ...valid, [field]: value });
    assert.equal(response.status, 400); assert.equal((await response.json()).fields[field], code);
    assert.equal(count(), before); assert.equal(queryLog.length, reads, 'Error sintáctico no debe consultar BD');
  }
  const before = count();
  const guests = await send({ ...valid, guests: 9, maxGuests: 999 });
  assert.equal(guests.status, 400); const limits = await guests.json(); assert.equal(limits.fields.guests, 'guestsRange'); assert.equal(limits.maxGuests, 8); assert.equal(count(), before);
  memory.prepare('INSERT INTO "Booking" (id, propertyId, startDate, endDate, source) VALUES (?, ?, ?, ?, ?)').run('occupied', 'pa', day(2), day(5), 'manual');
  const conflict = await send(valid); assert.equal(conflict.status, 400); assert.equal((await conflict.json()).fields.endDate, 'datesOccupied'); assert.equal(count(), before);
  const accepted = await send({ ...valid, startDate: day(5), endDate: day(6), guests: 8 }); assert.equal(accepted.status, 201); assert.equal(count(), before + 1);
  assert.equal((await accepted.json()).message.lang, 'es');
  for (const lang of ['en', 'fr']) {
    const response = await send({ ...valid, startDate: day(5), endDate: day(6), lang });
    assert.equal(response.status, 201);
    const { message } = await response.json();
    assert.equal(message.lang, lang);
    assert.equal(memory.prepare('SELECT lang FROM "Message" WHERE id = ?').get(message.id).lang, lang);
  }
  assert.equal((await send({ ...valid, propertyId: 'hidden', startDate: day(5), endDate: day(6) })).status, 404);
  assert.equal((await POST(new Request('http://localhost/api/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }))).status, 400);
  const React = req('react'), { renderToStaticMarkup } = req('react-dom/server'), { NextIntlClientProvider } = req('next-intl');
  const Form = load('apps/web/src/components/MessageForm.tsx').default, Provider = load('apps/web/src/components/ReservationDatesProvider.tsx').default;
  const Footer = load('apps/web/src/components/Footer.tsx').default;
  const CategorySection = load('apps/web/src/components/CategorySection.tsx').default;
  for (const locale of ['es', 'en', 'fr']) {
    setLocale(locale);
    const messages = JSON.parse(fs.readFileSync(path.join(__dirname, '../apps/web/messages/' + locale + '.json'), 'utf8'));
    const html = renderToStaticMarkup(React.createElement(NextIntlClientProvider, { locale, messages, timeZone: 'America/Mexico_City', onError(error) { throw error; } },
      React.createElement(Provider, null, React.createElement(Form, { propertyId: 'pa', locale, maxGuests: 4, pricing: { base: { weekday: 100, weekend: 200 }, seasons: [], booked: [] } }))));
    for (const key of ['nameLength', 'emailFormat', 'startRequired', 'endRequired', 'messageRequired']) assert.ok(html.includes(messages.details.form.validation[key]));
    for (const field of ['name', 'email', 'startDate', 'endDate', 'body']) assert.ok(html.includes(`id="${field}-error"`));
    assert.ok(/type="submit"[^>]*disabled/.test(html)); assert.ok(html.includes('max="4"'));
    assert.ok(html.includes(`name="lang" value="${locale}"`));
    const wrap = child => React.createElement(NextIntlClientProvider, { locale, messages, timeZone: 'America/Mexico_City', onError(error) { throw error; } }, child);
    assert.ok(renderToStaticMarkup(wrap(React.createElement(Footer))).includes(`href="/${locale}/casas"`));
    const items = [{ icon: '🛏️', label: messages.details.amenities.ropaCama }, { icon: '🛁', label: messages.details.amenities.banos }];
    const category = renderToStaticMarkup(wrap(React.createElement(CategorySection, { label: messages.details.habitaciones, items, slides: [{ url: '/test.jpg', type: 'PHOTO' }] })));
    for (const item of items) assert.ok(category.includes(item.label));
    assert.equal((category.match(/<li\b/g) ?? []).length, items.length);
    assert.equal(renderToStaticMarkup(wrap(React.createElement(CategorySection, { label: 'Empty', items, slides: [] }))), '');
    console.log(locale + ': errores inline, accesibilidad, capacidad y botón deshabilitado OK');
  }
  memory.close();
  console.log('OK: reglas, API 400/201, idioma persistido es/en/fr, footer localizado y listado de categorías. Sin red.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
