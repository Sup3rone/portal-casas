// T-4829: qué fotos pasan por el optimizador de next/image y que la configuración lo permita. Sin red.
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const { load, req } = require('./test-property-access.cjs');
const { isOptimizableImage, unoptimizedFor } = load('apps/web/src/lib/image-src.ts');

// Se optimizan: Vercel Blob por https y los archivos de /public/images.
for (const src of [
  'https://eorinf4h9dcvcdit.public.blob.vercel-storage.com/fotos/del-canto-vallarta/18.jpg',
  'https://store.public.blob.vercel-storage.com/properties/abc/1.webp',
  '/images/listado-bg.jpg',
]) assert.equal(isOptimizableImage(src), true, src);

// Se sirven tal cual (otro host, http, query, puerto, data:, vacío): next/image los rechazaría.
for (const src of [
  'https://outside.example/photo.jpg',
  'http://store.public.blob.vercel-storage.com/a.jpg',
  'https://store.public.blob.vercel-storage.com/a.jpg?v=2',
  'https://store.public.blob.vercel-storage.com:8443/a.jpg',
  'https://evil.public.blob.vercel-storage.com.example.com/a.jpg',
  '/images/a.jpg?v=1',
  '/uploads/a.jpg',
  'data:image/gif;base64,R0lGODlhAQABAAAAACw=',
  '', null, undefined,
]) assert.equal(isOptimizableImage(src), false, String(src));
assert.equal(unoptimizedFor('https://outside.example/a.jpg'), true);

// next.config.ts declara el mismo host, una sola calidad (obligatoria en Next 16) y la caché larga.
const config = fs.readFileSync(path.join(__dirname, '../apps/web/next.config.ts'), 'utf8');
assert.ok(config.includes("hostname: '*.public.blob.vercel-storage.com'"));
assert.ok(/qualities:\s*\[75\]/.test(config));
assert.ok(config.includes('minimumCacheTTL'));

// SSR real de la tarjeta del listado: Blob → /_next/image con srcset; otro host → URL original.
const React = req('react'), { renderToStaticMarkup } = req('react-dom/server');
const { NextIntlClientProvider } = req('next-intl');
const messages = JSON.parse(fs.readFileSync(path.join(__dirname, '../apps/web/messages/es.json'), 'utf8'));
const PropertyCard = load('apps/web/src/components/PropertyCard.tsx').default;
const card = urls => renderToStaticMarkup(React.createElement(NextIntlClientProvider, { locale: 'es', messages },
  React.createElement(PropertyCard, { eager: true, property: {
    id: 'p', slug: 'casa', titleEs: 'Casa', titleEn: 'House', titleFr: 'Maison', city: 'Vallarta', maxGuests: 4, bedrooms: 2, bathrooms: 1,
    rentalType: 'nocturna', media: urls.map(url => ({ url, type: 'PHOTO' })),
  } })));
const blob = 'https://store.public.blob.vercel-storage.com/p/1.jpg';
const optimized = card([blob, blob.replace('1', '2'), blob.replace('1', '3')]);
assert.ok(optimized.includes('/_next/image?url=' + encodeURIComponent(blob)), 'La foto de Blob pasa por el optimizador');
assert.ok(optimized.includes('srcSet=') || optimized.includes('srcset='), 'Con srcset por pantalla');
assert.ok(optimized.includes('col-span-2'), 'La primera de tres fotos ocupa el ancho completo');
assert.ok(optimized.includes('fetchPriority="high"') || optimized.includes('fetchpriority="high"'), 'La primera tarjeta prioriza su primera foto');
const external = card(['https://outside.example/photo.jpg']);
assert.ok(external.includes('src="https://outside.example/photo.jpg"') && !external.includes('/_next/image'), 'Otro host se sirve tal cual y no rompe');

console.log('OK: Blob y /images optimizados; otros hosts tal cual; next.config.ts coherente; tarjeta con srcset.');
