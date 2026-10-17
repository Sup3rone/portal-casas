// API, SQL y SSR reales en memoria; sin Neon, Blob ni navegador.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { load, memory, req, setSession, setLocale, mockModule } = require('./test-property-access.cjs');
const React = req('react');
const { renderToStaticMarkup } = req('react-dom/server');
const { NextIntlClientProvider } = req('next-intl');
const { propertyLocation } = load('apps/web/src/lib/destinations.ts');
const { propertyInput } = load('apps/web/src/lib/panel-validation.ts');
const Form = load('apps/web/src/components/panel/PropertyForm.tsx').default;
const Card = load('apps/web/src/components/PropertyCard.tsx').default;
const Page = load('apps/web/src/app/[locale]/casas/[slug]/page.tsx').default;
const Home = load('apps/web/src/app/[locale]/page.tsx').default;
const collection = load('apps/web/src/app/api/properties/route.ts');
const route = load('apps/web/src/app/api/properties/[id]/route.ts');
const body = { titleEs: 'Casa', titleEn: 'House', titleFr: 'Maison', descEs: 'Contenido', descEn: 'Content', descFr: 'Contenu', address: 'Calle 1', maxGuests: 4, bedrooms: 2, bathrooms: 1 };
const request = value => new Request('http://localhost/test', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(value) });
const patch = (value, id = 'pa') => route.PATCH(request(value), { params: Promise.resolve({ id }) });
const read = id => memory.prepare('SELECT * FROM Property WHERE id=?').get(id);
function find(node, predicate) {
  if (!node || typeof node !== 'object') return;
  if (predicate(node)) return node;
  for (const child of [node.props?.children].flat(Infinity)) { const match = find(child, predicate); if (match) return match; }
}
async function main() {
  const pair = { state: 'Nayarit', destinationCity: 'Nuevo Vallarta' };
  assert.equal(propertyLocation({ ...pair, city: 'legacy' }), 'Nuevo Vallarta, Nayarit');
  assert.equal(propertyLocation({ city: 'Guadalajara, Jalisco' }), 'Guadalajara, Jalisco');
  assert.equal(propertyLocation({ state: 'Jalisco', destinationCity: 'Nuevo Vallarta', city: 'mas aya' }), 'mas aya');
  assert.equal(propertyInput(body, true).city, '');
  for (const invalid of [{ state: 'Nayarit' }, { destinationCity: 'Nuevo Vallarta' }, { state: 'Jalisco', destinationCity: 'Nuevo Vallarta' }, { state: 'toString', destinationCity: 'x' }, { state: 1, destinationCity: 'x' }]) {
    assert.throws(() => propertyInput(invalid), /invalidDestination/);
  }
  setSession({ user: { id: 'a' } });
  const created = await collection.POST(request({ ...body, ...pair }));
  assert.equal(created.status, 201);
  const id = (await created.json()).id;
  assert.equal(read(id).city, ''); assert.equal(read(id).state, 'Nayarit');
  memory.prepare('UPDATE Property SET city=? WHERE id=?').run('mas aya', 'pa');
  assert.equal((await patch(pair)).status, 200);
  assert.equal(read('pa').city, 'mas aya', 'Guardar selección no sobreescribe legacy');
  assert.equal((await patch({ address: 'Otra dirección' })).status, 200);
  assert.equal(read('pa').state, 'Nayarit', 'PATCH ajeno al destino conserva selección');
  const invalid = await patch({ state: 'Jalisco', destinationCity: 'Nuevo Vallarta' });
  assert.equal(invalid.status, 400); assert.equal((await invalid.json()).code, 'INVALID_DESTINATION');
  assert.equal((await patch(pair, 'pb')).status, 404);
  setSession({ user: { id: 'admin' } }); assert.equal((await patch(pair, 'pb')).status, 200);
  assert.equal((await patch({ state: null, destinationCity: null })).status, 200);
  assert.equal(read('pa').state, null); assert.equal(read('pa').city, 'mas aya');
  await patch(pair);
  memory.prepare('UPDATE Property SET titleEs=?,titleEn=?,titleFr=?,descEs=?,descEn=?,descFr=?,address=?,maxGuests=4,bedrooms=2,bathrooms=1 WHERE id=?')
    .run('Casa','House','Maison','Contenido','Content','Contenu','Calle 1','pa');
  memory.prepare('INSERT INTO Media (id,propertyId,type,url,category,"order") VALUES (?,?,?,?,?,?)').run('photo','pa','PHOTO','/photo.jpg','principal',0);
  memory.prepare('INSERT INTO SiteContent (key,value) VALUES (?,?)').run('featured_property_id','pa');
  for (const locale of ['es','en','fr']) {
    setLocale(locale);
    const messages = require('../apps/web/messages/' + locale + '.json');
    const render = node => renderToStaticMarkup(React.createElement(NextIntlClientProvider, { locale, messages, timeZone: 'America/Mexico_City' }, node));
    const editor = render(React.createElement(Form, { property: read('pa') }));
    assert.ok(editor.includes('name="state"')); assert.ok(editor.includes('name="destinationCity"'));
    assert.ok(!editor.includes('name="city"')); assert.ok(editor.includes(messages.panel.destinationUnavailable));
    const cities = editor.match(/<select[^>]*name="destinationCity"[\s\S]*?<\/select>/)[0];
    assert.ok(cities.includes('Nuevo Vallarta')); assert.ok(!cities.includes('Guadalajara'));
    const card = render(React.createElement(Card, { property: { ...read('pa'), media: [] } }));
    assert.ok(card.includes('Nuevo Vallarta, Nayarit'));
    assert.ok(render(await Page({ params: Promise.resolve({locale,slug:'pa'}) })).includes('Nuevo Vallarta, Nayarit'));
    assert.ok(render(await Home({ params: Promise.resolve({locale}) })).includes('Nuevo Vallarta, Nayarit'));
    const legacyCard = render(React.createElement(Card, { property: { ...read('pa'), state: null, destinationCity: null, media: [] } }));
    assert.ok(legacyCard.includes('mas aya'));
  }
  // Reducer de selección del formulario real: cambiar estado vacía ciudad.
  let state = [], cursor = 0;
  mockModule('./PropertyRentalType', { usePropertyRentalType: () => null });
  mockModule('react', { ...React, useState: initial => { const index = cursor++; if (!(index in state)) state[index] = initial; return [state[index], value => { state[index] = value; }]; } });
  mockModule('next-intl', { useTranslations: () => key => key });
  const Interactive = load('apps/web/src/components/panel/PropertyForm-destinations-test.tsx', fs.readFileSync('apps/web/src/components/panel/PropertyForm.tsx','utf8')).default;
  let form = Interactive({ property: read('pa') });
  find(form, node => node.props?.name === 'state').props.onChange({ target: { value: 'Jalisco' } });
  cursor = 0; form = Interactive({ property: read('pa') });
  assert.equal(find(form, node => node.props?.name === 'destinationCity').props.value, '');
  assert.equal(find(form, node => node.props?.name === 'destinationCity').props.required, true);
  // Verifica los UPDATE de mapeo sin ejecutar DO/LOCK de PostgreSQL.
  memory.function('btrim', value => value.trim());
  memory.exec('DELETE FROM Property');
  for (const [id, city] of [['1','Nuevo Vallarta'],['2','Nuevo Vallarta'],['3','Guadalajara, Jalisco'],['4','mas aya']]) memory.prepare('INSERT INTO Property (id,city) VALUES (?,?)').run(id,city);
  const sql = fs.readFileSync('scripts/sql/property-destinations-backfill.sql','utf8');
  const updates = sql.match(/UPDATE "Property" SET[\s\S]*?RETURNING[\s\S]*?;/g);
  assert.equal(updates.length, 2); for (const update of updates) memory.prepare(update).all();
  assert.equal(read('1').state, 'Nayarit'); assert.equal(read('2').destinationCity, 'Nuevo Vallarta');
  assert.equal(read('3').state, 'Jalisco'); assert.equal(read('4').state, null); assert.equal(read('4').city, 'mas aya');
  console.log('OK destinos propiedad: validación/par completo, create/PATCH/legacy, permisos, selects dependientes, SSR es/en/fr y backfill de 3 filas sin inferir mas aya.');
}
main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => memory.close());
