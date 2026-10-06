// Componentes reales y capacidades de compartir simuladas; sin red ni BD real.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { load, req, memory, setLocale } = require('./test-property-access.cjs');
const React = req('react');
const { renderToStaticMarkup } = req('react-dom/server');
const { NextIntlClientProvider } = req('next-intl');
const Gallery = load('apps/web/src/components/PropertyGallery.tsx').default;
const Share = load('apps/web/src/components/PropertyShareButton.tsx');
const Map = load('apps/web/src/components/LocationMap.tsx').default;
const slides = Array.from({ length: 55 }, (_, i) => ({ url: '/images/photo-' + i + '.jpg', type: i === 7 ? 'VIDEO' : 'PHOTO' }));

async function main() {
  for (const locale of ['es', 'en', 'fr']) {
    setLocale(locale);
    const messages = JSON.parse(fs.readFileSync(path.join(__dirname, '../apps/web/messages/' + locale + '.json'), 'utf8'));
    const wrap = child => React.createElement(NextIntlClientProvider, { locale, messages, timeZone: 'America/Mexico_City', onError(error) { throw error; } }, child);
    const html = renderToStaticMarkup(wrap(React.createElement(Gallery, { slides })));
    assert.equal((html.match(/aria-haspopup="dialog"/g) ?? []).length, 8);
    assert.ok(html.includes('+47'));
    assert.ok(html.includes('aria-modal="true"'));
    assert.ok(html.includes(messages.details.gallery.lightbox));
    assert.ok(html.includes('<video'));
    assert.equal(renderToStaticMarkup(wrap(React.createElement(Gallery, { slides: [] }))), '');
    const map = renderToStaticMarkup(wrap(await Map({ lat: 20, lng: -105, address: 'Address', propertyTitle: 'Property' })));
    assert.ok(map.includes(messages.details.share.action));
    assert.ok(map.includes('hl=' + locale));

    const data = { title: 'Property ' + locale, url: 'https://example.com/' + locale + '/casas/property' };
    let native, copied;
    const clipboard = { writeText: async url => { copied = url; } };
    assert.equal(await Share.shareProperty(data, { share: async value => { native = value; }, clipboard }), 'shared');
    assert.deepEqual(native, data); assert.equal(copied, undefined);
    assert.equal(await Share.shareProperty(data, { clipboard }), 'copied'); assert.equal(copied, data.url);
    copied = undefined;
    assert.equal(await Share.shareProperty(data, { share: async () => { throw new DOMException('Cancel', 'AbortError'); }, clipboard }), 'idle');
    assert.equal(copied, undefined, 'Cancelar no debe copiar');
    assert.equal(await Share.shareProperty(data, { share: async () => { throw new DOMException('Unavailable', 'NotAllowedError'); }, clipboard }), 'copied');
    await assert.rejects(() => Share.shareProperty(data, { clipboard: { writeText: async () => { throw new Error('Denied'); } } }), /Denied/);
    console.log(locale + ': mosaico, límite, video, mapa y share/copia/cancelación OK');
  }
  memory.close();
  console.log('OK: galería y compartir sin red, escrituras ni librerías nuevas.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
