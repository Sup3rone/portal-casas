// Metadata y rutas SEO reales con Drizzle/SQLite en memoria; sin red ni Neon.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { load, memory, setLocale, mockModule } = require('./test-property-access.cjs');
process.env.PUBLIC_SITE_URL = 'https://portal.test';
const seo = load('apps/web/src/lib/seo.ts');
const detail = load('apps/web/src/app/[locale]/casas/[slug]/page.tsx');
const home = load('apps/web/src/app/[locale]/page.tsx');
const listing = load('apps/web/src/app/[locale]/casas/page.tsx');
const sitemap = load('apps/web/src/app/sitemap.ts').default;
const robots = load('apps/web/src/app/robots.ts').default;
async function main() {
  memory.prepare('UPDATE "Property" SET titleEs=?,titleEn=?,titleFr=?,descEs=?,descEn=?,descFr=? WHERE id=?').run('Casa española','English house','Maison française','Una casa cerca del mar.','A house near the sea.','Une maison près de la mer.','pa');
  const insert = memory.prepare('INSERT INTO "Media" (id,propertyId,url,type,"order",isCover,coverOrder) VALUES (?,?,?,?,?,?,?)');
  insert.run('first','pa','/fotos/primera.jpg','PHOTO',0,0,null);
  insert.run('cover-two','pa','https://store.public.blob.vercel-storage.com/two.jpg','PHOTO',1,1,2);
  insert.run('cover-one','pa','https://store.public.blob.vercel-storage.com/one.jpg','PHOTO',9,1,0);
  insert.run('video','pa','/fotos/video.mp4','VIDEO',0,1,-1);
  for (const [locale,title,description] of [['es','Casa española','Una casa cerca del mar.'],['en','English house','A house near the sea.'],['fr','Maison française','Une maison près de la mer.']]) {
    setLocale(locale);
    const metadata = await detail.generateMetadata({params:Promise.resolve({locale,slug:'pa'})});
    assert.equal(metadata.title,title); assert.equal(metadata.description,description);
    assert.equal(metadata.alternates.canonical,`https://portal.test/${locale}/casas/pa`);
    for(const lang of ['es','en','fr']) assert.equal(metadata.alternates.languages[lang],`https://portal.test/${lang}/casas/pa`);
    assert.equal(metadata.alternates.languages['x-default'],'https://portal.test/es/casas/pa');
    assert.equal(metadata.openGraph.title,`${title} | Portal Casas`);
    assert.equal(metadata.openGraph.type,'website'); assert.equal(metadata.openGraph.siteName,'Portal Casas');
    assert.equal(metadata.openGraph.images[0].url,'https://store.public.blob.vercel-storage.com/one.jpg');
    assert.equal(metadata.twitter.card,'summary_large_image'); assert.equal(metadata.twitter.images[0],metadata.openGraph.images[0].url);
    for(const [page,path] of [[home,''],[listing,'/casas']]) {
      const value = await page.generateMetadata({params:Promise.resolve({locale})});
      assert.ok(value.title); assert.ok(value.description); assert.equal(value.alternates.canonical,`https://portal.test/${locale}${path}`);
      assert.deepEqual(value.openGraph.images,[{url:'https://portal.test/og-default.jpg',width:1200,height:630,alt:'Portal Casas'}]);
      assert.deepEqual(value.twitter.images,['https://portal.test/og-default.jpg']);
    }
  }
  memory.prepare('UPDATE "Media" SET isCover=0 WHERE propertyId=?').run('pa');
  assert.equal((await detail.generateMetadata({params:Promise.resolve({locale:'es',slug:'pa'})})).openGraph.images[0].url,'https://portal.test/fotos/primera.jpg');
  const noPhoto = await detail.generateMetadata({params:Promise.resolve({locale:'es',slug:'pb'})});
  assert.deepEqual(noPhoto.openGraph.images,[seo.defaultSocialImage()]); assert.deepEqual(noPhoto.twitter.images,['https://portal.test/og-default.jpg']);
  mockModule('../globals.css', {});
  // next/font se transforma en compilación; este test de metadata no ejecuta webpack.
  mockModule('next/font/google', { Marcellus: () => ({ variable: 'marcellus-logo-variable' }) });
  const layoutMetadata = load('apps/web/src/app/[locale]/layout.tsx').metadata;
  assert.deepEqual(layoutMetadata.openGraph.images,[seo.defaultSocialImage()]);
  assert.deepEqual(layoutMetadata.twitter.images,['https://portal.test/og-default.jpg']);
  const jpeg=fs.readFileSync('apps/web/public/og-default.jpg');
  assert.ok(jpeg.length < 300000); assert.equal(jpeg.readUInt16BE(0),0xffd8);
  let dimensions;
  for(let offset=2;offset<jpeg.length;) {
    while(jpeg[offset]===0xff) offset++;
    const marker=jpeg[offset++], length=jpeg.readUInt16BE(offset);
    if([0xc0,0xc1,0xc2].includes(marker)) { dimensions=[jpeg.readUInt16BE(offset+5),jpeg.readUInt16BE(offset+3)]; break; }
    offset+=length;
  }
  assert.deepEqual(dimensions,[1200,630],'Imagen social real con las dimensiones requeridas');
  await assert.rejects(detail.generateMetadata({params:Promise.resolve({locale:'es',slug:'hidden'})}), /notFound/);
  await assert.rejects(detail.generateMetadata({params:Promise.resolve({locale:'es',slug:'missing'})}), /notFound/);
  const text = 'Una descripción completa que no debe terminar con una palabra cortada. '.repeat(6);
  const excerpt = seo.descriptionExcerpt(text); assert.ok(excerpt.length <= 155); assert.ok(excerpt.endsWith('…')); assert.ok(text.startsWith(excerpt.slice(0,-1)));
  assert.equal(seo.descriptionExcerpt('Una\n casa   bonita'),'Una casa bonita'); assert.equal(seo.descriptionExcerpt(''), '');
  assert.equal(seo.descriptionExcerpt('x'.repeat(200)), '', 'No cortar un token largo sin espacios');
  const rows = await sitemap(); assert.equal(rows.length,12); assert.ok(rows.every(row=>!row.url.includes('hidden')));
  for(const path of ['', '/casas','/casas/pa','/casas/pb']) for(const locale of ['es','en','fr']) {
    const row = rows.find(row=>row.url === `https://portal.test/${locale}${path}`); assert.ok(row); assert.equal(row.lastModified,undefined);
    assert.equal(row.alternates.languages['x-default'],`https://portal.test/es${path}`);
  }
  const rules = robots(); assert.equal(rules.rules.allow,'/'); assert.equal(rules.sitemap,'https://portal.test/sitemap.xml');
  for(const locale of ['es','en','fr']) for(const path of ['/panel','/admin','/mi-cuenta','/reset-password']) assert.ok(rules.rules.disallow.includes(`/${locale}${path}`));
  assert.deepEqual(seo.privateMetadata.robots,{index:false,follow:false});
  for(const file of ['login/page.tsx','registro/page.tsx','olvide-password/page.tsx','reset-password/page.tsx','mi-cuenta/page.tsx','panel/layout.tsx','admin/layout.tsx']) assert.ok(fs.readFileSync('apps/web/src/app/[locale]/'+file,'utf8').includes('export const metadata = privateMetadata'));
  assert.match(fs.readFileSync('apps/web/next.config.ts','utf8'), /htmlLimitedBots:\s*\/\.\*\//);
  delete process.env.PUBLIC_SITE_URL; assert.equal(seo.siteUrl().origin,'http://localhost:3000');
  for(const value of ['ftp://portal.test','https://user:pass@portal.test','https://portal.test/path','https://portal.test?x=1']) {process.env.PUBLIC_SITE_URL=value;assert.throws(seo.siteUrl);}
  console.log('OK SEO: metadata es/en/fr, canonical/hreflang, OG/Twitter, portada/fallback/sin foto, publicados, sitemap/robots, noindex y origen.');
}
main().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>{delete process.env.PUBLIC_SITE_URL;memory.close();});
