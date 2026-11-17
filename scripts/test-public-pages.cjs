// T-4944: esqueleto de /nosotros y /unete. SSR real con SQLite en memoria, sin red ni Neon.
// Comprueba: ocultas (noindex, fuera del sitemap y sin enlaces), dos audiencias, CTAs y claves i18n en es/en/fr.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { load, req, setLocale, setSession } = require('./test-property-access.cjs');
process.env.PUBLIC_SITE_URL = 'https://portal.test';
const React = req('react'), { renderToStaticMarkup } = req('react-dom/server'), { NextIntlClientProvider } = req('next-intl');
const pages = load('apps/web/src/lib/public-pages.ts');
const about = load('apps/web/src/app/[locale]/nosotros/page.tsx');
const join = load('apps/web/src/app/[locale]/unete/page.tsx');
const sitemap = load('apps/web/src/app/sitemap.ts').default;
const Footer = load('apps/web/src/components/Footer.tsx').default;
const api = load('apps/web/src/app/api/panel/site-content/route.ts');
const empty = { about_es: '', about_en: '', about_fr: '', social_instagram: '', social_facebook: '', featured_property_id: '', contact_whatsapp: '' };
const filled = { ...empty, about_es: 'Somos ALIA', about_en: 'We are ALIA', about_fr: 'Nous sommes ALIA', about_title_es: 'Quiénes somos', about_title_en: 'Who we are', about_title_fr: 'Qui sommes-nous', about_image: 'https://qa.public.blob.vercel-storage.com/about.jpg', contact_whatsapp: '5213312345678', social_instagram: 'https://instagram.com/alia' };
const put = async body => { setSession({ user: { id: 'admin' } }); const res = await api.PUT(new Request('http://localhost/test', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })); assert.equal(res.status, 200); setSession(null); };
const messagesFor = locale => JSON.parse(fs.readFileSync(`apps/web/messages/${locale}.json`, 'utf8'));
const esc = text => text.replace(/&/g, '&amp;').replace(/'/g, '&#x27;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const render = (locale, tree) => renderToStaticMarkup(React.createElement(NextIntlClientProvider, { locale, messages: messagesFor(locale), timeZone: 'America/Mexico_City' }, tree));
const waLinks = html => [...html.matchAll(/href="(https:\/\/wa\.me\/[^"]+)"/g)].map(m => m[1].replace(/&#x27;/g, "'").replace(/&amp;/g, '&'));

async function main() {
  // --- Bandera: ocultas hasta que haya contenido real. ---
  assert.equal(pages.PUBLIC_PAGES_LIVE, false, 'Esqueleto: las páginas siguen ocultas');
  assert.deepEqual(pages.publicPagesForSitemap(), []);
  assert.deepEqual(pages.publicPagesForSitemap(true), ['/nosotros', '/unete']);
  assert.deepEqual(pages.withPublicPageRobots({ title: 'x' }).robots, { index: false, follow: false });
  assert.equal(pages.withPublicPageRobots({ title: 'x' }, true).robots, undefined);
  const rows = await sitemap();
  assert.ok(rows.length > 0 && rows.every(row => !/\/(nosotros|unete)$/.test(row.url)), 'Fuera del sitemap');

  // --- WhatsApp: solo con número válido del panel y mensaje codificado. ---
  assert.equal(pages.whatsappHref('', 'hola'), null);
  assert.equal(pages.whatsappHref('12-34', 'hola'), null);
  assert.equal(pages.whatsappHref('5213312345678', 'Hola, ¿qué tal? & más'), 'https://wa.me/5213312345678?text=Hola%2C%20%C2%BFqu%C3%A9%20tal%3F%20%26%20m%C3%A1s');

  // --- Rutas propias: [...rest] (404) no las captura porque un segmento estático gana al catch-all. ---
  for (const route of ['nosotros', 'unete']) assert.ok(fs.existsSync(`apps/web/src/app/[locale]/${route}/page.tsx`));

  // --- i18n: mismas claves en los 3 idiomas; contenido de negocio marcado [Pendiente]. ---
  const flat = (value, prefix = '') => Object.entries(value).flatMap(([key, item]) => typeof item === 'object' ? flat(item, `${prefix}${key}.`) : [[prefix + key, item]]);
  const pick = (messages) => Object.fromEntries([...flat(messages.about, 'about.'), ...flat(messages.join, 'join.'), ...['nosotros', 'unete'].map(k => ['nav.' + k, messages.nav[k]]), ...['aboutTitle', 'aboutDescription', 'joinTitle', 'joinDescription'].map(k => ['seo.' + k, messages.seo[k]])]);
  const keys = Object.keys(pick(messagesFor('es'))).sort();
  for (const locale of ['en', 'fr']) assert.deepEqual(Object.keys(pick(messagesFor(locale))).sort(), keys, `${locale}: mismas claves que es`);
  for (const locale of ['es', 'en', 'fr']) {
    const values = pick(messagesFor(locale));
    for (const [key, value] of Object.entries(values)) assert.ok(typeof value === 'string' && value.trim(), `${locale} ${key} vacío`);
    for (const key of keys.filter(key => /\.(benefits|values)\.|\.(help|cardText|doneText|storyFallback|ctaTitle|ctaText|contactMissing)$|Description$/.test(key))) {
      assert.ok(values[key].startsWith('[Pendiente]'), `${locale} ${key} debe marcarse [Pendiente]`);
    }
  }

  // --- Lógica del cuestionario (lib/join-quiz.ts). ---
  const quiz = load('apps/web/src/lib/join-quiz.ts');
  const states = ['Jalisco', 'Yucatán'];
  assert.deepEqual(quiz.stepsFor(undefined, states).map(s => s.id), ['audience']);
  assert.deepEqual(quiz.stepsFor('owners', states).map(s => s.id), ['audience', 'propertyType', 'location', 'rental']);
  assert.deepEqual(quiz.stepsFor('owners', []).map(s => s.id), ['audience', 'propertyType', 'rental'], 'Sin estados publicados no se pregunta ubicación');
  assert.deepEqual(quiz.stepsFor('referrers', states).map(s => s.id), ['audience', 'referAudience', 'channel', 'reach']);
  assert.deepEqual(quiz.stepsFor('owners', states)[2].options, ['Jalisco', 'Yucatán', 'other']);
  assert.equal(quiz.totalSteps([], states), 4);
  assert.equal(quiz.toHash(['owners', 'house', 'Yucatán']), '#owners/house/Yucat%C3%A1n');
  assert.equal(quiz.toHash([]), '');
  assert.deepEqual(quiz.parseHash('#owners/house/Yucat%C3%A1n', states), ['owners', 'house', 'Yucatán'], 'Ida y vuelta por el hash');
  assert.deepEqual(quiz.parseHash('#owners/castle/Jalisco', states), ['owners'], 'Una respuesta inválida corta el resto');
  assert.deepEqual(quiz.parseHash('#referrers/guests/social/many/extra', states), ['referrers', 'guests', 'social', 'many']);
  assert.deepEqual(quiz.parseHash('#%E0%A4%A', states), [], 'Hash mal codificado no rompe');
  assert.deepEqual(quiz.parseHash('#hack', states), []);
  assert.equal(quiz.isComplete(['owners', 'house', 'Jalisco'], states), false);
  assert.equal(quiz.isComplete(['owners', 'house', 'Jalisco', 'annual'], states), true);
  assert.equal(quiz.isComplete(['owners', 'house', 'annual'], []), true);
  assert.deepEqual([quiz.optionIndexForKey('a', 3), quiz.optionIndexForKey('C', 3), quiz.optionIndexForKey('2', 3), quiz.optionIndexForKey('d', 3), quiz.optionIndexForKey('0', 3), quiz.optionIndexForKey('Enter', 3)], [0, 2, 1, -1, -1, -1]);
  const es = messagesFor('es').join;
  const ownerSteps = quiz.stepsFor('owners', states), ownerAnswers = ['owners', 'apartment', 'Jalisco', 'annual'];
  const label = (id, value) => id === 'location' && value !== 'other' ? value : es.quiz[id].options[value];
  const summary = quiz.answerSummary(ownerSteps, ownerAnswers, label, id => es.quiz[id].short);
  assert.equal(summary, 'Tipo: Departamento. Ubicación: Jalisco. Renta: Por año');
  assert.equal(es.owners.whatsappMessage.replace('{summary}', summary), 'Hola, quiero publicar mi propiedad con ALIA. Tipo: Departamento. Ubicación: Jalisco. Renta: Por año.');
  for (const locale of ['es', 'en', 'fr']) {
    const messages = messagesFor(locale).join;
    for (const audience of ['owners', 'referrers']) for (const step of quiz.stepsFor(audience, states).slice(1)) {
      assert.ok(messages.quiz[step.id].title && messages.quiz[step.id].short, `${locale} ${step.id}`);
      for (const option of step.options.filter(option => !states.includes(option))) assert.ok(messages.quiz[step.id].options[option], `${locale} ${step.id}.${option}`);
    }
  }
  // Sin scroll: body a pantalla completa con el cuestionario y sin footer en /unete.
  assert.match(fs.readFileSync('apps/web/src/app/globals.css', 'utf8'), /body:has\(main\[data-join-quiz\]\) \{[^}]*height: 100dvh; overflow: hidden;/);
  assert.ok(fs.readFileSync('apps/web/src/components/Footer.tsx', 'utf8').includes(String.raw`unete\/?$/.test(pathname)) return null`), 'Sin footer en /unete');

  for (const locale of ['es', 'en', 'fr']) {
    setLocale(locale);
    const messages = messagesFor(locale);
    // --- Metadata: noindex y canonical propios. ---
    for (const [page, path] of [[about, '/nosotros'], [join, '/unete']]) {
      const metadata = await page.generateMetadata({ params: Promise.resolve({ locale }) });
      assert.deepEqual(metadata.robots, { index: false, follow: false }, `${locale}${path} noindex`);
      assert.equal(metadata.alternates.canonical, `https://portal.test/${locale}${path}`);
      assert.ok(metadata.title && metadata.description);
    }

    // --- /nosotros sin contenido en el panel: relleno, sin contacto, CTAs a casas y únete. ---
    await put(empty);
    let html = render(locale, await about.default({ params: Promise.resolve({ locale }) }));
    assert.ok(html.includes('data-public-page="nosotros"') && html.includes('data-page-hero'));
    assert.match(html, /<h1[^>]*>[^<]*<\/h1>/);
    assert.ok(html.includes(messages.about.heroTitleFallback) && html.includes(messages.about.storyFallback.replace(/&/g, '&amp;')));
    assert.equal((html.match(/<h1/g) || []).length, 1, 'Un solo h1');
    assert.equal(waLinks(html).length, 0, 'Sin número no hay botón de WhatsApp');
    assert.ok(!html.includes(messages.about.contactTitle), 'Sin redes ni WhatsApp no se pinta la sección de contacto');
    assert.ok(html.includes(`href="/${locale}/casas"`) && html.includes(`href="/${locale}/unete"`));

    // --- /nosotros con contenido del panel: título, texto, imagen y WhatsApp prellenado. ---
    await put(filled);
    html = render(locale, await about.default({ params: Promise.resolve({ locale }) }));
    assert.ok(html.includes(filled[`about_title_${locale}`].replace(/'/g, '&#x27;')) && html.includes(filled[`about_${locale}`]));
    assert.ok(!html.includes(messages.about.storyFallback.replace(/&/g, '&amp;')));
    assert.ok(html.includes('about.jpg'), 'Imagen del panel en el hero');
    assert.ok(html.includes('href="https://instagram.com/alia"'));
    assert.deepEqual(waLinks(html), [pages.whatsappHref(filled.contact_whatsapp, messages.about.whatsappMessage)]);

    // --- /unete: cuestionario. SSR pinta la primera pregunta; el resto lo decide el hash en el cliente. ---
    html = render(locale, await join.default({ params: Promise.resolve({ locale }) }));
    assert.ok(html.includes('data-join-quiz'), 'Main marcado para la regla sin scroll de globals.css');
    assert.equal((html.match(/<h1/g) || []).length, 1);
    assert.ok(html.includes(messages.join.quiz.audience.title.replace(/'/g, '&#x27;')));
    assert.deepEqual([...html.matchAll(/data-option="([^"]+)"/g)].map(m => m[1]), ['owners', 'referrers'], 'Primera pantalla: las dos audiencias');
    assert.ok(html.includes('aria-keyshortcuts="A"') && html.includes('aria-keyshortcuts="B"'));
    assert.ok(html.includes(messages.join.owners.cardTitle.replace(/'/g, '&#x27;')) && html.includes(messages.join.referrers.cardTitle.replace(/'/g, '&#x27;')));
    assert.equal(waLinks(html).length, 0, 'La acción aparece hasta el final');
    assert.ok(html.includes('aria-live="polite"') && html.includes('about.jpg'), 'Progreso anunciado y foto del panel en el costado');
    // Progreso oculto a pedido: sin barra y «Pregunta 1 de 4» solo para lectores de pantalla.
    assert.ok(!html.includes('data-progress'), 'Sin barra de avance');
    assert.match(html, /<p aria-live="polite" class="sr-only">[^<]*1[^<]*4[^<]*<\/p>/, 'Texto de avance solo para lectores de pantalla');
    // --- Footer: ya enlaza las dos páginas, después de Casas, con su texto en cada idioma (17-11-2026). ---
    const footer = render(locale, React.createElement(Footer));
    const links = [...footer.matchAll(/<a [^>]*href="\/(?:es|en|fr)\/(casas|nosotros|unete)"[^>]*>([^<]*)<\/a>/g)].map(m => [m[1], m[2]]);
    assert.deepEqual(links, [['casas', esc(messages.nav.casas)], ['nosotros', esc(messages.nav.nosotros)], ['unete', esc(messages.nav.unete)]], `${locale}: enlaces del footer`);
  }

  // --- Menú: los enlaces existen, pero solo detrás de PUBLIC_PAGES_LIVE. Footer: detrás de su propia bandera. ---
  assert.equal(load('apps/web/src/lib/public-pages-live.ts').PUBLIC_PAGES_IN_FOOTER, true);
  for (const [file, gateText] of [['apps/web/src/components/Navbar.tsx', '{PUBLIC_PAGES_LIVE && <>'], ['apps/web/src/components/Footer.tsx', '{(PUBLIC_PAGES_LIVE || PUBLIC_PAGES_IN_FOOTER) && <>']]) {
    const source = fs.readFileSync(file, 'utf8');
    const gate = source.indexOf(gateText);
    assert.ok(gate > 0, `${file}: bandera`);
    const block = source.slice(gate, source.indexOf('</>}', gate));
    assert.ok(block.includes('href="/nosotros"') && block.includes('href="/unete"'));
    assert.equal(source.split('href="/nosotros"').length, 2, `${file}: /nosotros solo dentro de la bandera`);
  }

  console.log('OK páginas públicas T-4944: ocultas (noindex/sitemap/menú), enlazadas en el footer, /nosotros con panel y relleno, /unete como cuestionario (lógica, hash, resumen), sin scroll, i18n es/en/fr.');
}
main().catch(error => { console.error(error); process.exit(1); });
