// Offline: handlers reales, SQL SQLite en memoria y eventos React simulados; sin UI/browser ni Neon.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { load, req, memory, mockModule, setSession } = require('./test-property-access.cjs');
const collection = load('apps/web/src/app/api/properties/route.ts');
const property = load('apps/web/src/app/api/properties/[id]/route.ts');
const sync = load('apps/web/src/app/api/ical/sync/route.ts');
const { panelResponseError } = load('apps/web/src/components/panel/request.ts');
const request = (body, method = 'POST') => new Request('http://localhost/test', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
const values = { titleEs: 'Casa', titleEn: 'House', titleFr: 'Maison', descEs: 'Texto', descEn: 'Text', descFr: 'Texte', address: 'Dirección', maxGuests: 4, bedrooms: 1, bathrooms: 1 };
async function main() {
  setSession({ user: { id: 'a' } });
  const created = await collection.POST(request({ ...values, rentalType: 'ambas', contactEmail: ' contacto@example.invalid ' }));
  assert.equal(created.status, 201);
  const { id } = await created.json(), params = { params: Promise.resolve({ id }) };
  const row = () => memory.prepare('SELECT * FROM Property WHERE id=?').get(id);
  assert.equal(row().rentalType, 'ambas'); assert.equal(row().contactEmail, 'contacto@example.invalid');
  memory.prepare('INSERT INTO SeasonRate (id,propertyId,name) VALUES (?,?,?)').run('retained-rate', id, 'Temporada conservada');
  memory.prepare('INSERT INTO Booking (id,propertyId,source) VALUES (?,?,?)').run('retained-block', id, 'host-block');
  for (const rentalType of ['anual', 'nocturna', 'ambas']) {
    assert.equal((await property.PATCH(request({ rentalType, baseWeekdayPrice: null, baseWeekendPrice: null }, 'PATCH'), params)).status, 200);
    assert.equal(row().rentalType, rentalType);
    assert.equal(memory.prepare('SELECT name FROM SeasonRate WHERE id=?').get('retained-rate').name, 'Temporada conservada');
    assert.equal(memory.prepare('SELECT source FROM Booking WHERE id=?').get('retained-block').source, 'host-block');
  }
  for (const contactEmail of ['bad', 'a@b', 'a b@example.invalid', 'a'.repeat(243) + '@example.com', 123]) {
    const response = await property.PATCH(request({ contactEmail }, 'PATCH'), params);
    assert.equal(response.status, 400);
    const payload = await response.json(); assert.equal(payload.code, 'INVALID_CONTACT_EMAIL');
    assert.equal(panelResponseError(400, payload).message, 'invalidContactEmail');
    assert.equal(row().contactEmail, 'contacto@example.invalid');
  }
  const longest = 'a'.repeat(242) + '@example.com'; assert.equal(longest.length, 254);
  assert.equal((await property.PATCH(request({ contactEmail: longest }, 'PATCH'), params)).status, 200);
  for (const contactEmail of ['', '   ', null]) {
    assert.equal((await property.PATCH(request({ contactEmail }, 'PATCH'), params)).status, 200);
    assert.equal(row().contactEmail, null);
  }
  assert.equal((await property.PATCH(request({ rentalType: 'mensual' }, 'PATCH'), params)).status, 400);
  const annual = await collection.POST(request({ ...values, rentalType: 'anual' })); assert.equal(annual.status, 201);
  const annualRow = memory.prepare('SELECT * FROM Property WHERE id=?').get((await annual.json()).id);
  assert.equal(annualRow.baseWeekdayPrice, null); assert.equal(annualRow.contactEmail, null);
  setSession({ user: { id: 'b' } });
  assert.equal((await property.PATCH(request({ contactEmail: 'x@example.invalid' }, 'PATCH'), params)).status, 404);

  // No descargar feeds anuales, ni siquiera si su URL falla; conservar scoping por propietario.
  memory.prepare('UPDATE Property SET rentalType=?').run('anual');
  const downloads = [];
  mockModule('node-ical', { fromURL: async url => {
    downloads.push(url);
    return { event: { type: 'VEVENT', start: new Date('2027-10-01'), end: new Date('2027-10-03'), uid: 'test' } };
  } });
  // El handler ya cargado mantiene su import; cargar una copia con el mock del proveedor.
  const syncMock = load('apps/web/src/app/api/ical/sync/rental-types-test.ts', fs.readFileSync('apps/web/src/app/api/ical/sync/route.ts', 'utf8'));
  setSession({ user: { id: 'admin' } });
  let response = await syncMock.POST(), payload = await response.json();
  assert.equal(response.status, 200); assert.equal(payload.skippedAnnual, 2); assert.equal(payload.synced, 0); assert.deepEqual(downloads, []);
  memory.prepare('UPDATE Property SET rentalType=? WHERE id=?').run('nocturna', 'pa');
  memory.prepare('UPDATE Property SET rentalType=? WHERE id=?').run('ambas', 'pb');
  response = await syncMock.POST(); payload = await response.json();
  assert.equal(response.status, 200); assert.equal(payload.synced, 2); assert.deepEqual(downloads.sort(), ['fa', 'fb']);
  downloads.length = 0; setSession({ user: { id: 'a' } });
  assert.equal((await syncMock.POST()).status, 200); assert.deepEqual(downloads, ['fa']);
  setSession(null); assert.equal((await sync.POST()).status, 401);

  const React = req('react');
  let context = null, state = 'anual', locale = 'es';
  mockModule('react', { ...React, useContext: () => context, useState: initial => [initial === 'anual' ? state : initial, value => { state = value; }] });
  mockModule('next-intl', { useTranslations: namespace => req('next-intl').createTranslator({ locale,
    messages: JSON.parse(fs.readFileSync(`apps/web/messages/${locale}.json`, 'utf8')), namespace, onError(error) { throw error; } }) });
  const { default: Provider, RentalTypeResources } = load('apps/web/src/components/panel/PropertyRentalType.tsx');
  const Form = load('apps/web/src/components/panel/PropertyForm.tsx').default;
  const children = React.createElement('input', { defaultValue: 'Borrador de temporada' });
  function nodes(tree) { return !tree || typeof tree !== 'object' ? [] : [tree, ...React.Children.toArray(tree.props?.children).flatMap(nodes)]; }
  for (locale of ['es', 'en', 'fr']) {
    state = 'anual'; context = Provider({ initial: state, children }).props.value;
    let form = Form({ property: { ...annualRow, rentalType: 'anual' } });
    const selector = nodes(form).find(node => node.type === 'select' && node.props.name === 'rentalType');
    assert.deepEqual(nodes(selector).filter(node => node.type === 'option').map(node => node.props.value), ['nocturna', 'anual', 'ambas']);
    assert.equal(nodes(form)[1].type, 'label'); // Primer control: modalidad.
    const email = nodes(form).find(node => node.props.name === 'contactEmail');
    assert.equal(email.props.type, 'email'); assert.equal(email.props.maxLength, 254); assert.ok(!email.props.required);
    let resources = RentalTypeResources({ children }); assert.equal(resources.props.hidden, true); assert.equal(resources.props.children, children);
    for (const value of ['ambas', 'nocturna', 'anual']) {
      selector.props.onChange({ target: { value } });
      context = Provider({ initial: 'anual', children }).props.value;
      resources = RentalTypeResources({ children });
      assert.equal(resources.props.hidden, value === 'anual'); assert.equal(resources.props.children, children, 'No desmontar borradores');
    }
    const messages = JSON.parse(fs.readFileSync(`apps/web/messages/${locale}.json`, 'utf8'));
    for (const key of ['rentalNocturna', 'rentalAnual', 'rentalAmbas', 'invalidContactEmail']) assert.ok(messages.panel[key]);
  }
  console.log('OK: tres modalidades, correo POST/PATCH/254/vacío/errores, anual sin tarifas, permisos, sync anual omitido y nocturna/ambas intactos; editor condicionado es/en/fr conserva hijos.');
}
main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => memory.close());
