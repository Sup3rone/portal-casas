// Endpoint multipart y API Media reales; put mockeado, sin Blob/Neon.
const assert=require('node:assert/strict'),fs=require('node:fs');
const {load,memory,req,mockModule,setSession,setLocale}=require('./test-property-access.cjs');
const stored=[];let failSDK=false;
mockModule('@vercel/blob',{put:async(pathname,file,options)=>{
  if(failSDK)throw new Error('SDK error containing private configuration');
  stored.push({pathname,size:file.size,type:file.type,access:options.access,contentType:options.contentType,addRandomSuffix:options.addRandomSuffix,allowOverwrite:options.allowOverwrite});
  return {url:'https://teststore.public.blob.vercel-storage.com/'+pathname};
}});
const route=load('apps/web/src/app/api/properties/[id]/upload/route.ts');
const mediaRoute=load('apps/web/src/app/api/properties/[id]/[resource]/route.ts');
const {maxPhotoBytes}=load('apps/web/src/lib/photo-upload.ts');
const context=id=>({params:Promise.resolve({id})});
const file=(type='image/jpeg',size=1000)=>new File([new Uint8Array(size)],'../unsafe name.any',{type});
function request(photo=file(),extra){const form=new FormData();if(photo!==null)form.set('file',photo);if(extra)form.append(...extra);return new Request('http://localhost/test',{method:'POST',body:form});}
async function main(){
  for(const [actor,status]of [[null,401],['client',403],['viewer',403],['b',404]]){
    setSession(actor?{user:{id:actor}}:null);assert.equal((await route.POST(request(),context('pa'))).status,status);
  }
  assert.equal(stored.length,0);setSession({user:{id:'a'}});
  for(const [photo,code]of [[file('application/pdf'),'INVALID_FILE_TYPE'],[file('image/jpeg',maxPhotoBytes+1),'INVALID_FILE_SIZE'],[file('image/png',0),'INVALID_FILE_SIZE']]){
    const response=await route.POST(request(photo),context('pa'));assert.equal(response.status,400);assert.equal((await response.json()).code,code);
  }
  for(const invalid of [request(null),request('not-a-file'),request(file(),['file',file()]),request(file(),['ownerId','b']),new Request('http://localhost/test',{method:'POST',headers:{'Content-Type':'application/json'},body:'{"type":"blob.generate-client-token"}'})])assert.equal((await route.POST(invalid,context('pa'))).status,400);
  assert.equal(stored.length,0);
  let url;
  for(const [mime,extension]of [['image/jpeg','jpg'],['image/png','png'],['image/webp','webp']]){
    const response=await route.POST(request(file(mime,maxPhotoBytes)),context('pa'));
    assert.equal(response.status,201);assert.equal(response.headers.get('Cache-Control'),'no-store');url=(await response.json()).url;
    assert.equal(new URL(url).hostname,'teststore.public.blob.vercel-storage.com');
    const blob=stored.at(-1);assert.match(blob.pathname,new RegExp('^properties/pa/[0-9a-f-]{36}\\.'+extension+'$'));assert.ok(!blob.pathname.includes('unsafe'));
    assert.equal(blob.size,4000000);assert.equal(blob.type,mime);assert.equal(blob.contentType,mime);assert.equal(blob.access,'public');assert.equal(blob.allowOverwrite,false);assert.equal(blob.addRandomSuffix,false);
  }
  const response=await mediaRoute.POST(new Request('http://localhost/test',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url,category:'habitaciones',order:7})}),{params:Promise.resolve({id:'pa',resource:'media'})});
  assert.equal(response.status,201);const photo=memory.prepare('SELECT * FROM Media WHERE url=?').get(url);assert.equal(photo.type,'PHOTO');assert.equal(photo.category,'habitaciones');assert.equal(photo.order,7);
  setSession({user:{id:'admin'}});assert.equal((await route.POST(request(),context('pb'))).status,201);
  assert.ok(stored.at(-1).pathname.startsWith('properties/pb/'));
  failSDK=true;const failed=await route.POST(request(),context('pa'));assert.equal(failed.status,500);assert.deepEqual(await failed.json(),{error:'upload',code:'UPLOAD_FAILED'});
  const Editor=load('apps/web/src/components/panel/ResourceEditor.tsx').default;
  const React=req('react'),{renderToStaticMarkup}=req('react-dom/server'),{NextIntlClientProvider}=req('next-intl');
  for(const locale of ['es','en','fr']){
    setLocale(locale);const messages=JSON.parse(fs.readFileSync('apps/web/messages/'+locale+'.json','utf8'));
    const render=resource=>renderToStaticMarkup(React.createElement(NextIntlClientProvider,{locale,messages,timeZone:'America/Mexico_City'},React.createElement(Editor,{propertyId:'pa',resource,items:[]})));
    const html=render('media');assert.ok(html.includes('name="url"'));assert.ok(html.includes('image/jpeg,image/png,image/webp'));assert.ok(html.includes(messages.photoUpload.hint));assert.ok(messages.photoUpload.hint.includes(locale==='fr'?'4 Mo':'4 MB'));assert.ok(!render('rates').includes('type="file"'));
  }
  assert.ok(!fs.readFileSync('apps/web/src/components/panel/ResourceEditor.tsx','utf8').includes('@vercel/blob/client'));
  memory.close();console.log('OK server upload: multipart, 401/403/404, MIME/4MB 400, UUID seguro, put público/no overwrite, Media categoría/orden, error sanitizado y SSR es/en/fr. Sin red/Blob/Neon.');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
