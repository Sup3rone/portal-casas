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
    assert.equal((standalone.match(/aria-pressed="false"/g) || []).length, 6, 'Solo seis interruptores opcionales en riel');
    assert.equal((standalone.match(/aria-pressed="true"/g) || []).length, 1, 'Reserva solo tiene interruptor en riel');
    for (const card of standalone.matchAll(/<(?:form|section) id="property-module-[\s\S]*?<\/(?:form|section)>/g)) {
      assert.ok(!card[0].includes('aria-pressed='), 'Tarjetas sin interruptor propio');
      assert.ok(card[0].includes('aria-describedby='), 'Estado de lectura asociado a la tarjeta');
    }
    assert.match(standalone, /aria-pressed="true"[^>]*disabled=""/);
    assert.ok(standalone.includes(messages.panelSections.reservationRequired));
    const translate = req('next-intl').createTranslator({locale,messages,namespace:'panelSections'});
    assert.ok(standalone.includes(translate('visibleCount',{active:1,inactive:6})));
    assert.equal((standalone.match(/<(?:section|form)[^>]* id="property-module-/g)||[]).length,1,'Solo Reserva en lista vacía');
    assert.ok(standalone.includes('aria-disabled="true" tabindex="-1"'),'Nombres inactivos no navegan');
    const card = html => html.match(new RegExp(`<form[^>]* id="property-module-${fresh.id}-amenidades"[\\s\\S]*?</form>`))[0];
    assert.ok(!standalone.includes(`id="property-module-${fresh.id}-amenidades"`), 'Desactivada ausente del DOM');
    const expanded = renderToStaticMarkup(wrap(React.createElement(Editor, { propertyId: fresh.id, sections: [], media: [], modules: { ...sectionModules(fresh, [], []), amenidades: true } })));
    assert.doesNotMatch(card(expanded), /<div hidden=""/, 'Estado activado por riel expande los campos');
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
  mockModule('react', { ...React, useState: initial => { const slot = index++; if (!(slot in states)) states[slot] = initial; return [states[slot], value => { states[slot] = typeof value === 'function' ? value(states[slot]) : value; }]; } });
  mockModule('next-intl', { useTranslations: () => (key, values) => key === 'visibleCount' ? `${key}:${values.active}:${values.inactive}` : key });
  mockModule('@/i18n/navigation', { useRouter: () => ({ refresh() { refreshes++; } }) });
  const Interactive = load('apps/web/src/components/panel/PropertySectionsEditor-modules-test.tsx', fs.readFileSync('apps/web/src/components/panel/PropertySectionsEditor.tsx', 'utf8')).default;
  const render = (amenidades = true) => { index = 0; return Interactive({ propertyId: 'pa', sections: [], media: [], modules: { ...emptySectionModules(), destino: true, amenidades, lugar: true } }); };
  // Ejecuta también SectionForm: antes solo se comprobaban sus props, no los campos.
  function assertEditableCard(card, expectedText = '') {
    const parentIndex = index;
    index = 30;
    states.splice(30); // Nuevo montaje del formulario, como al reactivar.
    const form = card.type(card.props);
    index = parentIndex;
    function visibleFields(node, hidden = false) {
      if (!node || typeof node !== 'object') return [];
      const concealed = hidden || node.props?.hidden === true;
      return [...(!concealed && node.type === 'textarea' ? [node] : []), ...React.Children.toArray(node.props?.children).flatMap(child => visibleFields(child, concealed))];
    }
    assert.ok(!nodes(form).some(node => Object.hasOwn(node.props, 'hidden')), 'Tarjeta montada sin segunda compuerta de ocultamiento');
    const fields = visibleFields(form);
    assert.deepEqual(fields.map(field => field.props.name), ['descriptionEs','descriptionEn','descriptionFr']);
    assert.ok(fields.every(field => !field.props.disabled), 'Campos editables, sin ancestro hidden');
    assert.equal(fields[0].props.defaultValue, expectedText);
    assert.ok(nodes(form).some(node => node.type === 'fieldset' && !node.props.disabled), 'Selector de fotos presente');
  }
  assertEditableCard(nodes(render()).find(node => node.props.name === 'amenidades'));
  const nativeFetch = global.fetch;
  const railButton = () => nodes(nodes(render()).find(node => node.props['data-module'] === 'amenidades')).find(node => node.type === 'button');
  try {
    let payload;
    global.fetch = async (url, options) => { payload = JSON.parse(options.body); return Response.json({ error: 'error' }, { status: 500 }); };
    railButton().props.onClick();
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(nodes(render()).find(node => node.props.name === 'amenidades').props.enabled, true); assert.equal(refreshes, 0);
    global.fetch = async (url, options) => { payload = JSON.parse(options.body); return Response.json({ success: true }); };
    railButton().props.onClick();
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(payload.sectionsEnabled.amenidades, false); assert.equal(payload.sectionsEnabled.reserva, true);
    assert.ok(!nodes(render()).some(node => node.props.name === 'amenidades')); assert.equal(refreshes, 1);
    const reservation = nodes(render()).find(node => node.type === 'button' && node.props.title);
    assert.equal(reservation.props.disabled, true); await reservation.props.onClick(); assert.equal(refreshes, 1);
    assert.equal(railButton().props['aria-pressed'], false);
    let resolve;
    global.fetch = () => new Promise(done => { resolve = done; });
    railButton().props.onClick();
    assert.equal(nodes(render()).find(node => node.props.name === 'amenidades').props.enabled, true, 'Riel refleja inmediatamente en encabezado antes de respuesta');
    assert.equal(railButton().props['aria-pressed'], true);
    resolve(Response.json({ success: true })); await new Promise(done => setImmediate(done));
    // Borradores y orden se conservan al desmontar/reactivar desde el riel.
    let card = nodes(render()).find(node => node.props.name === 'amenidades');
    card.props.onDraft({ descriptionEs: 'Borrador sin guardar', photoMediaIds: ['foto'] });
    const initialOrder = [...states[4]];
    railButton().props.onClick();
    assert.ok(!nodes(render()).some(node => node.props.name === 'amenidades'));
    assert.ok(nodes(render()).some(node => node.props.children === 'visibleCount:3:4'),'Conteo actualizado al apagar');
    const disabledLink = nodes(render()).find(node => node.props.id === 'rail-property-module-pa-amenidades');
    assert.equal(disabledLink.props['aria-disabled'], true); assert.equal(disabledLink.props.href, undefined);
    disabledLink.props.onClick({preventDefault(){}}); // Sin DOM ni navegación al estar apagado.
    resolve(Response.json({success:true})); await new Promise(done => setImmediate(done));
    assert.deepEqual(states[4], initialOrder); assert.ok(!('sectionsOrder' in payload));
    railButton().props.onClick(); resolve(Response.json({success:true})); await new Promise(done => setImmediate(done));
    card = nodes(render()).find(node => node.props.name === 'amenidades');
    assertEditableCard(card, 'Borrador sin guardar');
    assert.equal(card.props.value.descriptionEs,'Borrador sin guardar'); assert.deepEqual(card.props.value.photoMediaIds,['foto']);
    assert.equal(card.props.revealed,true); assert.deepEqual(states[4],initialOrder);
    assert.deepEqual(nodes(render()).filter(node=>node.props.name).map(node=>node.props.name),['destino','amenidades','lugar'],'Reactivada vuelve al puesto original entre vecinas');
    const count = nodes(render()).find(node => node.type === 'p' && node.props.children === 'visibleCount:4:3');
    assert.ok(count);
    const menu = nodes(render()).find(node => node.props['aria-expanded'] !== undefined);
    assert.equal(menu.props['aria-expanded'], false); menu.props.onClick();
    assert.equal(nodes(render()).find(node => node.props['aria-expanded'] !== undefined).props['aria-expanded'], true);
    const nativeWindow = global.window, nativeDocument = global.document;
    try {
      let reduced = false, scrolled, prevented = false;
      global.window = { matchMedia: () => ({ matches: reduced }) };
      global.document = { getElementById: id => ({ scrollIntoView(options) { scrolled = { id, ...options }; } }) };
      const link = nodes(render()).find(node => node.type === 'a' && node.props.href?.endsWith('-amenidades'));
      link.props.onClick({ preventDefault() { prevented = true; } });
      assert.ok(prevented); assert.equal(scrolled.id, 'property-module-pa-amenidades'); assert.equal(scrolled.behavior, 'smooth');
      reduced = true; link.props.onClick({ preventDefault() {} }); assert.equal(scrolled.behavior, 'instant');
      const nativeFrame=global.requestAnimationFrame;
      try {
        let top=900; scrolled=null; global.window.innerHeight=800;
        global.requestAnimationFrame=callback=>callback();
        global.document={getElementById:id=>({getBoundingClientRect:()=>({top,bottom:top+200}),scrollIntoView(options){scrolled={id,...options};}})};
        railButton().props.onClick(); resolve(Response.json({success:true})); await new Promise(done=>setImmediate(done));
        railButton().props.onClick(); resolve(Response.json({success:true})); await new Promise(done=>setImmediate(done));
        assert.equal(scrolled.block,'nearest'); assert.equal(scrolled.behavior,'instant','Reduced-motion sin scroll animado');
        top=100; scrolled=null;
        railButton().props.onClick(); resolve(Response.json({success:true})); await new Promise(done=>setImmediate(done));
        railButton().props.onClick(); resolve(Response.json({success:true})); await new Promise(done=>setImmediate(done));
        assert.equal(scrolled,null,'Sin auto-scroll si la tarjeta ya está en vista');
      } finally {global.requestAnimationFrame=nativeFrame;}
    } finally { global.window = nativeWindow; global.document = nativeDocument; }
    // Nueva sesión del editor con Amenidades apagada: activar sin recargar otra vez.
    states.length = 0; render(false);
    assert.ok(!nodes(render()).some(node => node.props.name === 'amenidades'));
    global.fetch = async () => Response.json({ success: true });
    railButton().props.onClick(); await new Promise(done => setImmediate(done));
    assertEditableCard(nodes(render()).find(node => node.props.name === 'amenidades'));
  } finally { global.fetch = nativeFetch; }
  console.log('OK UI módulos: feedback de fallo, guardado automático, contracción y Reserva bloqueada.');
}
main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => memory.close());
