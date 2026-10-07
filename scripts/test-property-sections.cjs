// Handlers reales y SQL Drizzle en memoria; no conecta a Neon.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { load, memory, req, setSession, setLocale } = require('./test-property-access.cjs');
const get = load('apps/web/src/app/api/properties/[id]/sections/route.ts');
const put = load('apps/web/src/app/api/properties/[id]/sections/[section]/route.ts');
const context = (id, section = 'destino') => ({ params: Promise.resolve({ id, section }) });
const request = body => new Request('http://localhost/api/test', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
const as = id => setSession(id ? { user: { id, role: 'ADMIN' } } : null);
const data = { descriptionEs: 'Destino', descriptionEn: 'Destination', descriptionFr: 'Destination', heroMediaId: 'photo-a' };
for (const [id, propertyId, type] of [['photo-a', 'pa', 'PHOTO'], ['photo-a2', 'pa', 'PHOTO'], ['photo-b', 'pb', 'PHOTO'], ['video-a', 'pa', 'VIDEO']]) {
  memory.prepare('INSERT INTO "Media" (id,propertyId,type,url,"order",category) VALUES (?,?,?,?,?,?)').run(id, propertyId, type, 'https://example.com/' + id + '.jpg', 1, 'principal');
}
async function main() {
  for (const [actor, status] of [[null, 401], ['client', 403], ['viewer', 403], ['b', 404]]) {
    as(actor);
    assert.equal((await get.GET(request({}), context('pa'))).status, status);
    assert.equal((await put.PUT(request(data), context('pa'))).status, status);
  }
  as('a');
  assert.deepEqual((await (await get.GET(request({}), context('pa'))).json()).sections, []);
  let response = await put.PUT(request(data), context('pa', 'invalid'));
  assert.equal(response.status, 400); assert.equal((await response.json()).code, 'INVALID_SECTION');
  for (const heroMediaId of ['photo-b', 'video-a', 'missing']) {
    response = await put.PUT(request({ ...data, heroMediaId }), context('pa'));
    assert.equal(response.status, 400); assert.equal((await response.json()).code, 'INVALID_HERO');
  }
  for (const photoMediaIds of [['photo-b'], ['video-a'], ['missing'], ['photo-a','photo-a'], ['a','b','c'], 'photo-a', [42]]) {
    response = await put.PUT(request({ ...data, photoMediaIds }), context('pa'));
    assert.equal(response.status,400); assert.equal((await response.json()).code,'INVALID_SECTION_PHOTOS');
  }
  for (const body of [{}, { ...data, ownerId: 'b' }, { ...data, descriptionEs: 42 }, { ...data, descriptionFr: 'x'.repeat(10001) }]) {
    response = await put.PUT(request(body), context('pa'));
    assert.equal(response.status, 400); assert.equal((await response.json()).code, 'INVALID_SECTION_CONTENT');
  }
  assert.equal(memory.prepare('SELECT count(*) AS n FROM "PropertySection"').get().n, 0);
  response = await put.PUT(request(data), context('pa')); assert.equal(response.status, 200);
  response = await put.PUT(request({...data,photoMediaIds:['photo-a2','photo-a']}),context('pa')); assert.equal(response.status,200);
  assert.deepEqual((await (await get.GET(request({}),context('pa'))).json()).sections[0].photoMediaIds,['photo-a2','photo-a']);
  assert.equal(memory.prepare('SELECT "heroMediaId" FROM "PropertySection" WHERE "propertyId" = ?').get('pa').heroMediaId, 'photo-a');
  response = await put.PUT(request({ ...data, descriptionEs: ' Actualizado ' }), context('pa')); assert.equal(response.status, 200);
  assert.equal(memory.prepare('SELECT count(*) AS n FROM "PropertySection"').get().n, 1);
  assert.equal((await (await get.GET(request({}), context('pa'))).json()).sections[0].descriptionEs, 'Actualizado');
  const empty = { descriptionEs: null, descriptionEn: null, descriptionFr: null, heroMediaId: null };
  assert.equal((await put.PUT(request(empty), context('pa'))).status, 200);
  const cleared = memory.prepare('SELECT * FROM "PropertySection" WHERE "propertyId" = ?').get('pa');
  for (const key of Object.keys(empty)) assert.equal(cleared[key], null);
  assert.equal(cleared.photoMediaIds,null);
  as('admin'); assert.equal((await put.PUT(request({ ...data, heroMediaId: 'photo-b' }), context('pb'))).status, 200);
  assert.equal((await get.GET(request({}), context('pb'))).status, 200);
  as('a'); response = await put.PUT(request(data), context('pb'));
  assert.equal(response.status, 404); assert.equal((await response.json()).code, 'PROPERTY_NOT_FOUND');
  assert.equal(memory.prepare('SELECT "heroMediaId" FROM "PropertySection" WHERE "propertyId" = ?').get('pb').heroMediaId, 'photo-b');
  assert.equal((await put.PUT(request(data), context('pa', 'advertencias'))).status, 200);
  assert.equal(memory.prepare('SELECT "descriptionEs" FROM "PropertySection" WHERE "propertyId" = ? AND section = ?').get('pa','advertencias').descriptionEs,'Destino');
  const page = load('apps/web/src/app/[locale]/panel/propiedades/[id]/page.tsx').default;
  const React = req('react'), { renderToStaticMarkup } = req('react-dom/server'), { NextIntlClientProvider } = req('next-intl');
  for (const locale of ['es', 'en', 'fr']) {
    setLocale(locale);
    const messages = JSON.parse(fs.readFileSync(path.join(__dirname, '../apps/web/messages/' + locale + '.json'), 'utf8'));
    const html = renderToStaticMarkup(React.createElement(NextIntlClientProvider, { locale, messages, timeZone: 'America/Mexico_City', onError(e) { throw e; } }, await page({ params: Promise.resolve({ locale, id: 'pa' }) })));
    assert.ok(html.includes(messages.panelSections.title));
    assert.equal((html.match(/name="descriptionEs"/g) || []).length, 5);
    for (const key of ['destino', 'amenidades', 'habitaciones', 'enLugar', 'advertencias']) assert.ok(html.includes(messages.details[key]));
    // El video se conserva en la galería existente, pero no en las opciones hero.
    assert.ok(!html.includes('value="video-a"')); assert.ok(html.includes('value="photo-a"'));
    assert.ok(!html.includes('value="photo-b"'));
  }
  memory.close();
  console.log('OK secciones: autorización 401/403/404, sección/hero/contenido 400, UPSERT, vaciado, admin y SSR es/en/fr. Sin red ni BD real.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
