// Offline: API real/SQLite, SSR es/en/fr y eventos React simulados. Sin navegador, red ni Neon.
const assert = require('node:assert/strict'), fs = require('node:fs');
const { load, req, memory, queryLog, mockModule, setSession, setLocale } = require('./test-property-access.cjs');
const React = req('react'), { renderToStaticMarkup, renderToReadableStream } = req('react-dom/server');
const { NextIntlClientProvider } = req('next-intl');
const { POST } = load('apps/web/src/app/api/messages/route.ts');
const { validateInquiry, inquiryToday } = load('apps/web/src/lib/inquiry-validation.ts');
const Page = load('apps/web/src/app/[locale]/casas/[slug]/page.tsx').default;
const Form = load('apps/web/src/components/MessageForm.tsx').default;
const Provider = load('apps/web/src/components/ReservationDatesProvider.tsx').default;
const Calendar = load('apps/web/src/components/AvailabilityCalendar.tsx').default;
const InquiriesPage = load('apps/web/src/app/[locale]/panel/consultas/page.tsx').default;
mockModule('next/navigation', { useRouter: () => ({ refresh() {} }), redirect: url => { throw new Error('redirect: ' + url); }, notFound: () => { throw new Error('notFound'); } });
const MessagesPage = load('apps/web/src/app/[locale]/admin/mensajes/page.tsx').default;
const { inquiryEstimate } = load('apps/web/src/components/panel/Inquiries.tsx');
const contact = { name: 'Cliente anual', email: 'annual@example.invalid', phone: '', body: 'Quiero información de renta anual.' };
let ip = 0;
function request(propertyId, values = {}, sameIp) {
  const form = new FormData();
  for (const [key, value] of Object.entries({ propertyId, ...contact, ...values })) if (value != null) form.set(key, String(value));
  return new Request('http://localhost/api/messages', { method: 'POST', headers: { 'x-forwarded-for': sameIp || `192.0.2.${++ip}` }, body: form });
}
function nodes(tree) { return !tree || typeof tree !== 'object' ? [] : [tree, ...React.Children.toArray(tree.props?.children).flatMap(nodes)]; }
async function main() {
  const today = inquiryToday();
  assert.deepEqual(validateInquiry({ ...contact }, { today, contactOnly: true }), {});
  assert.equal(validateInquiry({ ...contact }, { today }).startDate, 'startRequired');
  assert.equal(validateInquiry({ ...contact }, { today }).guests, 'guestsRange');
  for (const [field, value] of [['name', ''], ['email', 'bad'], ['phone', 'invalid'], ['body', '']]) {
    assert.ok(validateInquiry({ ...contact, [field]: value }, { today, contactOnly: true })[field]);
  }
  memory.prepare('UPDATE Property SET rentalType=?,contactEmail=?,whatsapp=?,descEs=?,descEn=?,descFr=?,address=?,bedrooms=1,bathrooms=1 WHERE id=?')
    .run('anual', 'host@example.invalid', '5215512345678', 'Descripción real', 'Real description', 'Description réelle', 'Calle real', 'pa');
  memory.prepare('DELETE FROM Message').run();
  let annualMessage;
  for (const locale of ['es', 'en', 'fr']) {
    const before = queryLog.length;
    const response = await POST(request('pa', { lang: locale, mode: 'annual' }));
    assert.equal(response.status, 201);
    annualMessage = (await response.json()).message;
    assert.equal(annualMessage.lang, locale); assert.equal(annualMessage.startDate, null); assert.equal(annualMessage.endDate, null);
    assert.equal(annualMessage.name, contact.name); assert.equal(annualMessage.email, contact.email); assert.equal(annualMessage.phone, null);
    assert.ok(!queryLog.slice(before).some(query => /"Booking"|"BlockDate"/.test(query)), 'Contacto anual no consulta ocupación');
  }
  for (const rentalType of ['nocturna', 'ambas']) {
    memory.prepare('UPDATE Property SET rentalType=? WHERE id=?').run(rentalType, 'pb');
    const response = await POST(request('pb', { mode: 'annual', contactOnly: true, rentalType: 'anual' }));
    assert.equal(response.status, 400); const error = await response.json();
    assert.equal(error.code, 'INVALID_INQUIRY'); assert.equal(error.fields.startDate, 'startRequired'); assert.equal(error.fields.guests, 'guestsRange');
    const dates = { startDate: '2090-01-01', endDate: '2090-01-03', guests: 1 };
    assert.equal((await POST(request('pb', dates))).status, 201, 'Reserva normal sigue aceptando fechas');
  }
  assert.equal((await POST(request('hidden'))).status, 404);
  for (const field of ['name', 'email', 'body']) assert.equal((await POST(request('pa', { [field]: '' }))).status, 400);
  // Fechas suministradas a una anual nunca se persisten ni provocan casts de entradas inválidas.
  const extra = await POST(request('pa', { startDate: 'bad', endDate: 'bad', guests: 'bad' }));
  assert.equal(extra.status, 201); const saved = (await extra.json()).message;
  assert.equal(saved.startDate, null); assert.equal(saved.endDate, null);
  for (let n = 0; n < 5; n++) assert.equal((await POST(request('pa', {}, '198.51.100.44'))).status, 201);
  const limited = await POST(request('pa', {}, '198.51.100.44')); assert.equal(limited.status, 429); assert.ok(Number(limited.headers.get('Retry-After')) > 0);
  // El adaptador SQLite no aplica defaults PostgreSQL de createdAt/read.
  memory.prepare('UPDATE Message SET createdAt=?,read=0 WHERE createdAt IS NULL').run('2026-10-16 12:00:00');

  for (const locale of ['es', 'en', 'fr']) {
    setLocale(locale);
    const messages = JSON.parse(fs.readFileSync(`apps/web/messages/${locale}.json`, 'utf8'));
    const wrap = children => React.createElement(NextIntlClientProvider, { locale, messages, timeZone: 'America/Mexico_City', onError(error) { throw error; } }, children);
    const render = children => renderToStaticMarkup(wrap(children));
    const streamHtml = async children => new Response(await renderToReadableStream(wrap(children))).text();
    const before = queryLog.length;
    const page = await Page({ params: Promise.resolve({ locale, slug: 'pa' }) });
    const form = nodes(page).find(node => node.type === Form);
    assert.equal(form.props.mode, 'annual'); assert.ok(!('pricing' in form.props)); assert.ok(!('maxGuests' in form.props));
    assert.ok(!nodes(page).some(node => node.type === Calendar));
    assert.ok(!queryLog.slice(before).some(query => /"Booking"|"BlockDate"|"SeasonRate"/.test(query)), 'Ficha anual no carga tarifas/ocupación');
    const html = await streamHtml(page);
    for (const name of ['name', 'email', 'phone', 'body']) assert.ok(html.includes(`name="${name}"`));
    for (const name of ['startDate', 'endDate', 'guests']) assert.ok(!html.includes(`name="${name}"`));
    assert.ok(html.includes(messages.details.annualContactTitle)); assert.ok(html.includes('id="reservar"'));
    assert.ok(html.includes('mailto:host@example.invalid')); assert.ok(html.replace(/<!--.*?-->/gs, '').includes('+5215512345678'));
    assert.ok(html.includes('https://wa.me/5215512345678?text='));
    const section = nodes(page).find(node => node.props.id === 'reservar');
    assert.ok(render(section).indexOf('name="body"') < render(section).indexOf('mailto:'), 'Móvil: formulario antes de contactos');
    assert.ok(html.includes(messages.details.form.namePlaceholder));
    for (const rentalType of ['nocturna', 'ambas']) {
      memory.prepare('UPDATE Property SET rentalType=? WHERE id=?').run(rentalType, 'pa');
      const bookingPage = await Page({ params: Promise.resolve({ locale, slug: 'pa' }) });
      const bookingForm = nodes(bookingPage).find(node => node.type === Form);
      assert.ok(nodes(bookingPage).some(node => node.type === Calendar)); assert.ok(bookingForm.props.pricing);
      const bookingHtml = await streamHtml(bookingPage);
      for (const field of ['startDate', 'endDate', 'guests']) assert.ok(bookingHtml.includes(`name="${field}"`));
      assert.ok(!bookingHtml.includes(messages.details.annualContactTitle));
    }
    memory.prepare('UPDATE Property SET rentalType=? WHERE id=?').run('anual', 'pa');
    for (const [whatsapp, contactEmail] of [[null, null], ['5215512345678', null], [null, 'host@example.invalid']]) {
      memory.prepare('UPDATE Property SET whatsapp=?,contactEmail=? WHERE id=?').run(whatsapp, contactEmail, 'pa');
      const partialPage = await Page({ params: Promise.resolve({ locale, slug: 'pa' }) });
      const section = nodes(partialPage).find(node => node.props.id === 'reservar');
      const html = render(section);
      assert.equal(html.includes('https://wa.me/'), Boolean(whatsapp)); assert.equal(html.includes('mailto:'), Boolean(contactEmail));
      assert.equal(html.includes(messages.details.contactTitle + '</h3>'), Boolean(whatsapp || contactEmail));
    }
    memory.prepare('UPDATE Property SET whatsapp=?,contactEmail=? WHERE id=?').run('5215512345678', 'host@example.invalid', 'pa');
    setSession({ user: { id: 'a' } });
    const inquiries = await InquiriesPage({ params: Promise.resolve({ locale }) });
    const row = inquiries.props.children[0].props.rows.find(row => row.id === annualMessage.id);
    assert.ok(row); assert.equal(row.isPast, false); assert.equal(inquiryEstimate(row).nights, null);
    const listHtml = render(inquiries);
    assert.ok(listHtml.includes(contact.name)); assert.ok(listHtml.includes(messages.panel.inquiryDatesUnavailable)); assert.ok(!listHtml.includes('Invalid Date'));
    const received = render(await MessagesPage()); assert.ok(received.includes(contact.name)); assert.ok(!received.includes('Invalid Date'));
    setSession(null);
  }
  console.log('OK anual: API sin fechas/ocupación, validación por tipo en servidor, 429, SSR es/en/fr, contactos parciales, nocturna/ambas intactas y listas sin fechas.');

  // Envío de la variante cliente con errores/red/cuota: conserva campos hasta éxito confirmado.
  let index = 0; const states = [], events = [];
  mockModule('react', { ...React, useMemo: fn => fn(), useState: initial => { const key = index++; if (!(key in states)) states[key] = initial; return [states[key], value => { states[key] = typeof value === 'function' ? value(states[key]) : value; }]; } });
  mockModule('next-intl', { useTranslations: () => key => key });
  mockModule('./ReservationDatesProvider', { useReservationDates: () => ({ dates: { startDate: '', endDate: '' }, setDates() {} }) });
  mockModule('@vercel/analytics', { track: (...args) => events.push(args) });
  const Interactive = load('apps/web/src/components/MessageForm-annual-test.tsx', fs.readFileSync('apps/web/src/components/MessageForm.tsx', 'utf8')).default;
  function renderForm() { index = 0; return Interactive({ propertyId: 'pa', propertySlug: 'pa', locale: 'es', mode: 'annual' }); }
  for (const [field, value] of Object.entries(contact)) nodes(renderForm()).find(node => node.props.name === field).props.onChange({ target: { value } });
  const data = new FormData(); for (const [key, value] of Object.entries(contact)) data.set(key, value);
  const nativeFetch = global.fetch, nativeTimeout = global.setTimeout;
  try {
    for (const status of [400, 429, 500]) {
      global.fetch = async () => Response.json({ code: 'TEST', message: 'Limit', fields: {} }, { status });
      await renderForm().props.action(data);
      assert.equal(nodes(renderForm()).find(node => node.props.name === 'email').props.value, contact.email);
      assert.equal(events.length, 0);
    }
    global.fetch = async () => { throw new TypeError('Offline'); }; await renderForm().props.action(data);
    assert.equal(nodes(renderForm()).find(node => node.props.name === 'body').props.value, contact.body);
    let resolve; global.fetch = () => new Promise(done => { resolve = done; });
    const pending = renderForm().props.action(data); assert.equal(events.length, 0);
    global.setTimeout = () => 0; resolve(Response.json({ success: true }, { status: 201 })); await pending;
    assert.deepEqual(events, [['query_submitted', { property: 'pa' }]]);
  } finally { global.fetch = nativeFetch; global.setTimeout = nativeTimeout; }
  console.log('OK formulario anual: omite fechas, conserva texto ante 400/429/500/red y registra conversión solo tras 201.');
}
main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => memory.close());
