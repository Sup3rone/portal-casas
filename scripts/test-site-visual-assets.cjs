const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');
const {load,req,memory,mockModule,setSession,setLocale}=require('./test-property-access.cjs');
const stored=[],deleted=[];mockModule('@vercel/blob',{put:async(pathname,file)=>{stored.push(pathname);return {url:'https://qa.public.blob.vercel-storage.com/'+pathname};},del:async url=>{deleted.push(url);}});
const upload=load('apps/web/src/app/api/panel/site-content/upload/route.ts'),api=load('apps/web/src/app/api/panel/site-content/route.ts');
const Home=load('apps/web/src/app/[locale]/page.tsx').default,List=load('apps/web/src/app/[locale]/casas/page.tsx').default,Editor=load('apps/web/src/components/panel/SiteContentEditor.tsx').default;
const React=req('react'),{renderToStaticMarkup}=req('react-dom/server'),{NextIntlClientProvider}=req('next-intl');
const base={about_es:'',about_en:'',about_fr:'',social_instagram:'',social_facebook:'',featured_property_id:'',contact_whatsapp:''};
const assets={...base,about_title_es:'',about_title_en:'',about_title_fr:'',about_image:'',home_background_videos:'',home_background_video:'https://example.com/background.mp4',listing_background_image:'https://qa.public.blob.vercel-storage.com/site/listing/test.jpg'};
const put=value=>api.PUT(new Request('http://localhost/test',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(value)}));
function fileRequest(type='image/jpeg',size=100,purpose){const form=new FormData();form.set('file',new File([new Uint8Array(size)],type.startsWith('video/')?'qa.mp4':'qa.jpg',{type}));if(purpose)form.set('purpose',purpose);return new Request('http://localhost/test',{method:'POST',body:form});}
(async()=>{try{
for(const [id,status] of [[null,401],['a',403],['client',403]]){setSession(id?{user:{id}}:null);assert.equal((await upload.POST(fileRequest())).status,status);}assert.equal(stored.length,0);
setSession({user:{id:'admin'}});
for(const [type,size]of [['image/gif',100],['image/jpeg',4000001]])assert.equal((await upload.POST(fileRequest(type,size))).status,400);
assert.equal((await upload.POST(fileRequest())).status,201);assert.match(stored[0],/^site\/listing\/[0-9a-f-]+\.jpg$/);
for(const key of ['home_background_video','listing_background_image'])for(const value of ['http://example.com/file','javascript:alert(1)','https://user:pass@example.com'])assert.equal((await put({...assets,[key]:value})).status,400);
assert.equal((await put(assets)).status,200);assert.deepEqual(await (await api.GET()).json(),assets);
const oldVideo='https://qa.public.blob.vercel-storage.com/site/home-video/previous.mp4';
assert.equal((await put({...assets,home_background_video:oldVideo})).status,200);
// T-4679: subir un video solo lo guarda en Blob; no cambia SiteContent ni borra el anterior.
const videoUpload=await upload.POST(fileRequest('video/mp4',100,'home-background-video'));assert.equal(videoUpload.status,201);
const uploadedVideo=(await videoUpload.json()).url;assert.match(uploadedVideo,/^https:\/\/qa\.public\.blob\.vercel-storage\.com\/site\/home-video\/[0-9a-f-]+\.mp4$/);
assert.deepEqual(deleted,[],'Ningún video anterior se borra');assert.equal((await (await api.GET()).json()).home_background_video,oldVideo,'El video anterior queda intacto');
for(const value of ['nope','{}','[{"url":"http://x.test/a.mp4","device":"all"}]','[{"url":"https://x.test/a.mp4","device":"tv"}]','[{"url":"https://x.test/a.mp4","device":"all","extra":1}]',JSON.stringify(Array.from({length:7},(_,i)=>({url:'https://x.test/'+i+'.mp4',device:'all'})))]){const res=await put({...assets,home_background_video:oldVideo,home_background_videos:value});assert.equal(res.status,400,value);assert.equal((await res.json()).code,'INVALID_HOME_VIDEOS');}
const playlist=[{url:'https://x.test/playa.mp4',device:'mobile'},{url:uploadedVideo,device:'all'},{url:'https://x.test/escritorio.mp4',device:'desktop'}];
assert.equal((await put({...assets,home_background_video:oldVideo,home_background_videos:JSON.stringify(playlist)})).status,200);
const updated=await (await api.GET()).json();assert.deepEqual(JSON.parse(updated.home_background_videos),playlist);assert.equal(updated.home_background_video,oldVideo);
{setLocale('es');const html=renderToStaticMarkup(await Home({params:Promise.resolve({locale:'es'})}));
assert.ok(html.includes('id="home-background-video-next"'),'Segundo reproductor con varios videos');assert.ok(html.includes('poster="/og-default.jpg"'));
assert.ok(html.includes('src="'+uploadedVideo+'" media="(prefers-reduced-motion: no-preference) and (min-width: 768px)"'),'Primero de escritorio');
assert.ok(html.includes('src="https://x.test/playa.mp4" media="(prefers-reduced-motion: no-preference) and (max-width: 767.98px)"'),'Primero de móvil');
assert.ok(!html.includes('escritorio.mp4')&&!html.includes(oldVideo),'Solo se precarga el primero de cada viewport');}
assert.equal((await put(base)).status,200);assert.deepEqual(await (await api.GET()).json(),updated,'Cliente antiguo no borra activos');
for(const locale of ['es','en','fr']){
setLocale(locale);const messages=JSON.parse(fs.readFileSync('apps/web/messages/'+locale+'.json'));
const render=tree=>renderToStaticMarkup(React.createElement(NextIntlClientProvider,{locale,messages,timeZone:'America/Mexico_City'},tree));
const home=render(await Home({params:Promise.resolve({locale})})),listing=render(await List({params:Promise.resolve({locale}),searchParams:Promise.resolve({guests:'9999'})})),editor=render(React.createElement(Editor,{content:assets,properties:[]}));
assert.ok(home.includes('<video'));assert.ok(!listing.includes(assets.listing_background_image));assert.ok(home.includes('public-paper'));assert.ok(listing.includes('public-paper'));assert.ok(editor.includes('name="home_background_video"'));assert.ok(editor.includes('name="home_background_videos"'));assert.ok(editor.includes('accept="video/mp4,video/webm"'));assert.ok(editor.includes('name="listing_background_image"'));assert.ok(editor.includes('type="file"'));
if(process.env.SITE_ASSETS_QA_DIR&&locale==='es')for(const [name,body]of [['editor',editor],['home',home],['casas',listing]])fs.writeFileSync(path.join(process.env.SITE_ASSETS_QA_DIR,'assets-'+name+'.html'),`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/manager-qa.css"></head><body><p>QA OFFLINE — datos ficticios, recursos remotos de prueba</p>${body}</body></html>`);
}
assert.equal((await put({...base,home_background_videos:'',home_background_video:oldVideo})).status,200);
{const html=renderToStaticMarkup(await Home({params:Promise.resolve({locale:'es'})}));assert.ok(html.includes('src="'+oldVideo+'" media="(prefers-reduced-motion: no-preference)"'),'Sin lista vuelve el video anterior');assert.ok(!html.includes('home-background-video-next'));}
assert.equal((await put({...base,home_background_video:'',listing_background_image:''})).status,200);
const emptyHome=renderToStaticMarkup(await Home({params:Promise.resolve({locale:'es'})}));assert.ok(emptyHome.includes('/videos/hero.mp4'));
console.log('OK activos: ADMIN, 401/403, MIME/4MB400, put mock, URLs HTTPS400, video sin borrar anterior, lista de videos 400/200 y SSR por viewport, persistencia/vaciado, cliente antiguo, SSR editor/home/casas es/en/fr.');
}finally{memory.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
