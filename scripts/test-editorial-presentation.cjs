// Datos y SSR reales sin Neon; interacción/scroll se comprueban aparte en navegador.
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { load, memory, req, setLocale } = require('./test-property-access.cjs');
const { editorialPresentation: build, editorialProgress, editorialSwipe } = load('apps/web/src/lib/editorial-presentation.ts');
const media = [
  { id: 'hero', propertyId: 'pa', type: 'PHOTO', category: 'lugar', order: 8, url: '/hero.jpg' },
  { id: 'first', propertyId: 'pa', type: 'PHOTO', category: 'principal', order: 1, url: '/first.jpg' },
  { id: 'video', propertyId: 'pa', type: 'VIDEO', category: 'principal', order: 0, url: '/video.mp4' },
  { id: 'foreign', propertyId: 'pb', type: 'PHOTO', category: 'principal', order: 0, url: '/foreign.jpg' },
];
const row = { propertyId: 'pa', section: 'destino', descriptionEs: 'Destino ES', descriptionEn: null, descriptionFr: null, heroMediaId: null };
assert.equal(build('pa', 'en', [row], media).length, 0);
assert.equal(build('pa', 'es', [{ ...row, descriptionEs: '   ' }], media).length, 0);
assert.deepEqual(build('pa', 'es', [{ ...row, heroMediaId: 'hero' }], media)[0].photos.map(p => p.id), ['first']);
assert.equal(build('pa', 'es', [{ ...row, heroMediaId: 'hero' }], media)[0].hero.id,'hero');
assert.deepEqual(build('pa', 'es', [{ ...row, photoMediaIds: ['hero','first'] }], media)[0].photos.map(p=>p.id),['hero','first']);
assert.deepEqual(build('pa', 'es', [{ ...row, photoMediaIds: ['foreign','video'] }], media)[0].photos,[]);
const many = Array.from({length:28},(_,i)=>({...media[1],id:'p'+i,order:i}));
assert.equal(build('pa','es',[row],many)[0].photos.length,2);
assert.deepEqual(build('pa', 'es', [{ ...row, heroMediaId: 'foreign' }], media)[0].photos.map(p => p.id), ['first']);
const sections = ['lugar', 'habitaciones', 'amenidades', 'destino'].map(section => ({ ...row, section, heroMediaId: 'hero' }));
assert.deepEqual(build('pa', 'es', sections, media).map(s => s.section), ['destino', 'amenidades', 'habitaciones', 'lugar']);
assert.deepEqual(build('pa', 'es', sections, media).at(-1).photos.map(p => p.id), ['hero']);
assert.equal(editorialProgress(875, 1000, 4, false).fade, 0.5);
assert.equal(editorialProgress(875, 1000, 4, true).fade, 0);
assert.equal(editorialProgress(1000, 1000, 4, true).active, 1);
assert.equal(editorialSwipe({x:100,y:100},{x:20,y:105}),1);
assert.equal(editorialSwipe({x:100,y:100},{x:180,y:105}),-1);
assert.equal(editorialSwipe({x:100,y:100},{x:120,y:200}),0);
const Page = load('apps/web/src/app/[locale]/casas/[slug]/page.tsx').default;
const baseline = execFileSync('git', ['show', 'HEAD:apps/web/src/app/[locale]/casas/[slug]/page.tsx'], { encoding: 'utf8' });
const Previous = load('scripts/fixtures/baseline-detail.tsx', baseline).default;
memory.prepare('UPDATE "Property" SET titleEs=?,titleEn=?,titleFr=?,descEs=?,descEn=?,descFr=?,city=?,address=?,bedrooms=?,bathrooms=?,lat=?,lng=? WHERE id=?')
  .run('Casa','House','Maison','General ES','General EN','General FR','City','Address',2,1,20,-100,'pa');
for (const m of media.filter(m => m.propertyId === 'pa')) memory.prepare('INSERT INTO "Media" (id,propertyId,type,category,"order",url) VALUES (?,?,?,?,?,?)')
  .run(m.id,m.propertyId,m.type,m.category,m.order,m.url);
const React = req('react'), { renderToReadableStream } = req('react-dom/server'), { NextIntlClientProvider } = req('next-intl');
async function main() {
  for (const locale of ['es','en','fr']) {
    setLocale(locale);
    const messages = JSON.parse(fs.readFileSync(path.join(__dirname,'../apps/web/messages/'+locale+'.json'),'utf8'));
    const render = async tree => { const stream = await renderToReadableStream(React.createElement(NextIntlClientProvider, {locale,messages,timeZone:'America/Mexico_City',onError(e){throw e;}},tree)); await stream.allReady; return new Response(stream).text(); };
    const params = Promise.resolve({locale,slug:'pa'});
    const before = await render(await Previous({params})), empty = await render(await Page({params}));
    assert.ok(before.includes('id="reservar"')); assert.ok(empty.includes('id="reservar"'));
    assert.equal((empty.match(/<iframe/g)||[]).length,1); // Mapa movido, sin duplicar.
    assert.ok(!empty.includes('data-editorial-panel')); assert.ok(!empty.includes('href="#reservar"'));
    memory.prepare('INSERT INTO "PropertySection" (propertyId,section) VALUES (?,?)').run('pa','destino');
    assert.equal(await render(await Page({params})),empty);
    memory.prepare('DELETE FROM "PropertySection"').run();
    memory.prepare('INSERT INTO "PropertySection" (propertyId,section,descriptionEs,descriptionEn,descriptionFr) VALUES (?,?,?,?,?)')
      .run('pa','advertencias','Aviso ES','Notice EN','Avis FR');
    const warnings = await render(await Page({params}));
    assert.ok(warnings.includes(messages.details.advertencias));
    assert.ok(warnings.indexOf(messages.details.mapWarnings) < warnings.indexOf('id="reservar"'));
    assert.equal((warnings.match(/<iframe/g)||[]).length,1);
    memory.prepare('UPDATE "Property" SET lat=NULL,lng=NULL WHERE id=?').run('pa');
    assert.equal(((await render(await Page({params}))).match(/<iframe/g)||[]).length,0);
    memory.prepare('DELETE FROM "PropertySection"').run();
    const noMap = await render(await Page({params}));
    assert.ok(!noMap.includes(messages.details.mapWarnings));
    memory.prepare('UPDATE "Property" SET lat=20,lng=-100 WHERE id=?').run('pa');
    for (const section of ['destino','amenidades','habitaciones','lugar']) memory.prepare('INSERT INTO "PropertySection" (propertyId,section,descriptionEs,descriptionEn,descriptionFr,heroMediaId) VALUES (?,?,?,?,?,?)')
      .run('pa',section,section+' ES',section+' EN',section+' FR','hero');
    const html=await render(await Page({params}));
    assert.equal((html.match(/data-editorial-panel/g)||[]).length,4);
    assert.ok(html.includes('href="#reservar"')); assert.ok(html.includes('hidden')); assert.ok(html.includes('lg:flex'));
    assert.ok(html.includes('id="reservar"')); assert.ok(html.includes('maps.google.com')); assert.ok(html.includes('aria-modal="true"'));
    assert.ok(html.includes('destino '+locale.toUpperCase()));
    assert.ok(html.includes('<video')); // Tratamiento de vídeo principal conservado.
    memory.prepare('DELETE FROM "PropertySection"').run();
  }
  memory.close(); console.log('OK: PHOTO/hero, vacíos, 4 secciones glass, mapa único/advertencias/omisión, reserva/lightbox/vídeos y reduced-motion. Sin red/Neon.');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
