// APIs reales + render es/en/fr; SQLite en memoria, sin Neon ni WhatsApp real.
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const { load, memory, req, setSession, setLocale } = require('./test-property-access.cjs');
const collection = load('apps/web/src/app/api/properties/route.ts');
const route = load('apps/web/src/app/api/properties/[id]/route.ts');
const Page = load('apps/web/src/app/[locale]/casas/[slug]/page.tsx').default;
const Form = load('apps/web/src/components/panel/PropertyForm.tsx').default;
const Card = load('apps/web/src/components/PropertyCard.tsx').default;
const React = req('react'), { renderToStaticMarkup } = req('react-dom/server');
const { NextIntlClientProvider } = req('next-intl');
const request = (body, method = 'POST') => new Request('http://localhost/api/test', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
const values = { titleEs: 'Casa Álamo', titleEn: 'Alamo House', titleFr: 'Maison Alamo', descEs: 'Texto', descEn: 'Text', descFr: 'Texte', address: 'Address', city: 'City', maxGuests: 4, bedrooms: 2, bathrooms: 1.5 };
async function main() {
  setSession({ user: { id: 'a' } });
  const old = await collection.POST(request(values)); assert.equal(old.status, 201);
  const oldId = (await old.json()).id;
  assert.equal(memory.prepare('SELECT rentalType FROM "Property" WHERE id=?').get(oldId).rentalType, 'nocturna');
  const added = await collection.POST(request({ ...values, rentalType: 'anual', contactName: ' Emma ', whatsapp: '5215512345678' }));
  assert.equal(added.status, 201);
  const id = (await added.json()).id, context = { params: Promise.resolve({ id }) };
  const get = () => memory.prepare('SELECT * FROM "Property" WHERE id=?').get(id);
  assert.equal(get().contactName, 'Emma'); assert.equal(get().whatsapp, '5215512345678');
  assert.equal(get().rentalType, 'anual'); assert.equal(get().ownerId, 'a');
  for (const body of [{ rentalType: 'mensual' }, { rentalType: null }, { whatsapp: '+5215512345678' }, { whatsapp: '521 5512345678' }, { whatsapp: 'abc' }, { whatsapp: '1234567' }, { whatsapp: '1'.repeat(16) }, { whatsapp: 5215512345678 }, { contactName: 'a'.repeat(101) }]) {
    assert.equal((await route.PATCH(request(body, 'PATCH'), context)).status, 400);
  }
  assert.equal(get().whatsapp, '5215512345678');
  setSession({ user: { id: 'b' } }); assert.equal((await route.PATCH(request({ whatsapp: null }, 'PATCH'), context)).status, 404);
  setSession({ user: { id: 'client' } }); assert.equal((await route.PATCH(request({ rentalType: 'nocturna' }, 'PATCH'), context)).status, 403);
  setSession({ user: { id: 'admin' } }); assert.equal((await route.PATCH(request({ published: true }, 'PATCH'), context)).status, 200);
  for (const locale of ['es', 'en', 'fr']) {
    setLocale(locale);
    const messages = JSON.parse(fs.readFileSync(path.join(__dirname, '../apps/web/messages', locale + '.json'), 'utf8'));
    const render = child => renderToStaticMarkup(React.createElement(NextIntlClientProvider, { locale, messages, timeZone: 'America/Mexico_City', onError(error) { throw error; } }, child));
    const property = get();
    const card = render(React.createElement(Card, { property: { ...property, media: [] } }));
    assert.ok(card.includes(messages.properties.annualRent));
    assert.ok(!render(React.createElement(Card, { property: { ...property, rentalType: 'nocturna', media: [] } })).includes(messages.properties.annualRent));
    const form = render(React.createElement(Form, { property }));
    for (const field of ['rentalType', 'contactName', 'whatsapp']) assert.ok(form.includes(`name="${field}"`));
    assert.ok(form.includes('pattern="[0-9]{8,15}"'));
    assert.ok(form.includes('value="anual" selected=""'));
    const html = render(await Page({ params: Promise.resolve({ locale, slug: property.slug }) }));
    const title = locale === 'en' ? property.titleEn : locale === 'fr' ? property.titleFr : property.titleEs;
    const text = messages.details.whatsappMessage.replace('{propertyName}', title);
    assert.ok(html.replace(/&#x27;/g, "'").includes(`https://wa.me/5215512345678?text=${encodeURIComponent(text)}`));
    assert.ok(html.includes('Emma'));
    assert.ok(html.includes(messages.details.whatsappButton));
    console.log(`${locale}: formulario, badge anual y enlace WhatsApp localizado OK`);
  }
  setSession({ user: { id: 'a' } });
  assert.equal((await route.PATCH(request({ contactName: '', whatsapp: '' }, 'PATCH'), context)).status, 200);
  assert.equal(get().contactName, null); assert.equal(get().whatsapp, null);
  const cleared = await Page({ params: Promise.resolve({ locale: 'fr', slug: get().slug }) });
  const messages = JSON.parse(fs.readFileSync(path.join(__dirname, '../apps/web/messages/fr.json'), 'utf8'));
  const noContact = renderToStaticMarkup(React.createElement(NextIntlClientProvider, { locale: 'fr', messages, timeZone: 'America/Mexico_City' }, cleared));
  assert.ok(!noContact.includes('https://wa.me/'));
  console.log('OK: default nocturna, creación/PATCH/persistencia, opcionales, validación y permisos; sin BD real.');
}
main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => memory.close());
