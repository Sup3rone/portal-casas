// T-4944: textos e imágenes de /nosotros y /unete editables desde Panel → Contenido → Páginas.
// Validación, permisos, guardado aislado de saveSiteContent, lectura con respaldo y SSR. SQLite en memoria, sin Neon.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { load, memory, req, setLocale, setSession } = require('./test-property-access.cjs');
process.env.PUBLIC_SITE_URL = 'https://portal.test';
const React = req('react'), { renderToStaticMarkup } = req('react-dom/server'), { NextIntlClientProvider } = req('next-intl');
const lib = load('apps/web/src/lib/page-content.ts');
const store = load('apps/web/src/lib/page-content-store.ts');
const api = load('apps/web/src/app/api/panel/page-content/route.ts');
const siteApi = load('apps/web/src/app/api/panel/site-content/route.ts');
const about = load('apps/web/src/app/[locale]/nosotros/page.tsx');
const join = load('apps/web/src/app/[locale]/unete/page.tsx');
const ContentPage = load('apps/web/src/app/[locale]/panel/contenido/page.tsx').default;
const messagesFor = locale => JSON.parse(fs.readFileSync(`apps/web/messages/${locale}.json`, 'utf8'));
const render = (locale, tree) => renderToStaticMarkup(React.createElement(NextIntlClientProvider, { locale, messages: messagesFor(locale), timeZone: 'America/Mexico_City' }, tree));
const put = body => api.PUT(new Request('http://localhost/api/panel/page-content', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }));
const code = async response => (await response.json()).code;
const at = (object, key) => key.split('.').reduce((value, part) => value?.[part], object);
const esc = text => text.replace(/&/g, '&amp;').replace(/'/g, '&#x27;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

async function main() {
  // --- Cada campo editable existe en los 3 idiomas y es texto (si no, el editor mostraría huecos). ---
  for (const page of lib.pageContentPages) {
    const keys = lib.pageFields(page).map(field => field.key);
    assert.equal(new Set(keys).size, keys.length, `${page}: sin claves repetidas`);
    for (const locale of lib.pageContentLocales) for (const key of keys) assert.equal(typeof at(messagesFor(locale), key), 'string', `${locale} ${key}`);
    for (const locale of lib.pageContentLocales) for (const group of lib.pageContentGroups[page]) assert.equal(typeof at(messagesFor(locale).panelPages.groups, group.id), 'string', `${locale} grupo ${group.id}`);
  }
  for (const locale of lib.pageContentLocales) for (const role of ['eyebrow', 'title', 'help', 'text', 'button', 'whatsappMessage', 'optionTitle', 'optionText', 'option', 'optionOther', 'itemTitle', 'itemText', 'seoTitle', 'seoDescription']) assert.ok(messagesFor(locale).panelPages.roles[role], `${locale} rol ${role}`);
  assert.ok(lib.pageFields('join').some(field => field.key === 'join.quiz.rental.options.annual'));
  assert.ok(!lib.pageFields('join').some(field => /\.(back|progress|restart|keyHint)$/.test(field.key)), 'Las palabras de la interfaz no se editan');

  // --- Validación. ---
  const ok = lib.pageContentInput('about', { texts: { es: { 'about.ctaTitle': '  Ven a vernos  ', 'about.ctaText': '   ' }, en: {}, fr: {} }, images: { hero: 'https://qa.public.blob.vercel-storage.com/hero.jpg' } });
  assert.deepEqual(ok, { texts: { es: { 'about.ctaTitle': 'Ven a vernos' }, en: {}, fr: {} }, images: { hero: 'https://qa.public.blob.vercel-storage.com/hero.jpg' }, closed: false }, 'Recorta y descarta vacíos');
  assert.deepEqual(lib.pageContentInput('join', {}), lib.emptyPageContent());
  const rejects = (page, value, expected) => assert.throws(() => lib.pageContentInput(page, value), error => error.code === expected, JSON.stringify(value).slice(0, 80));
  rejects('about', null, 'INVALID_PAGE_CONTENT');
  rejects('about', [], 'INVALID_PAGE_CONTENT');
  rejects('about', { texts: {}, extra: 1 }, 'INVALID_PAGE_CONTENT');
  rejects('about', { texts: { de: {} } }, 'INVALID_PAGE_CONTENT');
  rejects('about', { texts: { es: { 'join.heroEyebrow': 'x' } } }, 'INVALID_PAGE_CONTENT');
  rejects('about', { texts: { es: { 'about.__proto__': 'x' } } }, 'INVALID_PAGE_CONTENT');
  rejects('about', { texts: { es: { 'about.ctaTitle': 5 } } }, 'INVALID_PAGE_CONTENT');
  rejects('about', { texts: { es: { 'about.ctaTitle': 'x'.repeat(201) } } }, 'PAGE_TEXT_TOO_LONG');
  assert.ok(lib.pageContentInput('about', { texts: { es: { 'about.ctaText': 'x'.repeat(1000) } } }));
  rejects('about', { texts: { es: { 'about.ctaText': 'x'.repeat(1001) } } }, 'PAGE_TEXT_TOO_LONG');
  rejects('about', { images: { side: 'https://x.test/a.jpg' } }, 'INVALID_PAGE_CONTENT');
  for (const url of ['http://x.test/a.jpg', 'javascript:alert(1)', 'https://user:pass@x.test/a.jpg', 'no es url']) rejects('about', { images: { hero: url } }, 'INVALID_PAGE_IMAGE');
  assert.deepEqual(lib.parsePageContent('join', '{roto'), lib.emptyPageContent(), 'JSON dañado = textos por defecto');
  assert.deepEqual(lib.parsePageContent('join', JSON.stringify({ texts: { es: { 'join.nope': 'x' } } })), lib.emptyPageContent());
  assert.deepEqual(lib.parsePageContent('join', ''), lib.emptyPageContent());

  // --- {summary} del mensaje de WhatsApp. ---
  assert.equal(lib.fillPageText('Hola. {summary}.', { summary: 'Tipo: Casa' }), 'Hola. Tipo: Casa.');
  assert.equal(lib.fillPageText('Quiero publicar mi casa.', { summary: 'Tipo: Casa' }), 'Quiero publicar mi casa. Tipo: Casa.', 'Sin {summary} las respuestas van al final');
  assert.equal(lib.fillPageText('Pregunta {current} de {total}', { current: 2, total: 4 }), 'Pregunta 2 de 4');
  assert.equal(lib.fillPageText('Sin datos {x}'), 'Sin datos {x}');

  // --- SQL sin aplicar: el CHECK de Postgres se traduce a un aviso claro. ---
  assert.equal(lib.isMissingPageContentSql({ message: 'Failed query', cause: { code: '23514', constraint: 'SiteContent_key_check', message: 'new row violates check constraint "SiteContent_key_check"' } }), true);
  assert.equal(lib.isMissingPageContentSql({ code: '23514', message: 'violates check constraint "SiteContent_key_check"' }), true);
  assert.equal(lib.isMissingPageContentSql({ code: '23505', message: 'duplicate key' }), false);
  assert.equal(lib.isMissingPageContentSql(new Error('red caída')), false);
  const sql = fs.readFileSync('scripts/sql/site-content-pages.sql', 'utf8');
  assert.ok(sql.includes("'page_about', 'page_join'") && sql.includes("'home_background_videos'"), 'SQL conserva las claves anteriores');
  assert.ok(fs.readFileSync('packages/db/src/schema.ts', 'utf8').includes("'home_background_videos', 'page_about', 'page_join')"));

  // --- Permisos: anónimo 401; colaborador, cliente y viewer 403; nada se guarda. ---
  const body = { page: 'about', texts: { es: { 'about.ctaTitle': 'Ven a vernos' } } };
  for (const id of [null, 'a', 'client', 'viewer']) {
    setSession(id ? { user: { id } } : null);
    assert.equal((await put(body)).status, id ? 403 : 401);
  }
  assert.equal(memory.prepare(`SELECT count(*) n FROM SiteContent WHERE key LIKE 'page_%'`).get().n, 0);

  // --- ADMIN: errores de validación con su código; guardado correcto. ---
  setSession({ user: { id: 'admin' } });
  for (const [value, expected] of [[{ page: 'home' }, 'INVALID_PAGE_CONTENT'], [{ ...body, texts: { es: { 'about.ctaTitle': 'x'.repeat(201) } } }, 'PAGE_TEXT_TOO_LONG'], [{ page: 'join', images: { side: 'http://x.test/a.jpg' } }, 'INVALID_PAGE_IMAGE']]) {
    const response = await put(value); assert.equal(response.status, 400); assert.equal(await code(response), expected);
  }
  const aboutBody = { page: 'about', texts: { es: { 'about.ctaTitle': 'Ven a vernos', 'about.values.one.title': 'Hospitalidad', 'seo.aboutTitle': 'Quiénes somos en ALIA' }, en: { 'about.ctaTitle': 'Come and see us' }, fr: {} }, images: { hero: 'https://qa.public.blob.vercel-storage.com/hero.jpg' } };
  assert.equal((await put(aboutBody)).status, 200);
  const joinBody = { page: 'join', texts: { es: { 'join.quiz.audience.title': '¿Qué te trae a ALIA?', 'join.owners.cardTitle': 'Soy dueño', 'join.owners.whatsappMessage': 'Quiero rentar con ALIA.' } }, images: { side: 'https://qa.public.blob.vercel-storage.com/side.jpg' } };
  assert.equal((await put(joinBody)).status, 200);
  assert.deepEqual((await store.readPageContent('about')).texts.es, aboutBody.texts.es);

  // --- El editor de siempre (saveSiteContent) no pisa las páginas. ---
  const site = { about_es: 'Somos ALIA', about_en: 'We are ALIA', about_fr: 'Nous sommes ALIA', social_instagram: '', social_facebook: '', featured_property_id: '', contact_whatsapp: '5213312345678', about_image: 'https://qa.public.blob.vercel-storage.com/about.jpg' };
  assert.equal((await siteApi.PUT(new Request('http://localhost/api/panel/site-content', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(site) }))).status, 200);
  assert.equal((await store.readPageContent('about')).texts.es['about.ctaTitle'], 'Ven a vernos', 'Guardar Contenido no borra Páginas');
  assert.equal((await store.readPageContent('join')).images.side, joinBody.images.side);
  setSession(null);

  // --- Páginas públicas: lo editado manda; lo vacío cae al texto por defecto; cada idioma por separado. ---
  for (const locale of ['es', 'en', 'fr']) {
    setLocale(locale);
    const messages = messagesFor(locale);
    const html = render(locale, await about.default({ params: Promise.resolve({ locale }) }));
    const edited = aboutBody.texts[locale]?.['about.ctaTitle'];
    assert.ok(html.includes(esc(edited || messages.about.ctaTitle)), `${locale}: cierre`);
    if (edited) assert.ok(!html.includes(esc(messages.about.ctaTitle)));
    assert.equal(html.includes('Hospitalidad'), locale === 'es');
    assert.ok(html.includes(esc(messages.about.ctaText)), `${locale}: sin editar = por defecto`);
    assert.ok(html.includes('hero.jpg') && !/<img[^>]*about\.jpg/.test(html.split('data-page-hero')[1].split('</section>')[0]), 'La imagen propia sustituye a la de Sobre nosotros en la cabecera');
    const metadata = await about.generateMetadata({ params: Promise.resolve({ locale }) });
    assert.equal(metadata.title, locale === 'es' ? 'Quiénes somos en ALIA' : messages.seo.aboutTitle);

    const quiz = render(locale, await join.default({ params: Promise.resolve({ locale }) }));
    assert.ok(quiz.includes(esc(locale === 'es' ? '¿Qué te trae a ALIA?' : messages.join.quiz.audience.title)), `${locale}: pregunta`);
    assert.ok(quiz.includes(esc(locale === 'es' ? 'Soy dueño' : messages.join.owners.cardTitle)));
    assert.ok(quiz.includes(esc(messages.join.referrers.cardTitle)), 'La otra opción sigue por defecto');
    assert.ok(quiz.includes('side.jpg') && !quiz.includes('about.jpg'), 'Foto lateral propia');
  }

  // --- Panel: solo ADMIN; dos editores, campos por idioma y texto por defecto en gris. ---
  setLocale('es');
  for (const id of ['a', 'client']) { setSession({ user: { id } }); await assert.rejects(() => ContentPage({ params: Promise.resolve({ locale: 'es' }) }), error => error.status === 404); }
  setSession({ user: { id: 'admin' } });
  const panel = render('es', await ContentPage({ params: Promise.resolve({ locale: 'es' }) }));
  assert.ok(panel.includes('data-page-editor="about"') && panel.includes('data-page-editor="join"'));
  // Tres desplegables bajo el título, en orden, cerrados al cargar y excluyentes (mismo name).
  const sections = [...panel.matchAll(/<details([^>]*)data-content-section="([^"]+)"([^>]*)>/g)];
  assert.deepEqual(sections.map(match => match[2]), ['home', 'about', 'join']);
  assert.ok(sections.every(match => /name="content-section"/.test(match[0]) && !/\sopen[\s=>]/.test(match[0])), 'Todos cerrados y con el mismo name');
  const es = messagesFor('es').panelPages;
  for (const key of ['home', 'about', 'join']) assert.ok(panel.includes(esc(es.pages[key])) && panel.includes(esc(es.pageDescriptions[key])));
  const home = panel.split('data-content-section="home"')[1].split('data-content-section="about"')[0];
  assert.ok(home.includes('name="about_es"') && home.includes('name="contact_whatsapp"'), 'El editor de siempre vive en «Página principal»');
  assert.ok(panel.includes(`name="fr:about.ctaTitle"`) && panel.includes(`name="en:join.quiz.rental.options.annual"`), 'Campos de los 3 idiomas en el formulario');
  assert.ok(panel.includes(`value="Ven a vernos"`), 'Lo guardado aparece en su campo');
  assert.ok(panel.includes(`placeholder="${esc(messagesFor('fr').about.ctaText)}"`), 'Texto por defecto en gris, en su idioma');
  assert.ok(panel.includes('{summary}'), 'Explica dónde van las respuestas en el mensaje de WhatsApp');
  assert.equal((panel.match(/role="tab"/g) || []).length, 6, 'Pestañas es/en/fr por página');
  assert.ok(panel.includes('hero.jpg') && panel.includes('side.jpg'));
  setSession(null);

  // --- «No estamos disponibles»: solo /unete, booleano, y la página muestra el aviso en vez del cuestionario. ---
  assert.equal(lib.pageContentInput('join', { closed: true }).closed, true);
  assert.equal(lib.pageContentInput('join', {}).closed, false);
  assert.equal(lib.parsePageContent('join', JSON.stringify({ texts: {}, images: {} })).closed, false, 'JSON anterior sin closed = abierta');
  rejects('join', { closed: 'true' }, 'INVALID_PAGE_CONTENT');
  rejects('about', { closed: true }, 'INVALID_PAGE_CONTENT');
  assert.equal(lib.pageContentInput('about', { closed: false }).closed, false);
  setSession({ user: { id: 'admin' } });
  assert.equal((await put({ ...joinBody, closed: true, texts: { es: { ...joinBody.texts.es, 'join.closed.text': 'Volvemos en enero.' } } })).status, 200);
  assert.equal((await store.readPageContent('join')).closed, true);
  assert.equal((await store.readPageContent('join')).texts.es['join.owners.cardTitle'], 'Soy dueño', 'Cerrar no borra los textos');
  for (const locale of ['es', 'en', 'fr']) {
    setLocale(locale);
    const messages = messagesFor(locale);
    const html = render(locale, await join.default({ params: Promise.resolve({ locale }) }));
    assert.ok(html.includes('data-join-closed') && html.includes('data-join-quiz'), `${locale}: aviso a pantalla completa, sin scroll`);
    assert.ok(!html.includes('data-option'), `${locale}: sin cuestionario`);
    assert.ok(html.includes(esc(messages.join.closed.title)));
    assert.ok(html.includes(esc(locale === 'es' ? 'Volvemos en enero.' : messages.join.closed.text)), `${locale}: texto editable con respaldo`);
    assert.ok(html.includes(`href="/${locale}/casas"`) && html.includes(esc(messages.join.closed.cta)));
    assert.equal((html.match(/<h1/g) || []).length, 1);
  }
  setLocale('es');
  const closedPanel = render('es', await ContentPage({ params: Promise.resolve({ locale: 'es' }) }));
  const joinEditor = closedPanel.split('data-page-editor="join"')[1], aboutEditor = closedPanel.split('data-page-editor="about"')[1].split('data-page-editor="join"')[0];
  assert.match(joinEditor, /<input type="checkbox"[^>]*name="closed"[^>]*checked/, 'Casilla marcada en el editor de Únete');
  assert.ok(joinEditor.includes(esc(messagesFor('es').panelPages.closedOn)), 'Avisa que la página está cerrada');
  assert.ok(!aboutEditor.includes('name="closed"'), 'Nosotros no tiene casilla');
  assert.equal((await put({ ...joinBody, closed: false })).status, 200);
  setLocale('es');
  const reopened = render('es', await join.default({ params: Promise.resolve({ locale: 'es' }) }));
  assert.ok(!reopened.includes('data-join-closed') && reopened.includes('data-option="owners"'), 'Desmarcar reabre el cuestionario');
  setSession(null);

  console.log('OK páginas editables T-4944: validación, permisos, SQL pendiente, guardado aislado, lectura con respaldo por idioma, SSR y panel.');
}
main().catch(error => { console.error(error); process.exit(1); });
