// Consulta real del listado, BD en memoria; no modifica ni conecta a Neon.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { load, memory, req, mockModule, setLocale } = require('./test-property-access.cjs');
const Page = load('apps/web/src/app/[locale]/casas/page.tsx').default;
const resource = load('apps/web/src/app/api/properties/[id]/[resource]/[resourceId]/route.ts');
const cover = load('apps/web/src/app/api/properties/[id]/cover/route.ts');
const { setSession } = require('./test-property-access.cjs');
const insert = memory.prepare('INSERT INTO "Media" (id,"propertyId",url,type,"order",category,"isCover","coverOrder") VALUES (?,?,?,?,?,?,false,null)');
insert.run('video', 'pa', '/video.mp4', 'VIDEO', 0, 'principal');
insert.run('other', 'pa', '/other.jpg', 'PHOTO', 0, 'amenidades');
for (let i = 0; i < 81; i++) insert.run(`photo-${String(i).padStart(2, '0')}`, 'pa', `/photos/${i}.jpg`, 'PHOTO', i + 10, 'principal');
insert.run('fallback', 'pb', '/fallback.jpg', 'PHOTO', 5, 'habitaciones');
memory.prepare('UPDATE "Property" SET published=1 WHERE id=?').run('hidden');
function cards(node, result = []) {
  if (!node || typeof node !== 'object') return result;
  if (node.props?.property) result.push(node.props.property);
  for (const child of [node.props?.children].flat(Infinity)) cards(child, result);
  return result;
}
async function main() {
  // Ensayar SOLO el backfill con SQL en memoria; no valida DDL PostgreSQL.
  const migration = fs.readFileSync(path.join(__dirname, 'sql/media-cover.sql'), 'utf8');
  memory.exec(migration.slice(migration.indexOf('WITH ranked'), migration.indexOf('ALTER TABLE "Media" ADD CONSTRAINT')));
  const before = memory.prepare('SELECT count(*) AS total FROM "Media"').get().total;
  const list = cards(await Page({ params: Promise.resolve({ locale: 'fr' }) }));
  assert.equal(list.length, 3);
  assert.equal(list.find(row => row.id === 'pa').media[0].id, 'photo-00');
  assert.equal(list.find(row => row.id === 'pb').media[0].id, 'fallback');
  assert.deepEqual(list.find(row => row.id === 'hidden').media, []);
  assert.ok(list.every(row => row.media.length <= 1 && row.media.every(item => item.type === 'PHOTO')));
  setSession({ user: { id: 'a' } });
  const updated = await resource.PATCH(new Request('http://localhost/api/test', {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: '/photos/80.jpg', category: 'principal', order: 0 })
  }), { params: Promise.resolve({ id: 'pa', resource: 'media', resourceId: 'photo-80' }) });
  assert.equal(updated.status, 200);
  const after = cards(await Page({ params: Promise.resolve({ locale: 'es' }) }));
  assert.equal(after.find(row => row.id === 'pa').media[0].id, 'photo-00', 'El orden de biblioteca no cambia la portada explícita.');
  const context = id => ({ params: Promise.resolve({ id }) });
  const put = (mediaIds, id = 'pa') => cover.PUT(new Request('http://localhost/api/test', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mediaIds }) }), context(id));
  const get = id => cover.GET(new Request('http://localhost/api/test'), context(id));
  setSession(null); assert.equal((await put([])).status, 401); assert.equal((await get('pa')).status, 401);
  setSession({ user: { id: 'client' } }); assert.equal((await put([])).status, 403); assert.equal((await get('pa')).status, 403);
  setSession({ user: { id: 'a' } }); assert.equal((await put([], 'pb')).status, 404); assert.equal((await get('pb')).status, 404);
  for (const ids of [['video'], ['fallback'], ['missing'], ['photo-00', 'photo-00'], [''], Array.from({ length: 6 }, (_, i) => `photo-0${i}`)]) assert.equal((await put(ids)).status, 400);
  const library = memory.prepare('SELECT id,category,"order" FROM "Media" ORDER BY id').all();
  const selection = ['photo-04', 'photo-01', 'other', 'photo-80', 'photo-03'];
  assert.equal((await put(selection)).status, 200);
  assert.deepEqual((await (await get('pa')).json()).mediaIds, selection);
  let selected = cards(await Page({ params: Promise.resolve({ locale: 'es' }) }));
  assert.deepEqual(selected.find(row => row.id === 'pa').media.map(photo => photo.id), selection);
  const reordered = [...selection].reverse();
  assert.equal((await put(reordered)).status, 200);
  selected = cards(await Page({ params: Promise.resolve({ locale: 'fr' }) }));
  assert.deepEqual(selected.find(row => row.id === 'pa').media.map(photo => photo.id), reordered);
  assert.deepEqual(memory.prepare('SELECT id,category,"order" FROM "Media" ORDER BY id').all(), library);
  assert.equal((await put([])).status, 200);
  selected = cards(await Page({ params: Promise.resolve({ locale: 'en' }) }));
  assert.equal(selected.find(row => row.id === 'pa').media.length, 1);
  assert.equal(selected.find(row => row.id === 'pa').media[0].id, 'other', 'Fallback por order/id, sin categoría preferente.');
  setSession({ user: { id: 'admin' } }); assert.equal((await put(['fallback'], 'pb')).status, 200);
  assert.equal(memory.prepare('SELECT count(*) AS total FROM "Media"').get().total, before);
  assert.equal(memory.prepare('SELECT count(*) AS total FROM "Media" WHERE "propertyId"=?').get('pa').total, 83);
  // Render de la card y del selector en los tres idiomas, con cinco fotos.
  setSession({ user: { id: 'a' } }); assert.equal((await put(selection)).status, 200);
  const React = req('react'), { renderToStaticMarkup } = req('react-dom/server');
  const { NextIntlClientProvider } = req('next-intl');
  const Card = load('apps/web/src/components/PropertyCard.tsx').default;
  const Editor = load('apps/web/src/components/panel/CoverEditor.tsx').default;
  const photos = memory.prepare('SELECT * FROM "Media" WHERE "propertyId"=? AND type=? ORDER BY "order",id').all('pa', 'PHOTO');
  for (const locale of ['es', 'en', 'fr']) {
    setLocale(locale);
    const messages = JSON.parse(fs.readFileSync(path.join(__dirname, '../apps/web/messages', locale + '.json'), 'utf8'));
    const render = element => renderToStaticMarkup(React.createElement(NextIntlClientProvider, { locale, messages, timeZone: 'America/Mexico_City', onError(error) { throw error; } }, element));
    const selectedProperty = cards(await Page({ params: Promise.resolve({ locale }) })).find(row => row.id === 'pa');
    const card = render(React.createElement(Card, { property: selectedProperty }));
    assert.equal((card.match(/<img\b/g) || []).length, 5);
    assert.ok(card.indexOf('/photos/4.jpg') < card.indexOf('/photos/1.jpg'));
    const editor = render(React.createElement(Editor, { propertyId: 'pa', photos }));
    assert.equal((editor.match(/type="checkbox"/g) || []).length, 82);
    assert.equal((editor.match(/checked=""/g) || []).length, 5);
    assert.ok(editor.includes(messages.coverEditor.title));
    assert.ok(!editor.includes('type="file"'));
  }
  // Handlers del selector real: límite de cinco, quitar/agregar y mover sin subir.
  const hooks = []; let cursor = 0;
  mockModule('react', { ...React, useState(initial) {
    const slot = cursor++;
    if (!(slot in hooks)) hooks[slot] = typeof initial === 'function' ? initial() : initial;
    return [hooks[slot], value => { hooks[slot] = typeof value === 'function' ? value(hooks[slot]) : value; }];
  } });
  mockModule('next-intl', { ...req('next-intl'), useTranslations: () => key => key });
  const InteractiveEditor = load('apps/web/src/components/panel/CoverEditor-interactive.tsx', fs.readFileSync(path.join(__dirname, '../apps/web/src/components/panel/CoverEditor.tsx'), 'utf8')).default;
  const emptyPhotos = photos.map(photo => ({ ...photo, isCover: false, coverOrder: null }));
  const renderInteractive = () => { cursor = 0; return InteractiveEditor({ propertyId: 'pa', photos: emptyPhotos }); };
  function nodes(node, predicate, result = []) {
    if (!node || typeof node !== 'object') return result;
    if (predicate(node)) result.push(node);
    for (const child of [node.props?.children].flat(Infinity)) nodes(child, predicate, result);
    return result;
  }
  for (let i = 0; i < 5; i++) nodes(renderInteractive(), node => node.props?.type === 'checkbox')[i].props.onChange();
  let checkboxes = nodes(renderInteractive(), node => node.props?.type === 'checkbox');
  assert.equal(checkboxes[5].props.disabled, true);
  checkboxes[5].props.onChange(); assert.equal(hooks[0].length, 5);
  const originalIds = [...hooks[0]];
  nodes(renderInteractive(), node => node.type === 'button' && node.props.children === 'down')[0].props.onClick();
  assert.deepEqual(hooks[0].slice(0, 2), [originalIds[1], originalIds[0]]);
  checkboxes = nodes(renderInteractive(), node => node.props?.type === 'checkbox');
  checkboxes[0].props.onChange(); assert.equal(hooks[0].length, 4);
  checkboxes = nodes(renderInteractive(), node => node.props?.type === 'checkbox');
  assert.equal(checkboxes[5].props.disabled, false);
  checkboxes[5].props.onChange(); assert.equal(hooks[0].length, 5);
  console.log('OK: backfill, 80+ fotos, cinco portadas ordenadas, permisos 401/403/404, validación PHOTO/duplicados/límite, fallback y biblioteca intacta.');
}
main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => memory.close());
