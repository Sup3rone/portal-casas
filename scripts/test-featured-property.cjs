// SQL real en memoria y SSR de home/panel; sin conexiones a Neon.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {load,memory,req,setLocale,setSession}=require('./test-property-access.cjs');
const React=req('react'),{renderToStaticMarkup}=req('react-dom/server'),{NextIntlClientProvider}=req('next-intl');
const {briefDescription,readFeaturedProperty}=load('apps/web/src/lib/site-content.ts');
const Home=load('apps/web/src/app/[locale]/page.tsx').default;
const Page=load('apps/web/src/app/[locale]/panel/contenido/page.tsx').default;
const api=load('apps/web/src/app/api/panel/site-content/route.ts');
const content={about_es:'Nosotros',about_en:'About',about_fr:'À propos',social_instagram:'',social_facebook:'',featured_property_id:'pa',contact_whatsapp:''};
const put=value=>api.PUT(new Request('http://localhost/test',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(value)}));
const render=async(locale,component)=>{
  setLocale(locale);const messages=require('../apps/web/messages/'+locale+'.json');
  return renderToStaticMarkup(React.createElement(NextIntlClientProvider,{locale,messages,timeZone:'America/Mexico_City'},await component({params:Promise.resolve({locale})})));
};
async function main(){
  assert.equal(briefDescription('  Short\n description  '),'Short description');
  assert.equal(briefDescription('x'.repeat(200)),'x'.repeat(200));
  assert.equal(briefDescription('one two three four',10),'one two…');
  assert.equal(briefDescription('one two three four',7),'one two…');
  assert.equal(briefDescription('x'.repeat(250)),'x'.repeat(200)+'…');
  assert.equal(await readFeaturedProperty(''),null);
  assert.equal(await readFeaturedProperty('missing'),null);
  assert.equal(await readFeaturedProperty('pa'),null); // Sin fotos.
  memory.prepare('UPDATE Property SET titleEs=?,titleEn=?,titleFr=?,descEs=?,descEn=?,descFr=?,city=? WHERE id=?')
    .run('Casa ES','House EN','Maison FR','descripción '.repeat(30),'description '.repeat(30),'description FR '.repeat(30),'Vallarta','pa');
  const insert=memory.prepare('INSERT INTO Media (id,propertyId,url,type,"order",isCover,coverOrder) VALUES (?,?,?,?,?,?,?)');
  insert.run('photo-first','pa','https://test.invalid/first.jpg','PHOTO',0,0,null);
  insert.run('cover-second','pa','https://test.invalid/second.jpg','PHOTO',1,1,1);
  insert.run('cover-first','pa','https://test.invalid/cover.jpg','PHOTO',50,1,0);
  insert.run('video','pa','https://test.invalid/video.mp4','VIDEO',-1,0,null);
  assert.equal((await readFeaturedProperty('pa')).photo.id,'cover-first');
  setSession({user:{id:'a'}});assert.equal((await put(content)).status,403);
  setSession({user:{id:'admin'}});
  for(const id of ['hidden','missing','x'.repeat(201)]){
    const response=await put({...content,featured_property_id:id});
    assert.equal(response.status,400);assert.equal((await response.json()).code,'INVALID_FEATURED_PROPERTY');
  }
  assert.equal((await put(content)).status,200);
  for(const locale of ['es','en','fr']){
    const messages=require('../apps/web/messages/'+locale+'.json');
    const html=await render(locale,Home);
    assert.ok(html.includes(messages.siteContent.featuredTitle));
    assert.ok(html.includes(locale==='es'?'Casa ES':locale==='en'?'House EN':'Maison FR'));
    assert.ok(html.includes('https://test.invalid/cover.jpg'));
    assert.ok(!html.includes('https://test.invalid/second.jpg'));
    assert.ok(html.includes(`href="/${locale}/casas/pa"`));
    assert.ok(html.includes(messages.properties.bathrooms));assert.ok(html.includes('…'));
    assert.ok(html.indexOf(messages.siteContent.featuredTitle)>html.indexOf('home-video-closing'));
    assert.ok(html.includes('md:grid-cols-2'));assert.ok(html.includes('about-reveal'));
    const editor=await render(locale,Page);
    assert.ok(editor.includes('name="featured_property_id"'));
    assert.match(editor,/<option(?=[^>]*value="pa")(?=[^>]*selected="")[^>]*>/);assert.ok(!editor.includes('value="hidden"'));
  }
  memory.prepare('UPDATE Media SET isCover=0,coverOrder=NULL WHERE propertyId=?').run('pa');
  assert.equal((await readFeaturedProperty('pa')).photo.id,'photo-first');
  memory.prepare('UPDATE Property SET titleEn=?,descEn=? WHERE id=?').run('','','pa');
  const fallback=await render('en',Home);assert.ok(fallback.includes('Casa ES'));assert.ok(fallback.includes(briefDescription('descripción '.repeat(30))));
  memory.prepare('UPDATE Property SET published=0 WHERE id=?').run('pa');
  assert.equal(await readFeaturedProperty('pa'),null);
  assert.ok(!(await render('en',Home)).includes('home-featured-image'));
  assert.ok((await render('en',Page)).includes('Property unavailable'));
  assert.equal((await put({...content,featured_property_id:null})).status,200);
  assert.equal((await (await api.GET()).json()).featured_property_id,'');
  assert.ok(!(await render('es',Home)).includes('home-featured-image'));
  // Una publicada sin PHOTO se puede elegir, pero no crea una tarjeta vacía.
  assert.equal((await put({...content,featured_property_id:'pb'})).status,200);
  assert.ok(!(await render('fr',Home)).includes('home-featured-image'));
  memory.prepare('DELETE FROM Property WHERE id=?').run('pb');
  assert.ok(!(await render('fr',Home)).includes('home-featured-image'));
  const css=fs.readFileSync('apps/web/src/app/globals.css','utf8');
  assert.match(css,/home-featured-image:hover .home-featured-photo \{ transform: scale\(1\.03\)/);
  assert.match(css,/@media \(prefers-reduced-motion: reduce\) \{\s*.home-featured-image:hover .home-featured-photo \{ transform: none/);
  // CHECK propuesto admite la sexta clave sin abrir el catálogo a claves arbitrarias.
  const sql=fs.readFileSync('scripts/sql/site-content-featured.sql','utf8');
  const check=sql.match(/CHECK \(([\s\S]*?)\);/)[1];
  memory.exec(`CREATE TEMP TABLE check_featured ("key" TEXT CHECK (${check}))`);
  memory.prepare('INSERT INTO check_featured VALUES (?)').run('featured_property_id');
  assert.throws(()=>memory.prepare('INSERT INTO check_featured VALUES (?)').run('unexpected'),/CHECK/);
  console.log('OK destacada: permisos ADMIN, publicada/PHOTO, portada/fallback, SSR es/en/fr, ninguna/eliminada/despublicada, extracto y CHECK propuesto. Sin Neon.');
}
main().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>memory.close());
