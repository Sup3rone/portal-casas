// Handlers/SQL en memoria y SSR/eventos simulados, sin navegador ni Neon.
const assert = require('node:assert/strict'), fs = require('node:fs');
const { load, req, memory, setSession, setLocale, mockModule } = require('./test-property-access.cjs');
const { sectionModules, emptySectionModules, moduleNames } = load('apps/web/src/lib/section-modules.ts');
const create = load('apps/web/src/app/api/properties/route.ts');
const patch = load('apps/web/src/app/api/properties/[id]/route.ts');
const { managedProperty } = load('apps/web/src/lib/panel-server.ts');
const Page = load('apps/web/src/app/[locale]/casas/[slug]/page.tsx').default;
const EditorPage = load('apps/web/src/app/[locale]/panel/propiedades/[id]/page.tsx').default;
const Editor = load('apps/web/src/components/panel/PropertySectionsEditor.tsx').default;
const React = req('react'), { renderToReadableStream, renderToStaticMarkup } = req('react-dom/server');
const { NextIntlClientProvider } = req('next-intl');
const request = (body, method = 'PATCH') => new Request('http://localhost/test', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
const context = id => ({ params: Promise.resolve({ id }) });
const nodes = tree => !tree || typeof tree !== 'object' ? [] : [tree, ...React.Children.toArray(tree.props?.children).flatMap(nodes)];
const manager = { id: 'a', role: 'COLLABORATOR' };
async function main() {
  assert.deepEqual(sectionModules({}, [], []), emptySectionModules());
  assert.equal(sectionModules({ sectionsEnabled: { reserva: false } }, [], []).reserva, true);
  assert.equal(sectionModules({ lat: 0, lng: 0 }, [], []).mapa, true);
  assert.equal(sectionModules({ address: 'Calle guardada' }, [], []).destino, true);
  assert.equal(sectionModules({}, [{ section: 'amenidades', descriptionEs: 'WiFi', descriptionEn: null, descriptionFr: null }], []).amenidades, true);
  assert.equal(sectionModules({}, [], [{ id: 'video', type: 'VIDEO', category: 'habitaciones' }]).habitaciones, true);
  setSession({ user: { id: 'a' } });
  const created = await create.POST(request({ titleEs: 'Nueva', titleEn: 'New', titleFr: 'Nouvelle', descEs: 'Texto', descEn: 'Text', descFr: 'Texte', address: 'Calle', maxGuests: 2, bedrooms: 1, bathrooms: 1 }, 'POST'));
  assert.equal(created.status, 201);
  const newId = (await created.json()).id;
  const fresh = await managedProperty(newId, manager);
  assert.deepEqual(fresh.sectionsEnabled, emptySectionModules(), 'Nueva incluso con ubicación básica: opcionales off');
  for (const actor of [null, 'client', 'b']) {
    setSession(actor ? { user: { id: actor } } : null);
    assert.equal((await patch.PATCH(request({ sectionsEnabled: { amenidades: false } }), context('pa'))).status, actor === null ? 401 : actor === 'b' ? 404 : 403);
  }
  setSession({ user: { id: 'a' } });
  for (const sectionsEnabled of [null, [], 'off', { extra: true }, { destino: 'false' }, { reserva: false }]) {
    assert.equal((await patch.PATCH(request({ sectionsEnabled }), context('pa'))).status, 400);
  }
  memory.prepare('UPDATE Property SET address=?,lat=20,lng=-105,descEs=?,descEn=?,descFr=? WHERE id=?').run('Dirección', 'Texto real', 'Real description', 'Description réelle', 'pa');
  memory.prepare('INSERT INTO Media (id,propertyId,url,type,category,"order") VALUES (?,?,?,?,?,?)').run('amenity-photo', 'pa', '/amenity.jpg', 'PHOTO', 'amenidades', 1);
  memory.prepare('INSERT INTO PropertySection (propertyId,section,descriptionEs,descriptionEn,descriptionFr,photoMediaIds) VALUES (?,?,?,?,?,?)')
    .run('pa', 'amenidades', 'WiFi real', 'Real WiFi', 'WiFi réel', '["amenity-photo"]');
  const stored = () => memory.prepare('SELECT * FROM PropertySection WHERE propertyId=? AND section=?').get('pa', 'amenidades');
  const snapshot = { ...stored() };
  assert.equal((await patch.PATCH(request({ sectionsEnabled: { amenidades: false, mapa: false, destino: false } }), context('pa'))).status, 200);
  assert.deepEqual({ ...stored() }, snapshot);
  // Un guardado independiente de títulos/configuración no borra los módulos.
  assert.equal((await patch.PATCH(request({ sectionTitles: null }), context('pa'))).status, 200);
  assert.equal((await managedProperty('pa', manager)).sectionsEnabled.amenidades, false);
  assert.equal((await patch.PATCH(request({ sectionsEnabled: { lugar: false } }), context('pa'))).status, 200);
  assert.equal((await managedProperty('pa', manager)).sectionsEnabled.mapa, false, 'PATCH parcial conserva otros interruptores');
  for (const locale of ['es', 'en', 'fr']) {
    setLocale(locale);
    const messages = JSON.parse(fs.readFileSync(`apps/web/messages/${locale}.json`, 'utf8'));
    const wrap = children => React.createElement(NextIntlClientProvider, { locale, messages, timeZone: 'America/Mexico_City', onError(error) { throw error; } }, children);
    const render = async tree => new Response(await renderToReadableStream(wrap(tree))).text();
    const html = await render(await Page({ params: Promise.resolve({ locale, slug: 'pa' }) }));
    assert.ok(!html.includes('data-editorial-slide="amenidades"')); assert.ok(!html.includes('Real WiFi')); assert.ok(!html.includes('WiFi réel'));
    assert.ok(!html.includes('maps.google.com')); assert.ok(html.includes('id="reservar"'));
    for (const href of [...html.matchAll(/href="#([^"]+)"/g)].map(match => match[1])) assert.ok(html.includes(`id="${href}"`), 'Sin anclas muertas');
    const panel = renderToStaticMarkup(wrap(await EditorPage({ params: Promise.resolve({ locale, id: 'pa' }) })));
    assert.ok(panel.includes(messages.panelSections.modulesHint));
    const standalone = renderToStaticMarkup(wrap(React.createElement(Editor, { propertyId: fresh.id, sections: [], media: [], modules: sectionModules(fresh, [], []) })));
    assert.equal((standalone.match(/aria-pressed="false"/g) || []).length, 6);
    assert.match(standalone, /aria-pressed="true"[^>]*disabled=""/);
    assert.ok(standalone.includes(messages.panelSections.reservationRequired));
  }
  assert.equal((await patch.PATCH(request({ sectionsEnabled: { amenidades: true, mapa: true, destino: true } }), context('pa'))).status, 200);
  assert.deepEqual({ ...stored() }, snapshot);
  const visible = await Page({ params: Promise.resolve({ locale: 'fr', slug: 'pa' }) });
  const messages = JSON.parse(fs.readFileSync('apps/web/messages/fr.json', 'utf8'));
  const visibleHtml = await new Response(await renderToReadableStream(React.createElement(NextIntlClientProvider, { locale: 'fr', messages, timeZone: 'UTC' }, visible))).text();
  assert.ok(visibleHtml.includes('data-editorial-slide="amenidades"')); assert.ok(visibleHtml.includes('WiFi réel')); assert.ok(visibleHtml.includes('/amenity.jpg')); assert.ok(visibleHtml.includes('maps.google.com'));
  assert.equal(memory.prepare('SELECT count(*) AS n FROM Media WHERE id=?').get('amenity-photo').n, 1);
  console.log('OK módulos: defaults, creación off, Reserva obligatoria, 401/403/404, persistencia sin borrar datos/fotos, PATCH parcial, SSR es/en/fr, render/anclas y reactivación.');

  // Eventos del interruptor real: fallo conserva estado; éxito contrae; reserva no envía.
  let index = 0, refreshes = 0; const states = [];
  mockModule('react', { ...React, useState: initial => { const slot = index++; if (!(slot in states)) states[slot] = initial; return [states[slot], value => { states[slot] = value; }]; } });
  mockModule('next-intl', { useTranslations: () => key => key });
  mockModule('@/i18n/navigation', { useRouter: () => ({ refresh() { refreshes++; } }) });
  const Interactive = load('apps/web/src/components/panel/PropertySectionsEditor-modules-test.tsx', fs.readFileSync('apps/web/src/components/panel/PropertySectionsEditor.tsx', 'utf8')).default;
  const render = () => { index = 0; return Interactive({ propertyId: 'pa', sections: [], media: [], modules: { ...emptySectionModules(), amenidades: true } }); };
  const nativeFetch = global.fetch;
  try {
    let payload;
    global.fetch = async (url, options) => { payload = JSON.parse(options.body); return Response.json({ error: 'error' }, { status: 500 }); };
    await nodes(render()).find(node => node.props.name === 'amenidades').props.toggle();
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(nodes(render()).find(node => node.props.name === 'amenidades').props.enabled, true); assert.equal(refreshes, 0);
    global.fetch = async (url, options) => { payload = JSON.parse(options.body); return Response.json({ success: true }); };
    await nodes(render()).find(node => node.props.name === 'amenidades').props.toggle();
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(payload.sectionsEnabled.amenidades, false); assert.equal(payload.sectionsEnabled.reserva, true);
    assert.equal(nodes(render()).find(node => node.props.name === 'amenidades').props.enabled, false); assert.equal(refreshes, 1);
    const reservation = nodes(render()).find(node => node.type === 'button' && node.props.title);
    assert.equal(reservation.props.disabled, true); await reservation.props.onClick(); assert.equal(refreshes, 1);
  } finally { global.fetch = nativeFetch; }
  console.log('OK UI módulos: feedback de fallo, guardado automático, contracción y Reserva bloqueada.');
}
main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => memory.close());
