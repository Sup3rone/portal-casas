// T-4719: sitemap solo publicadas (anuales incluidas), hreflang triple por página,
// JSON-LD parseable por propiedad publicada y 404 de marca localizada. Sin red ni Neon.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const { load, memory, setLocale } = require('./test-property-access.cjs');
const req = createRequire(path.join(__dirname, '../apps/web/package.json'));
const React = req('react');
const { renderToStaticMarkup, renderToReadableStream } = req('react-dom/server');
const { NextIntlClientProvider } = req('next-intl');
process.env.PUBLIC_SITE_URL = 'https://portal.test';
const LOCALES = ['es', 'en', 'fr'];
const jsonld = load('apps/web/src/lib/property-jsonld.ts');
const sitemap = load('apps/web/src/app/sitemap.ts').default;
const detail = load('apps/web/src/app/[locale]/casas/[slug]/page.tsx');
const home = load('apps/web/src/app/[locale]/page.tsx');
const listing = load('apps/web/src/app/[locale]/casas/page.tsx');
const NotFound = load('apps/web/src/app/[locale]/not-found.tsx').default;
const CatchAll = load('apps/web/src/app/[locale]/[...rest]/page.tsx').default;
const labels = { weekday: 'Entre semana', weekend: 'Fin de semana', perNight: 'noche' };

function assertTripleHreflang(languages, path) {
  for (const lang of LOCALES) assert.equal(languages[lang], `https://portal.test/${lang}${path}`, `hreflang ${lang} de ${path || '/'}`);
  assert.equal(languages['x-default'], `https://portal.test/es${path}`);
  assert.deepEqual(Object.keys(languages).sort(), ['en', 'es', 'fr', 'x-default']);
}

async function main() {
  // Fixtures: pa nocturna completa, pb anual con tarifas (privadas), hidden sin publicar.
  memory.prepare(`UPDATE "Property" SET titleEs=?,titleEn=?,titleFr=?,descEs=?,descEn=?,descFr=?,address=?,state=?,destinationCity=?,lat=?,lng=?,
    maxGuests=?,bedrooms=?,bathrooms=?,baseWeekdayPrice=?,baseWeekendPrice=?,rentalType=? WHERE id=?`)
    .run('Casa del mar', 'Sea house', 'Maison de la mer', 'Frente al mar </script><b>', 'By the sea', 'Face à la mer',
      'Calle 1', 'Jalisco', 'Puerto Vallarta', 20.6, -105.2, 6, 3, 2, 2500, 3200, 'nocturna', 'pa');
  memory.prepare(`UPDATE "Property" SET titleEs=?,titleEn=?,titleFr=?,descEs=?,address=?,state=NULL,destinationCity=NULL,lat=NULL,lng=NULL,
    maxGuests=?,bedrooms=?,bathrooms=?,baseWeekdayPrice=?,baseWeekendPrice=?,rentalType=? WHERE id=?`)
    .run('Depa anual', '', 'Appart annuel', '', '  ', 4, 2, 1.5, 9000, 9000, 'anual', 'pb');
  memory.prepare('UPDATE "SeasonRate" SET name=?,startDate=?,endDate=?,weekdayPrice=?,weekendPrice=?,priority=? WHERE id=?')
    .run('Navidad', '2026-12-20', '2027-01-06', 4000, 0, 1, 'ra');
  memory.prepare('UPDATE "SeasonRate" SET name=?,startDate=?,endDate=?,weekdayPrice=?,weekendPrice=?,priority=? WHERE id=?')
    .run('Anual', '2026-01-01', '2026-12-31', 9000, 9000, 1, 'rb');
  const insert = memory.prepare('INSERT INTO "Media" (id,propertyId,url,type,"order",isCover,coverOrder) VALUES (?,?,?,?,?,?,?)');
  insert.run('m1', 'pa', '/fotos/sala.jpg', 'PHOTO', 0, 0, null);
  insert.run('m2', 'pa', 'https://store.public.blob.vercel-storage.com/portada.jpg', 'PHOTO', 5, 1, 0);
  insert.run('m3', 'pa', '/fotos/video.mp4', 'VIDEO', 1, 0, null);

  // 1) Sitemap: solo publicadas (la anual incluida), cada URL con hreflang triple.
  const published = memory.prepare('SELECT slug FROM "Property" WHERE published=1 ORDER BY slug').all().map(row => row.slug);
  const hidden = memory.prepare('SELECT slug FROM "Property" WHERE published=0').all().map(row => row.slug);
  assert.ok(published.includes('pb'), 'la propiedad anual publicada es pública');
  assert.ok(hidden.length > 0, 'el fixture tiene al menos una no publicada');
  const rows = await sitemap();
  const paths = ['', '/casas', ...published.map(slug => `/casas/${slug}`)];
  assert.equal(rows.length, paths.length * LOCALES.length);
  for (const slug of hidden) assert.ok(rows.every(row => !row.url.endsWith(`/casas/${slug}`)), `${slug} no publicada fuera del sitemap`);
  assert.ok(rows.every(row => !/\/(panel|admin|api|mi-cuenta|login|registro)/.test(row.url)), 'sin rutas privadas');
  for (const path of paths) for (const locale of LOCALES) {
    const row = rows.find(item => item.url === `https://portal.test/${locale}${path}`);
    assert.ok(row, `sitemap ${locale}${path}`);
    assertTripleHreflang(row.alternates.languages, path);
  }

  // 2) <head>: canonical propio y hreflang triple en cada página pública indexable.
  for (const locale of LOCALES) {
    setLocale(locale);
    for (const [page, path, extra] of [[home, ''], [listing, '/casas'], ...published.map(slug => [detail, `/casas/${slug}`, { slug }])]) {
      const metadata = await page.generateMetadata({ params: Promise.resolve({ locale, ...extra }) });
      assert.equal(metadata.alternates.canonical, `https://portal.test/${locale}${path}`);
      assertTripleHreflang(metadata.alternates.languages, path);
    }
  }

  // 3) JSON-LD: helper puro, sin inventar datos.
  const media = memory.prepare('SELECT * FROM "Media" WHERE propertyId=? ORDER BY "order"').all('pa').map(row => ({ ...row, isCover: Boolean(row.isCover) }));
  const property = { slug: 'pa', rentalType: 'nocturna', address: 'Calle 1', state: 'Jalisco', destinationCity: 'Puerto Vallarta', lat: 20.6, lng: -105.2,
    maxGuests: 6, bedrooms: 3, bathrooms: 2, baseWeekdayPrice: 2500, baseWeekendPrice: 3200 };
  const rates = [{ startDate: '2026-12-20', endDate: '2027-01-06', weekdayPrice: 4000, weekendPrice: 0 }];
  const full = jsonld.propertyJsonLd({ property, locale: 'en', title: ' Sea  house ', description: 'By\nthe sea', mediaList: media, rates, labels });
  assert.equal(full['@type'], 'VacationRental'); assert.equal(full['@context'], 'https://schema.org');
  assert.equal(full.url, 'https://portal.test/en/casas/pa'); assert.equal(full.inLanguage, 'en');
  assert.equal(full.name, 'Sea house'); assert.equal(full.description, 'By the sea');
  assert.deepEqual(full.image, ['https://store.public.blob.vercel-storage.com/portada.jpg', 'https://portal.test/fotos/sala.jpg'], 'portada primero, sin VIDEO');
  assert.deepEqual(full.address, { '@type': 'PostalAddress', streetAddress: 'Calle 1', addressLocality: 'Puerto Vallarta', addressRegion: 'Jalisco', addressCountry: 'MX' });
  assert.deepEqual(full.geo, { '@type': 'GeoCoordinates', latitude: 20.6, longitude: -105.2 });
  assert.deepEqual(full.containsPlace, { '@type': 'Accommodation', occupancy: { '@type': 'QuantitativeValue', maxValue: 6 }, numberOfBedrooms: 3, numberOfBathroomsTotal: 2 });
  const specs = full.makesOffer[0].priceSpecification;
  assert.equal(specs.length, 3, 'base entre semana + fin de semana + temporada (precio 0 omitido)');
  assert.ok(specs.every(spec => spec['@type'] === 'UnitPriceSpecification' && spec.priceCurrency === 'MXN' && spec.unitText === 'noche'));
  assert.deepEqual(specs.map(spec => spec.price), [2500, 3200, 4000]);
  assert.equal(specs[0].validFrom, undefined, 'tarifa base sin periodo');
  assert.equal(specs[2].validFrom, '2026-12-20'); assert.equal(specs[2].validThrough, '2027-01-06');

  const sparse = jsonld.propertyJsonLd({ property: { ...property, rentalType: 'anual', address: ' ', state: 'Atlántida', destinationCity: 'X', lat: null, lng: 1,
    maxGuests: 0, bedrooms: null, bathrooms: 1.5 }, locale: 'es', title: 'Anual', description: '', mediaList: [], rates, labels });
  for (const key of ['makesOffer', 'image', 'address', 'geo', 'containsPlace', 'description']) assert.equal(key in sparse, false, `${key} omitido si no hay dato`);
  assert.equal(jsonld.propertyJsonLd({ property: { ...property, rentalType: 'ambas' }, locale: 'es', title: 'x', description: '', mediaList: [], rates: [], labels }).makesOffer.length, 1);
  assert.equal('makesOffer' in jsonld.propertyJsonLd({ property: { ...property, baseWeekdayPrice: null, baseWeekendPrice: null }, locale: 'es', title: 'x', description: '', mediaList: [], rates: [], labels }), false);

  const hostile = jsonld.jsonLdScript({ name: '</script><script>alert(1)</script>', sep: 'a b c' });
  assert.ok(!hostile.includes('<') && !hostile.includes(' ') && !hostile.includes(' '));
  assert.deepEqual(JSON.parse(hostile), { name: '</script><script>alert(1)</script>', sep: 'a b c' });

  // 4) JSON-LD real en la ficha renderizada: un bloque parseable por propiedad publicada e idioma.
  for (const locale of LOCALES) for (const slug of published) {
    setLocale(locale);
    let html;
    const messages = JSON.parse(fs.readFileSync(`apps/web/messages/${locale}.json`, 'utf8'));
    try {
      const stream = await renderToReadableStream(React.createElement(NextIntlClientProvider, { locale, messages, timeZone: 'America/Mexico_City', onError(error) { throw error; } }, await detail.default({ params: Promise.resolve({ locale, slug }) })));
      await stream.allReady; html = await new Response(stream).text();
    }
    catch (error) { throw new Error(`render ${locale}/${slug}: ${error.message}`); }
    const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
    assert.equal(blocks.length, 1, `un JSON-LD en ${locale}/${slug}`);
    const data = JSON.parse(blocks[0][1]);
    assert.equal(data['@type'], 'VacationRental'); assert.equal(data.url, `https://portal.test/${locale}/casas/${slug}`); assert.equal(data.inLanguage, locale);
    assert.ok(data.name, 'nombre presente (con respaldo en español)');
    if (slug === 'pb') assert.equal('makesOffer' in data, false, 'anual sin tarifas publicadas');
    if (slug === 'pa') {
      assert.equal(data.makesOffer[0].priceSpecification[0].name, JSON.parse(fs.readFileSync(`apps/web/messages/${locale}.json`, 'utf8')).seo.jsonLd.weekday);
      if (locale === 'es') assert.equal(data.description, 'Frente al mar </script><b>', 'texto hostil sobrevive como dato, no como HTML');
    }
  }
  await assert.rejects(detail.default({ params: Promise.resolve({ locale: 'es', slug: hidden[0] }) }), /notFound/, 'no publicada no renderiza JSON-LD');

  // 5) 404: comodín delega en notFound(); página localizada con enlaces a / y /casas.
  assert.throws(() => CatchAll(), /notFound/);
  for (const locale of LOCALES) {
    setLocale(locale);
    const messages = JSON.parse(fs.readFileSync(`apps/web/messages/${locale}.json`, 'utf8')).notFoundPage;
    for (const key of ['title', 'heading', 'body', 'listing', 'home']) assert.ok(messages[key]?.trim(), `${locale}.notFoundPage.${key}`);
    const html = renderToStaticMarkup(await NotFound());
    assert.equal((html.match(/<h1/g) || []).length, 1);
    assert.ok(html.includes(`<h1 class="text-balance text-3xl leading-tight sm:text-4xl">${messages.heading.replace(/'/g, '&#x27;')}</h1>`));
    assert.ok(html.includes(`href="/${locale}/casas"`) && html.includes(`href="/${locale}/"`), `enlaces localizados ${locale}`);
    assert.match(html, /aria-hidden="true"[^>]*>[\s\S]*404/, 'el 404 grande es decorativo');
    assert.ok((html.match(/min-h-11/g) || []).length >= 2, 'área táctil de 44 px en ambos enlaces');
    assert.ok((html.match(/focus-visible:outline-2/g) || []).length >= 2, 'foco visible');
  }
  console.log('OK SEO T-4719: sitemap solo publicadas, hreflang triple, JSON-LD parseable por ficha y 404 localizada.');
}
main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => { delete process.env.PUBLIC_SITE_URL; memory.close(); });
