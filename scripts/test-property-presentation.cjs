// Propiedad/API/SSR y SDK mock: sin Neon, Blob ni navegador.
const assert=require('node:assert/strict'),fs=require('node:fs');
const {load,memory,req,mockModule,setSession,setLocale}=require('./test-property-access.cjs');
const React=req('react'),{renderToReadableStream}=req('react-dom/server'),{NextIntlClientProvider}=req('next-intl');
const stored=[];
mockModule('@vercel/blob',{put:async(path,file,options)=>{stored.push({path,type:file.type,contentType:options.contentType});return{url:'https://qa.public.blob.vercel-storage.com/'+path};}});
const upload=load('apps/web/src/app/api/properties/[id]/upload/route.ts');
const api=load('apps/web/src/app/api/properties/[id]/route.ts');
const create=load('apps/web/src/app/api/properties/route.ts');
const Page=load('apps/web/src/app/[locale]/casas/[slug]/page.tsx').default;
const Editor=load('apps/web/src/components/panel/PropertyPresentationEditor.tsx').default;
const {propertySectionLabels,sectionTitle}=load('apps/web/src/lib/property-presentation.ts');
const {managedProperty}=load('apps/web/src/lib/panel-server.ts');
const context=id=>({params:Promise.resolve({id})});
const request=body=>new Request('http://localhost/test',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
const patch=body=>api.PATCH(request(body),context('pa'));
function video(type='video/mp4',size=100,purpose='hero-video'){
 const form=new FormData();form.set('file',new File([new Uint8Array(size)],'unsafe name.any',{type}));if(purpose)form.set('purpose',purpose);
 return new Request('http://localhost/test',{method:'POST',body:form});
}
async function main(){
 for(const [id,status]of [[null,401],['client',403],['b',404]]){setSession(id?{user:{id}}:null);assert.equal((await upload.POST(video(),context('pa'))).status,status);assert.equal((await patch({sectionTitles:null})).status,status);}
 setSession({user:{id:'a'}});
 for(const type of ['video/mp4','video/webm']){
  const response=await upload.POST(video(type),context('pa'));assert.equal(response.status,201);assert.ok((await response.json()).url.startsWith('https://qa.public.blob.vercel-storage.com/properties/pa/hero/'));
  assert.match(stored.at(-1).path,/\/hero\/[0-9a-f-]+\.(mp4|webm)$/);assert.equal(stored.at(-1).contentType,type);
 }
 for(const [r,code]of [[video('video/quicktime'),'INVALID_VIDEO_TYPE'],[video('video/mp4',4000001),'INVALID_VIDEO_SIZE'],[video('video/mp4',0),'INVALID_VIDEO_SIZE'],[video('image/jpeg'),'INVALID_VIDEO_TYPE'],[video('video/mp4',100,''),'INVALID_FILE_TYPE']]){
  const response=await upload.POST(r,context('pa'));assert.equal(response.status,400);assert.equal((await response.json()).code,code);
 }
 const sectionTitles=Object.fromEntries(Object.keys(propertySectionLabels).map(key=>[key,{es:key+' español',en:key+' English',fr:key+' français'}]));
 for(const body of [{sectionTitles:{heroVideoUrl:'javascript:alert(1)'}},{sectionTitles:{heroVideoUrl:'http://bad.invalid/a.mp4'}},{sectionTitles:{titles:{destino:{es:'Uno',en:'',fr:'Un'}}}},{sectionTitles:{titles:{destino:{es:'x'.repeat(151),en:'one',fr:'un'}}}},{sectionTitles:{titles:{other:{es:'a',en:'b',fr:'c'}}}}])assert.equal((await patch(body)).status,400);
 const heroVideoUrl='https://qa.public.blob.vercel-storage.com/hero.mp4';
 assert.equal((await patch({sectionTitles:{heroVideoUrl,titles:sectionTitles}})).status,200);
 const property=await managedProperty('pa',{id:'a',role:'COLLABORATOR'});
 assert.equal(property.sectionTitles.heroVideoUrl,heroVideoUrl);assert.deepEqual(property.sectionTitles.titles,sectionTitles);
 assert.equal(sectionTitle(null,'destino','en','Default'),'Default');
 assert.equal(sectionTitle(sectionTitles,'mapa','fr','Default'),'mapa français');
 const body={titleEs:'Casa',titleEn:'House',titleFr:'Maison',descEs:'Descripción',descEn:'Description',descFr:'Description',address:'Calle',maxGuests:4,bedrooms:2,bathrooms:1,sectionTitles:{heroVideoUrl,titles:sectionTitles}};
 const creation=await create.POST(request(body));assert.equal(creation.status,201,'Creación también admite configuración');
 const createdId=(await creation.json()).id;
 assert.deepEqual((await managedProperty(createdId,{id:'a',role:'COLLABORATOR'})).sectionTitles,{heroVideoUrl,titles:sectionTitles});
 memory.prepare('UPDATE Property SET titleEs=?,titleEn=?,titleFr=?,descEs=?,descEn=?,descFr=?,city=?,lat=20,lng=-100,maxGuests=4,bedrooms=2,bathrooms=1 WHERE id=?').run('Casa','House','Maison','Descripción','Description','Description','Vallarta','pa');
 for(const [index,category]of ['principal','amenidades','habitaciones','lugar'].entries())memory.prepare('INSERT INTO Media (id,propertyId,url,type,"order",category) VALUES (?,?,?,?,?,?)').run('photo'+index,'pa','/photo'+index+'.jpg','PHOTO',index,category);
 for(const section of ['destino','amenidades','habitaciones','lugar','advertencias'])memory.prepare('INSERT INTO PropertySection (propertyId,section,descriptionEs,descriptionEn,descriptionFr) VALUES (?,?,?,?,?)').run('pa',section,'Texto '+section,'Content '+section,'Contenu '+section);
 for(const locale of ['es','en','fr']){
  setLocale(locale);const messages=require('../apps/web/messages/'+locale+'.json');
  const render=async node=>{const stream=await renderToReadableStream(React.createElement(NextIntlClientProvider,{locale,messages,timeZone:'America/Mexico_City'},node));await stream.allReady;return new Response(stream).text();};
  const html=await render(await Page({params:Promise.resolve({locale,slug:'pa'})}));
  assert.ok(html.includes('data-hero-video="true"'));assert.ok(html.includes(heroVideoUrl));assert.ok(html.includes('poster="/photo0.jpg"'));
  for(const row of Object.values(sectionTitles))assert.ok(html.includes(row[locale]),'Título localizado de sección');
  for(const name of ['detail-from-left','detail-from-right','detail-calendar','detail-reservation-form'])assert.ok(html.includes(name));
  assert.ok(html.includes('lg:order-2'));assert.ok(html.includes('lg:order-1'));assert.ok(html.includes('id="reservar"'));assert.ok(html.includes('maps.google.com'));
  const editor=await render(React.createElement(Editor,{property}));assert.ok(editor.includes('video/mp4,video/webm'));assert.ok(editor.includes('name="destino_es"'));assert.ok(editor.includes('destino français'));assert.ok(editor.includes(messages.panel.heroVideoHint));
 }
 assert.equal((await patch({sectionTitles:null})).status,200);
 assert.equal((await managedProperty('pa',{id:'a',role:'COLLABORATOR'})).sectionTitles,null);
 const css=fs.readFileSync('apps/web/src/app/property-presentation.css','utf8');
 assert.ok(css.includes('prefers-reduced-motion: reduce'));assert.ok(css.includes('reveal-visible'));assert.ok(css.includes('order: 2'));
 const scrim=Number(css.match(/--detail-hero-scrim: color-mix\(in srgb, var\(--color-black\) (\d+)%/)[1])/100,channel=1-scrim,luminance=((channel+.055)/1.055)**2.4;
 assert.ok(1.05/(luminance+.05)>=4.5,'Texto blanco sobre foto blanca + scrim cumple AA');
 setSession({user:{id:'admin'}});assert.equal((await upload.POST(video(),context('pb'))).status,201);
 console.log('OK ficha: video propio/admin, 401/403/404, MIME/4MB, URL, títulos completos y defaults, persistencia, creación, SSR es/en/fr, reserva/galería y reduced-motion.');
}
main().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>memory.close());
