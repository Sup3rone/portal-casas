// APIs reales y SQL de Drizzle con sesiones/BD en memoria. No usa Neon ni correo.
const assert = require('node:assert/strict');
const { load, memory, setSession } = require('./test-property-access.cjs');
const collection = load('apps/web/src/app/api/properties/route.ts');
const property = load('apps/web/src/app/api/properties/[id]/route.ts');
const resources = load('apps/web/src/app/api/properties/[id]/resources/route.ts');
const create = load('apps/web/src/app/api/properties/[id]/[resource]/route.ts');
const change = load('apps/web/src/app/api/properties/[id]/[resource]/[resourceId]/route.ts');
const inquiry = load('apps/web/src/app/api/messages/route.ts');
const as = id => setSession(id ? { user: { id, role: 'ADMIN' } } : null);
const request = (body, method = 'POST') => new Request('http://localhost/api/test', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
const context = (id, resource, resourceId) => ({ params: Promise.resolve({ id, resource, resourceId }) });
const values = { titleEs: 'Casa de prueba', titleEn: 'Test home', titleFr: 'Logement test', descEs: 'Descripción', descEn: 'Description', descFr: 'Description', address: 'Address', city: 'City', maxGuests: 4, bedrooms: 2, bathrooms: 1.5, baseWeekdayPrice: 100, baseWeekendPrice: 200, lat: null, lng: null };
const rate = { name: 'Season', startDate: '2027-03-01', endDate: '2027-03-15', weekdayPrice: 300, weekendPrice: 400, priority: 1 };
async function main() {
  as(null); assert.equal((await collection.POST(request(values))).status, 401);
  as('client'); assert.equal((await collection.POST(request(values))).status, 403);
  as('a');
  assert.equal((await collection.POST(request({ ...values, ownerId: 'b' }))).status, 400);
  assert.equal((await collection.POST(request({ ...values, published: true }))).status, 400);
  assert.equal((await collection.POST(request({ ...values, titleFr: '' }))).status, 400);
  const added = await collection.POST(request(values)); assert.equal(added.status, 201);
  const { id } = await added.json();
  const saved = memory.prepare('SELECT * FROM "Property" WHERE id = ?').get(id);
  assert.equal(saved.ownerId, 'a'); assert.equal(saved.published, 0); assert.ok(saved.slug.startsWith('casa-de-prueba-'));
  assert.equal((await property.PATCH(request({ published: true }, 'PATCH'), context(id))).status, 403);
  assert.equal(memory.prepare('SELECT published FROM "Property" WHERE id = ?').get(id).published, 0);
  assert.equal((await property.PATCH(request({ titleEn: 'Edited home' }, 'PATCH'), context(id))).status, 200);
  for (const actor of ['b', 'client', null]) {
    as(actor); const status = actor === 'b' ? 404 : actor ? 403 : 401;
    assert.equal((await property.PATCH(request({ titleEs: 'Attack' }, 'PATCH'), context(id))).status, status);
    assert.equal((await resources.GET(request({}), context(id))).status, status);
    assert.equal((await create.POST(request(rate), context(id, 'rates'))).status, status);
  }
  as('a');
  const season = await create.POST(request(rate), context(id, 'rates')); assert.equal(season.status, 201);
  const seasonId = (await season.json()).id;
  assert.equal((await change.PATCH(request({ ...rate, weekdayPrice: 350 }, 'PATCH'), context(id, 'rates', seasonId))).status, 200);
  assert.equal((await change.PATCH(request(rate, 'PATCH'), context('pa', 'rates', seasonId))).status, 404);
  assert.equal((await change.DELETE(request({}, 'DELETE'), context(id, 'rates', 'rb'))).status, 404);
  const photo = await create.POST(request({ url: '/fotos/test.jpg', category: 'principal', order: 0 }), context(id, 'media'));
  assert.equal(photo.status, 201); const photoId = (await photo.json()).id;
  assert.equal((await create.POST(request({ url: 'javascript:alert(1)', category: 'principal' }), context(id, 'media'))).status, 400);
  assert.equal((await create.POST(request({ url: 'https://', category: 'principal' }), context(id, 'media'))).status, 400);
  assert.equal((await change.PATCH(request({ url: 'https://example.com/photo.jpg', category: 'amenidades', order: 2 }, 'PATCH'), context(id, 'media', photoId))).status, 200);
  const block = await create.POST(request({ startDate: '2027-02-01', endDate: '2027-02-04' }), context(id, 'blocks'));
  assert.equal(block.status, 201); const blockId = (await block.json()).id;
  assert.equal(memory.prepare('SELECT source FROM "Booking" WHERE id = ?').get(blockId).source, 'host-block');
  assert.equal((await create.POST(request({ startDate: '2027-02-02', endDate: '2027-02-05' }), context(id, 'blocks'))).status, 404);
  assert.equal((await create.POST(request({ startDate: '2027-02-30', endDate: '2027-03-05' }), context(id, 'blocks'))).status, 400);
  assert.equal((await change.PATCH(request({ startDate: '2027-02-05', endDate: '2027-02-09' }, 'PATCH'), context(id, 'blocks', blockId))).status, 200);
  memory.prepare('INSERT INTO "Booking" (id, propertyId, startDate, endDate, source) VALUES (?, ?, ?, ?, ?)').run('reservation', id, '2027-04-01', '2027-04-03', 'manual');
  assert.equal((await change.DELETE(request({}, 'DELETE'), context(id, 'blocks', 'reservation'))).status, 404);
  as('b');
  for (const [resource, resourceId] of [['rates', seasonId], ['media', photoId], ['blocks', blockId]]) {
    assert.equal((await change.DELETE(request({}, 'DELETE'), context(id, resource, resourceId))).status, 404);
  }
  as('a');
  const data = await (await resources.GET(request({}), context(id))).json();
  assert.equal(data.rates.length, 1); assert.equal(data.media.length, 1); assert.equal(data.bookings.length, 2);
  assert.equal((await change.DELETE(request({}, 'DELETE'), context(id, 'blocks', blockId))).status, 200);
  assert.equal((await change.DELETE(request({}, 'DELETE'), context(id, 'rates', seasonId))).status, 200);
  assert.equal((await change.DELETE(request({}, 'DELETE'), context(id, 'media', photoId))).status, 200);
  as('admin');
  assert.equal((await property.PATCH(request({ published: true }, 'PATCH'), context(id))).status, 200);
  assert.equal((await property.PATCH(request({ published: true }, 'PATCH'), context('pb'))).status, 200);
  assert.equal(memory.prepare('SELECT published FROM "Property" WHERE id = ?').get(id).published, 1);
  as(null);
  const form = new FormData(); for (const [key, value] of Object.entries({ propertyId: id, name: 'Guest', email: 'guest@test.invalid', startDate: '2027-01-01', endDate: '2027-01-03', body: 'Inquiry' })) form.set(key, value);
  assert.equal((await inquiry.POST(new Request('http://localhost/api/messages', { method: 'POST', body: form }))).status, 201);
  as('a'); assert.equal((await property.PATCH(request({ published: false }, 'PATCH'), context(id))).status, 200);
  assert.equal(memory.prepare('SELECT published FROM "Property" WHERE id = ?').get(id).published, 0);
  memory.close();
  console.log('OK Fase 2: creación/dueño, aprobación, edición, recursos propios/ajenos, bloqueos y consulta pública. Sin red ni BD real.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
