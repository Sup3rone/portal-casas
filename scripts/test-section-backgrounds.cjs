// API/SSR reales con BD en memoria. Sin Neon ni Blob.
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const { load, memory, req, setSession, setLocale, mockModule } = require('./test-property-access.cjs');
const route = load('apps/web/src/app/api/properties/[id]/route.ts');
const { propertyInput } = load('apps/web/src/lib/panel-validation.ts');
const Editor = load('apps/web/src/components/panel/SectionBackgroundEditor.tsx').default;
const Page = load('apps/web/src/app/[locale]/casas/[slug]/page.tsx').default;
const React = req('react'), { renderToReadableStream, renderToStaticMarkup } = req('react-dom/server');
const { NextIntlClientProvider } = req('next-intl');
const fields = ['sectionBgInicio','sectionBgMapa','sectionBgReserva'];
for (const [id,owner,type,url] of [['own','pa','PHOTO','https://store.public.blob.vercel-storage.com/own.jpg'],['foreign','pb','PHOTO','/foreign.jpg'],['video','pa','VIDEO','/video.mp4']]) {
  memory.prepare('INSERT INTO "Media" (id,propertyId,type,category,"order",url) VALUES (?,?,?,?,?,?)').run(id,owner,type,'principal',0,url);
}
const ownUrl='https://store.public.blob.vercel-storage.com/own.jpg';
const request=body=>new Request('http://localhost/api/test',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
const context={params:Promise.resolve({id:'pa'})};
const get=()=>memory.prepare('SELECT * FROM "Property" WHERE id=?').get('pa');
function find(node,predicate) {
  if(!node||typeof node!=='object')return;
  if(predicate(node))return node;
  for(const child of [node.props?.children].flat(Infinity)){const found=find(child,predicate);if(found)return found;}
}
async function main(){
  setSession({user:{id:'a'}});
  for(const field of fields){
    assert.equal(get()[field],null);
    assert.equal((await route.PATCH(request({[field]:ownUrl}),context)).status,200);
    assert.equal(get()[field],ownUrl);
    for(const value of ['/foreign.jpg','/video.mp4','/missing.jpg',42,'javascript:alert(1)','https://outside.example/photo.jpg']){
      const response=await route.PATCH(request({[field]:value}),context);
      assert.equal(response.status,400);assert.equal(get()[field],ownUrl);
      if(value==='/foreign.jpg')assert.equal((await response.json()).code,'INVALID_BACKGROUND_PHOTO');
    }
  }
  assert.throws(()=>propertyInput({sectionBgInicio:ownUrl},true));
  setSession({user:{id:'b'}});assert.equal((await route.PATCH(request({sectionBgInicio:null}),context)).status,404);
  setSession({user:{id:'client'}});assert.equal((await route.PATCH(request({sectionBgInicio:null}),context)).status,403);
  setSession(null);assert.equal((await route.PATCH(request({sectionBgInicio:null}),context)).status,401);
  setSession({user:{id:'admin'}});assert.equal((await route.PATCH(request({sectionBgInicio:ownUrl}),context)).status,200);
  memory.prepare('UPDATE "Property" SET titleEs=?,titleEn=?,titleFr=?,descEs=?,descEn=?,descFr=?,city=?,address=?,lat=20,lng=-100,maxGuests=4,bedrooms=2,bathrooms=1 WHERE id=?')
    .run('Casa','House','Maison','Texto','Text','Texte','City','Address','pa');
  const media=memory.prepare('SELECT * FROM "Media" WHERE propertyId=? ORDER BY "order"').all('pa');
  for(const locale of ['es','en','fr']){
    setLocale(locale);
    const messages=JSON.parse(fs.readFileSync(path.join(__dirname,'../apps/web/messages',locale+'.json'),'utf8'));
    const wrap=child=>React.createElement(NextIntlClientProvider,{locale,messages,timeZone:'America/Mexico_City',onError(error){throw error;}},child);
    const editor=renderToStaticMarkup(wrap(React.createElement(Editor,{property:get(),media})));
    assert.ok(editor.includes(messages.sectionBackgrounds.title));assert.ok(editor.includes(messages.sectionBackgrounds.none));
    for(const field of fields)assert.ok(editor.includes(`name="${field}"`));
    assert.ok(!editor.includes('/video.mp4'));
    const stream=await renderToReadableStream(wrap(await Page({params:Promise.resolve({locale,slug:'pa'})})));await stream.allReady;
    const html=await new Response(stream).text();
    assert.equal((html.match(/data-section-background=/g)||[]).length,3);
    assert.ok(!html.includes('dark:bg-gray-950/90'));assert.ok(html.includes('object-cover'));
    assert.equal((html.match(/section-background-photo /g)||[]).length,3);
    assert.equal((html.match(/detail-image-heading/g)||[]).length,2);
    assert.ok(html.includes('id="reservar"'));assert.ok(html.includes('maps.google.com'));
  }
  for(const field of fields)assert.equal((await route.PATCH(request({[field]:null}),context)).status,200);
  assert.ok(fields.every(field=>get()[field]===null));
  const Background=load('apps/web/src/components/SectionBackground.tsx').default;
  const empty=renderToStaticMarkup(React.createElement(Background,{url:null,name:'gallery',className:'detail-screen'},'Content'));
  assert.ok(!empty.includes('bg-white/90')&&!empty.includes('<img'));assert.ok(empty.includes('Content'));
  assert.ok(!empty.includes('section-background-photo'));
  const backgroundSource=fs.readFileSync(path.join(__dirname,'../apps/web/src/components/SectionBackground.tsx'),'utf8');
  assert.ok(!backgroundSource.includes('bg-white/90')&&!backgroundSource.includes('bg-gray-950/90'));
  const css=fs.readFileSync(path.join(__dirname,'../apps/web/src/app/globals.css'),'utf8');
  assert.ok(css.includes('.section-background-photo .glass-panel'));
  assert.ok(css.includes('background-color: var(--color-white)'));
  assert.ok(css.includes('text-shadow: 0 2px 6px'));

  // Ejercitar el formulario cliente real: selección, PATCH por campo y vaciado.
  let state=[],cursor=0,requests=[];
  mockModule('react',{...React,useState:initial=>{const index=cursor++;if(!(index in state))state[index]=initial;return[state[index],value=>{state[index]=typeof value==='function'?value(state[index]):value;}];}});
  mockModule('next-intl',{useTranslations:()=>key=>key});
  mockModule('./request',{panelRequest:async(...args)=>{requests.push(args);return{};},buttonClass:'button'});
  const Interactive=load('apps/web/src/components/panel/SectionBackgroundEditor-test.tsx',fs.readFileSync(path.join(__dirname,'../apps/web/src/components/panel/SectionBackgroundEditor.tsx'),'utf8')).default;
  const tree=Interactive({property:get(),media});
  const picker=find(tree,node=>node.props?.field==='sectionBgReserva');
  let form=picker.type(picker.props);
  find(form,node=>node.type==='input'&&node.props.value===ownUrl).props.onChange();
  cursor=0;form=picker.type(picker.props);await form.props.onSubmit({preventDefault(){}});
  assert.deepEqual(requests[0],[`/api/properties/pa`,'PATCH',{sectionBgReserva:ownUrl}]);
  find(form,node=>node.type==='input'&&node.props.value==='').props.onChange();
  cursor=0;form=picker.type(picker.props);await form.props.onSubmit({preventDefault(){}});
  assert.deepEqual(requests[1],[`/api/properties/pa`,'PATCH',{sectionBgReserva:null}]);
  console.log('OK fondos: PHOTO propia, 400 inválida/VIDEO/ajena, ownership 404/403/401, admin, NULL, UI PATCH y SSR es/en/fr. Sin red/BD real.');
}
main().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>memory.close());
