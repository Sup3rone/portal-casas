// Página/cards reales con datos en memoria; sin conexiones a Neon.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { load, req, memory, setLocale } = require('./test-property-access.cjs');
const React = req('react');
const { renderToStaticMarkup } = req('react-dom/server');
const { NextIntlClientProvider } = req('next-intl');
const Page = load('apps/web/src/app/[locale]/casas/page.tsx').default;
memory.prepare('UPDATE "Property" SET maxGuests=6, bedrooms=2, titleEs=?, titleEn=?, titleFr=?').run('Casa', 'House', 'Maison');
async function main() {
  for (const locale of ['es', 'en', 'fr']) {
    setLocale(locale);
    const messages = JSON.parse(fs.readFileSync(path.join(__dirname, '../apps/web/messages', locale + '.json'), 'utf8'));
    const html = renderToStaticMarkup(React.createElement(NextIntlClientProvider, {
      locale, messages, timeZone: 'America/Mexico_City', onError(error) { throw error; }
    }, await Page({ params: Promise.resolve({ locale }) })));
    const text = html.replace(/<!--.*?-->/g, '');
    assert.ok(text.includes(`6 ${messages.properties.guests} · 2 ${messages.properties.bedrooms}`));
    assert.ok(text.includes(messages.properties.destinations));
    assert.ok(text.includes(`href="/${locale}/casas/`));
    if (locale !== 'es') { assert.ok(!text.includes('huéspedes')); assert.ok(!text.includes('hab.')); }
    console.log(`${locale}: listado, cifras traducidas y enlaces con locale OK`);
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => memory.close());
