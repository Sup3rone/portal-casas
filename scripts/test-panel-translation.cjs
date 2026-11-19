// T-5072: traducción automática al guardar (sin botón «Traducir»). Sin red ni BD real: DeepL simulado con
// global.fetch y SQLite en memoria. Comprueba reglas (vacío/automático/manual), retraducción al cambiar el español,
// fallos del proveedor, marcadores {summary}, los cuatro guardados y que el botón y MyMemory ya no existen.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { load, memory, setSession } = require('./test-property-access.cjs');
const plan = load('apps/web/src/lib/auto-translation-plan.ts');
const groupsLib = load('apps/web/src/lib/translation-groups.ts');
const auto = load('apps/web/src/lib/auto-translation.ts');
const propertyRoute = load('apps/web/src/app/api/properties/[id]/route.ts');
const createRoute = load('apps/web/src/app/api/properties/route.ts');
const sectionRoute = load('apps/web/src/app/api/properties/[id]/sections/[section]/route.ts');
const siteRoute = load('apps/web/src/app/api/panel/site-content/route.ts');
const pageRoute = load('apps/web/src/app/api/panel/page-content/route.ts');
const store = load('apps/web/src/lib/page-content-store.ts');

const originalFetch = global.fetch;
let calls = [], failWith = null;
// DeepL falso: «[EN-US] texto» / «[FR] texto», respetando las etiquetas <keep>.
global.fetch = async (url, options) => {
  if (!String(url).includes('deepl.com')) return originalFetch(url, options);
  const body = JSON.parse(options.body);
  calls.push({ url: String(url), auth: options.headers.Authorization, ...body });
  if (failWith) return new Response('{}', { status: failWith });
  return Response.json({ translations: body.text.map(text => ({ text: `[${body.target_lang}] ${text}` })) });
};
const request = (body, method = 'PATCH') => new Request('http://localhost/test', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
const row = id => memory.prepare('SELECT * FROM "Property" WHERE id = ?').get(id);
const states = prefix => memory.prepare('SELECT key FROM "AutoTranslation" WHERE key LIKE ? ORDER BY key').all(prefix + '%').map(r => r.key);
const texts = { titleEs: 'Casa del mar', titleEn: '', titleFr: '', descEs: 'Frente a la playa', descEn: '', descFr: '' };
const patch = async (id, body) => { const response = await propertyRoute.PATCH(request(body), { params: Promise.resolve({ id }) }); return { status: response.status, data: await response.json() }; };

async function main() {
  // --- Reglas puras ---
  const { textHash, stateKey, planTranslations, applyTranslations, autoTranslatedKeys, protectPlaceholders, restorePlaceholders, PENDING_SOURCE } = plan;
  const g = { key: 'k', es: 'Hola', en: '', fr: 'Bonjour a mano' };
  let planned = planTranslations([g], new Map());
  assert.deepEqual(planned.jobs, [{ group: 0, language: 'en' }], 'Vacío se traduce; escrito a mano (sin estado) se respeta');
  const autoState = { sourceHash: textHash('Hola'), valueHash: textHash('Hello') };
  planned = planTranslations([{ ...g, en: 'Hello' }], new Map([[stateKey('k', 'en'), autoState]]));
  assert.deepEqual(planned.jobs, [], 'Automático y al día: no se vuelve a pedir');
  planned = planTranslations([{ ...g, es: 'Hola amigo', en: 'Hello' }], new Map([[stateKey('k', 'en'), autoState]]));
  assert.deepEqual(planned.jobs, [{ group: 0, language: 'en' }], 'Cambió el español: el automático se retraduce');
  planned = planTranslations([{ ...g, es: 'Hola amigo', en: 'Hello, edited' }], new Map([[stateKey('k', 'en'), autoState]]));
  assert.deepEqual(planned.jobs, [], 'Editado a mano: no se toca aunque cambie el español');
  planned = planTranslations([{ ...g, es: '', en: 'Hello' }], new Map([[stateKey('k', 'en'), autoState]]));
  assert.deepEqual(planned.clears, [{ group: 0, language: 'en' }], 'Sin español, lo automático se vacía');
  let applied = applyTranslations([{ key: 'k', es: 'Hola', en: '', fr: '' }], [{ group: 0, language: 'en' }, { group: 0, language: 'fr' }], ['Hello', null], []);
  assert.equal(applied.outcome, 'pending'); assert.equal(applied.groups[0].en, 'Hello'); assert.equal(applied.groups[0].fr, 'Hola', 'Fallo: el idioma vacío lleva el español');
  assert.equal(applied.writes.get('k:fr').sourceHash, PENDING_SOURCE, 'Pendiente: se reintenta al volver a guardar');
  applied = applyTranslations([{ key: 'k', es: 'Hola', en: '', fr: '', copySource: false }], [{ group: 0, language: 'en' }], [null], []);
  assert.equal(applied.groups[0].en, '', 'Páginas: sin copia del español (vale el texto por defecto)');
  applied = applyTranslations([{ key: 'k', es: 'Hola', en: '', fr: '', maxLength: 3 }], [{ group: 0, language: 'en' }], ['Hello'], []);
  assert.equal(applied.outcome, 'pending', 'Traducción más larga que el límite: no se guarda');
  assert.deepEqual(autoTranslatedKeys([{ key: 'k', es: 'Hola', en: 'Hello', fr: 'Salut' }], new Map([[stateKey('k', 'en'), autoState]])), ['k:en']);
  assert.equal(restorePlaceholders('<keep>{summary}</keep> &amp; &lt;b&gt;'), '{summary} & <b>');
  assert.equal(protectPlaceholders('Hola {summary} & <b>'), 'Hola <keep>{summary}</keep> &amp; &lt;b&gt;');
  assert.equal(groupsLib.fieldNameForKey('property:pa:title:en'), 'titleEn');
  assert.equal(groupsLib.fieldNameForKey('section:pa:destino:fr'), 'descriptionFr');
  assert.equal(groupsLib.fieldNameForKey('site:about_title:en'), 'about_title_en');
  assert.equal(groupsLib.fieldNameForKey('page:join:join.owners.whatsappMessage:fr'), 'fr:join.owners.whatsappMessage');

  // --- Propiedad: PATCH con DeepL Free (clave :fx → api-free), en/fr vacíos se traducen y se recuerdan ---
  process.env.DEEPL_API_KEY = 'clave-de-prueba:fx';
  setSession({ user: { id: 'a' } });
  let result = await patch('pa', texts);
  assert.equal(result.status, 200); assert.equal(result.data.translation, 'translated');
  assert.equal(calls.length, 2, 'Una petición por idioma con título y descripción juntos');
  assert.ok(calls.every(call => call.url === 'https://api-free.deepl.com/v2/translate' && call.auth === 'DeepL-Auth-Key clave-de-prueba:fx' && call.source_lang === 'ES' && call.tag_handling === 'xml'));
  assert.deepEqual(calls.map(call => call.target_lang), ['EN-US', 'FR']);
  assert.equal(row('pa').titleEn, '[EN-US] Casa del mar'); assert.equal(row('pa').descFr, '[FR] Frente a la playa');
  assert.deepEqual(states('property:pa:'), ['property:pa:desc:en', 'property:pa:desc:fr', 'property:pa:title:en', 'property:pa:title:fr']);
  assert.deepEqual([...await auto.readAutoTranslated(groupsLib.propertyGroups('pa', row('pa')))].sort(), states('property:pa:'), 'El panel ve los cuatro como automáticos');

  // Mismo español y en/fr intactos (el formulario reenvía lo guardado): no se llama a DeepL.
  calls = [];
  result = await patch('pa', { ...texts, titleEn: row('pa').titleEn, titleFr: row('pa').titleFr, descEn: row('pa').descEn, descFr: row('pa').descFr });
  assert.equal(result.data.translation, 'none'); assert.equal(calls.length, 0);

  // Cambia el español; el inglés del título se editó a mano: se respeta. El resto, automático, se retraduce.
  calls = [];
  result = await patch('pa', { ...texts, titleEs: 'Casa del mar azul', titleEn: 'Blue sea house', titleFr: row('pa').titleFr, descEn: row('pa').descEn, descFr: row('pa').descFr });
  assert.equal(result.data.translation, 'translated');
  assert.equal(row('pa').titleEn, 'Blue sea house', 'Manual: intacto');
  assert.equal(row('pa').titleFr, '[FR] Casa del mar azul', 'Automático: retraducido');
  assert.equal(row('pa').descEn, '[EN-US] Frente a la playa', 'Su español no cambió: intacto');
  assert.ok(!(await auto.readAutoTranslated(groupsLib.propertyGroups('pa', row('pa')))).has('property:pa:title:en'), 'El manual pierde la etiqueta');

  // PATCH sin textos (p. ej. publicar): no traduce.
  calls = [];
  result = await patch('pa', { maxGuests: 6 });
  assert.equal(result.data.translation, 'none'); assert.equal(calls.length, 0);

  // DeepL caído: se guarda igual; los vacíos llevan el español y quedan pendientes; al volver a guardar, se traducen.
  setSession({ user: { id: 'b' } }); // pb es del colaborador b
  failWith = 503; calls = [];
  result = await patch('pb', { ...texts, titleEs: 'Villa', descEs: 'Jardín' });
  assert.equal(result.status, 200); assert.equal(result.data.translation, 'pending');
  assert.equal(row('pb').titleEn, 'Villa'); assert.equal(row('pb').descFr, 'Jardín');
  failWith = null; calls = [];
  result = await patch('pb', { titleEs: 'Villa', titleEn: 'Villa', titleFr: 'Villa', descEs: 'Jardín', descEn: 'Jardín', descFr: 'Jardín' });
  assert.equal(result.data.translation, 'translated'); assert.equal(row('pb').titleEn, '[EN-US] Villa'); assert.equal(row('pb').descFr, '[FR] Jardín');

  // Sin clave configurada: igual que caído (pendiente), sin llamar a nadie.
  setSession({ user: { id: 'a' } });
  delete process.env.DEEPL_API_KEY; calls = [];
  result = await patch('hidden', { ...texts, titleEs: 'Oculta' });
  assert.equal(result.data.translation, 'pending'); assert.equal(calls.length, 0); assert.equal(row('hidden').titleEn, 'Oculta');
  process.env.DEEPL_API_KEY = 'clave-pro';

  // Validación: solo el español es obligatorio.
  result = await patch('pa', { ...texts, titleEs: '  ' });
  assert.equal(result.status, 400);

  // --- Alta: en/fr vacíos llegan traducidos a la ficha nueva (clave de pago → api.deepl.com) ---
  calls = [];
  const created = await createRoute.POST(request({ ...texts, titleEs: 'Loft', address: 'Centro', maxGuests: 2, bedrooms: 1, bathrooms: 1, rentalType: 'nocturna' }, 'POST'));
  const createdData = await created.json();
  assert.equal(created.status, 201); assert.equal(createdData.translation, 'translated');
  assert.ok(calls.every(call => call.url === 'https://api.deepl.com/v2/translate'), 'Clave sin :fx → API de pago');
  assert.equal(row(createdData.id).titleEn, '[EN-US] Loft');
  assert.equal(states(`property:${createdData.id}:`).length, 4);

  // --- Secciones de la ficha ---
  calls = [];
  let response = await sectionRoute.PUT(request({ descriptionEs: 'Playa a 5 minutos', descriptionEn: null, descriptionFr: 'À la main', heroMediaId: null }, 'PUT'), { params: Promise.resolve({ id: 'pa', section: 'destino' }) });
  assert.equal(response.status, 200); assert.equal((await response.json()).translation, 'translated');
  const section = memory.prepare(`SELECT * FROM "PropertySection" WHERE "propertyId" = 'pa' AND section = 'destino'`).get();
  assert.equal(section.descriptionEn, '[EN-US] Playa a 5 minutos'); assert.equal(section.descriptionFr, 'À la main', 'Francés escrito a mano: intacto');
  assert.equal(calls.length, 1);

  // --- Sobre nosotros (SiteContent), solo ADMIN ---
  setSession({ user: { id: 'admin' } }); calls = [];
  response = await siteRoute.PUT(request({ about_es: 'Somos ALIA', about_en: '', about_fr: '', about_title_es: 'Quiénes somos', about_title_en: '', about_title_fr: '', social_instagram: '', social_facebook: '', featured_property_id: '', contact_whatsapp: '' }, 'PUT'));
  assert.equal(response.status, 200); assert.equal((await response.json()).translation, 'translated');
  const site = Object.fromEntries(memory.prepare('SELECT key, value FROM "SiteContent"').all().map(r => [r.key, r.value]));
  assert.equal(site.about_en, '[EN-US] Somos ALIA'); assert.equal(site.about_title_fr, '[FR] Quiénes somos');

  // --- Páginas: textos propios en español se traducen; {summary} sobrevive; vacío sigue siendo el texto por defecto ---
  calls = [];
  response = await pageRoute.PUT(request({ page: 'join', texts: { es: { 'join.owners.whatsappMessage': 'Hola, quiero rentar. {summary}' }, en: {}, fr: {} } }, 'PUT'));
  assert.equal(response.status, 200); assert.equal((await response.json()).translation, 'translated');
  assert.ok(calls[0].text[0].includes('<keep>{summary}</keep>'), 'El marcador viaja protegido');
  let saved = await store.readPageContent('join');
  assert.equal(saved.texts.en['join.owners.whatsappMessage'], '[EN-US] Hola, quiero rentar. {summary}');
  assert.equal(Object.keys(saved.texts.en).length, 1, 'Solo se traduce lo que tiene texto propio en español');
  failWith = 500;
  response = await pageRoute.PUT(request({ page: 'about', texts: { es: { 'about.ctaTitle': 'Ven a vernos' }, en: {}, fr: {} } }, 'PUT'));
  assert.equal((await response.json()).translation, 'pending');
  saved = await store.readPageContent('about');
  assert.deepEqual(saved.texts.en, {}, 'Fallo en Páginas: inglés vacío (texto por defecto), no el español');
  failWith = null;

  // --- Sin la tabla (SQL sin aplicar): se guarda igual y solo se rellenan los vacíos ---
  memory.exec('ALTER TABLE "AutoTranslation" RENAME TO "AutoTranslationOff"');
  setSession({ user: { id: 'a' } }); calls = [];
  result = await patch('pa', { ...texts, titleEs: 'Casa sin tabla', titleEn: 'Blue sea house', titleFr: '' });
  assert.equal(result.status, 200); assert.equal(row('pa').titleFr, '[FR] Casa sin tabla'); assert.equal(row('pa').titleEn, 'Blue sea house');
  memory.exec('ALTER TABLE "AutoTranslationOff" RENAME TO "AutoTranslation"');

  // --- Fuera el botón, la ruta y MyMemory; SQL presente ---
  for (const file of ['apps/web/src/components/panel/TranslationDraftButton.tsx', 'apps/web/src/app/api/traducir/route.ts', 'apps/web/src/lib/panel-translation.ts', 'apps/web/src/lib/panel-translation-drafts.ts']) assert.ok(!fs.existsSync(file), `${file} eliminado`);
  for (const file of ['PropertyForm', 'PropertySectionsEditor', 'SiteContentEditor', 'PageContentEditor']) {
    const source = fs.readFileSync(`apps/web/src/components/panel/${file}.tsx`, 'utf8');
    assert.ok(source.includes('AutoTranslatedTag') && source.includes('AutoTranslationHint') && source.includes('savedKey'), `${file}: etiqueta, nota y aviso de traducción`);
  }
  assert.ok(!/mymemory.translated.net/.test(fs.readFileSync('apps/web/src/lib/auto-translation.ts', 'utf8')), 'Sin llamadas a MyMemory');
  assert.match(fs.readFileSync('scripts/sql/auto-translation.sql', 'utf8'), /CREATE TABLE IF NOT EXISTS "AutoTranslation"/);
  for (const locale of ['es', 'en', 'fr']) {
    const messages = JSON.parse(fs.readFileSync(`apps/web/messages/${locale}.json`, 'utf8'));
    assert.ok(messages.panelTranslation.auto && messages.panelTranslation.hint && messages.panel.savedTranslated && messages.panel.savedTranslationPending, `${locale}: textos`);
  }
  global.fetch = originalFetch;
  console.log('OK traducción al guardar T-5072: vacío/automático/manual, retraducción, DeepL Free/Pro, fallo y sin clave, propiedad (alta y edición), secciones, Sobre nosotros, Páginas con {summary}, sin tabla y sin botón.');
}
main().catch(error => { console.error(error); process.exit(1); });
