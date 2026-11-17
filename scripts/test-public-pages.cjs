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
    for (const key of keys.filter(key => /\.(benefits|faq|values)\.|\.steps\.|\.(intro|cardText|heroText|storyFallback|ctaTitle|ctaText)$|Description$/.test(key))) {
      assert.ok(values[key].startsWith('[Pendiente]'), `${locale} ${key} debe marcarse [Pendiente]`);
    }
  }

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

    // --- /unete: selector con anclas y dos audiencias. ---
    html = render(locale, await join.default({ params: Promise.resolve({ locale }) }));
    assert.equal((html.match(/<h1/g) || []).length, 1);
    assert.ok(html.includes('href="#duenos"') && html.includes('href="#referidores"'));
    assert.ok(html.indexOf('id="duenos"') < html.indexOf('id="referidores"'), 'Dueños primero, luego referidores');
    for (const audience of ['owners', 'referrers']) {
      const section = html.match(new RegExp(`<section[^>]*data-audience="${audience}"[\\s\\S]*?</section>`))[0];
      assert.equal((section.match(/<details/g) || []).length, 3, `${audience}: 3 preguntas`);
      assert.equal((section.match(/<ol/g) || []).length, 1, `${audience}: pasos en lista ordenada`);
    }
    const owners = html.match(/<section[^>]*data-audience="owners"[\s\S]*?<\/section>/)[0];
    const referrers = html.match(/<section[^>]*data-audience="referrers"[\s\S]*?<\/section>/)[0];
    // Sin sesión: dueños por WhatsApp; referidores a crear cuenta (necesitan cuenta registrada).
    assert.deepEqual(waLinks(owners), [pages.whatsappHref(filled.contact_whatsapp, messages.join.owners.whatsappMessage)]);
    assert.equal(waLinks(referrers).length, 0);
    assert.ok(referrers.includes(`href="/${locale}/registro"`));
    // Con sesión: el referidor también va por WhatsApp.
    setSession({ user: { id: 'u1', email: 'huesped@test.local' } });
    const signed = render(locale, await join.default({ params: Promise.resolve({ locale }) }));
    setSession(null);
    const signedReferrers = signed.match(/<section[^>]*data-audience="referrers"[\s\S]*?<\/section>/)[0];
    assert.deepEqual(waLinks(signedReferrers), [pages.whatsappHref(filled.contact_whatsapp, messages.join.referrers.whatsappMessage)]);
    assert.ok(!signedReferrers.includes('/registro'));

    // --- Footer: no enlaza las páginas mientras sean esqueleto. ---
    const footer = render(locale, React.createElement(Footer));
    assert.ok(footer.includes(`href="/${locale}/casas"`), 'El footer sí se renderizó');
    assert.ok(!footer.includes('/nosotros') && !footer.includes('/unete'));
  }

  // --- Navbar y Footer: los enlaces existen, pero solo detrás de la bandera. ---
  for (const file of ['apps/web/src/components/Navbar.tsx', 'apps/web/src/components/Footer.tsx']) {
    const source = fs.readFileSync(file, 'utf8');
    const gate = source.indexOf('{PUBLIC_PAGES_LIVE && <>');
    assert.ok(gate > 0, `${file}: bandera`);
    const block = source.slice(gate, source.indexOf('</>}', gate));
    assert.ok(block.includes('href="/nosotros"') && block.includes('href="/unete"'));
    assert.equal(source.split('href="/nosotros"').length, 2, `${file}: /nosotros solo dentro de la bandera`);
  }

  console.log('OK páginas públicas T-4944: ocultas (noindex/sitemap/enlaces), /nosotros con panel y relleno, /unete con dos audiencias y CTAs, i18n es/en/fr.');
}
main().catch(error => { console.error(error); process.exit(1); });
