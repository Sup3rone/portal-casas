// Pruebas de traducción sin red ni BD real; proveedor y hooks simulados.
const assert = require('node:assert/strict');
const { load, req, mockModule, memory, setSession } = require('./test-property-access.cjs');
const { translateFields } = load('apps/web/src/lib/panel-translation-drafts.ts');
const service = load('apps/web/src/lib/panel-translation.ts');
const originalFetch = global.fetch;
const fields = source => Object.fromEntries(['es','en','fr'].map(language => [language, { value: language === source ? 'Texto original' : '', maxLength: 10000 }]));
const request = body => new Request('http://localhost/api/traducir', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
const success = text => Response.json({ responseStatus:200, responseData:{ translatedText:text }, quotaFinished:false });
function find(node, predicate) {
  if (!node || typeof node !== 'object') return null;
  if (Array.isArray(node)) { for (const child of node) { const found = find(child, predicate); if (found) return found; } return null; }
  return predicate(node) ? node : find(node.props?.children, predicate);
}
async function main() {
  for (const source of ['es','en','fr']) {
    const controls = fields(source), calls = [];
    const result = await translateFields(source, controls, async (text, from, to) => { calls.push([text,from,to]); return `Traducido ${to}`; });
    assert.equal(calls.length,2); assert.deepEqual(result.skipped,[]);
    for (const language of ['es','en','fr']) assert.equal(controls[language].value, language === source ? 'Texto original' : `Traducido ${language}`);
  }
  let controls = fields('es'), calls = 0;
  controls.es.value = '  ';
  await assert.rejects(translateFields('es',controls,async () => { calls++; return 'No'; }), /emptySource/); assert.equal(calls,0);
  controls = fields('es'); controls.en.value = 'Manual';
  const skipped = await translateFields('es',controls,async () => 'Français');
  assert.deepEqual(skipped.skipped,['en']); assert.equal(controls.en.value,'Manual');
  controls = fields('es');
  await assert.rejects(translateFields('es',controls,async (_,__,target) => { if (target === 'fr') throw Error('offline'); return 'English'; }), /offline/);
  assert.equal(controls.en.value,''); assert.equal(controls.fr.value,'');
  controls = fields('es');
  await translateFields('es',controls,async () => { controls.en.value = 'Escrito mientras esperaba'; return 'Traducido'; });
  assert.equal(controls.en.value,'Escrito mientras esperaba');
  controls = fields('es');
  await assert.rejects(translateFields('es',controls,async () => { controls.es.value = 'Nuevo origen'; return 'Traducido'; }), /sourceChanged/); assert.equal(controls.fr.value,'');
  controls = fields('es'); controls.en.maxLength = 2;
  await assert.rejects(translateFields('es',controls,async () => 'Demasiado largo'), /tooLong/); assert.equal(controls.fr.value,'');
  for (const text of ['a '.repeat(900),'é😀'.repeat(300),'  Uno\n\nDos  ','x'.repeat(1000)]) {
    const chunks = service.translationChunks(text);
    assert.equal(chunks.join(''),text); assert.ok(chunks.every(chunk => new TextEncoder().encode(chunk).length <= 450));
  }
  let providerCalls = [];
  global.fetch = async url => { providerCalls.push(new URL(url)); return success(new URL(url).searchParams.get('q')); };
  assert.equal(await service.translateText('  Hola\n\n mundo  ','es','en'),'  Hola\n\n mundo  ');
  assert.equal(providerCalls[0].searchParams.get('langpair'),'es|en');
  await service.translateText('palabra '.repeat(200),'es','fr'); assert.ok(providerCalls.length > 2);
  global.fetch = async () => success('Tom &amp; Jerry'); assert.equal(await service.translateText('Hola','es','en'),'Tom & Jerry');
  global.fetch = async () => Response.json({quotaFinished:true}, {status:429});
  await assert.rejects(service.translateText('Hola','es','en'), error => error.code === 'TRANSLATION_QUOTA');
  global.fetch = async () => { throw Error('offline'); };
  await assert.rejects(service.translateText('Hola','es','en'), error => error.code === 'TRANSLATION_FAILED');
  const now = Date.UTC(2030,0,1);
  for (let i=0;i<4;i++) service.translationAllowance('rate-test','Hola',now);
  assert.throws(() => service.translationAllowance('rate-test','Hola',now), error => error.code === 'TRANSLATION_RATE_LIMIT');
  assert.throws(() => service.translationAllowance('quota-test','x'.repeat(5001),now), error => error.code === 'TRANSLATION_QUOTA');
  const route = load('apps/web/src/app/api/traducir/route.ts');
  providerCalls = []; global.fetch = async url => { providerCalls.push(url); return success('Hello'); };
  const body = {texto:'Hola',idiomaOrigen:'es',idiomaDestino:'en'};
  for (const [id,status] of [[null,401],['client',403],['viewer',403]]) {
    setSession(id ? {user:{id}} : null); assert.equal((await route.POST(request(body))).status,status);
  }
  assert.equal(providerCalls.length,0);
  for (const id of ['admin','a']) {
    setSession({user:{id}}); const response = await route.POST(request(body)); assert.equal(response.status,200); assert.deepEqual(await response.json(),{traduccion:'Hello'});
  }
  for (const invalid of [{...body,texto:''},{...body,texto:'x'.repeat(10001)},{...body,idiomaOrigen:'de'},{...body,idiomaDestino:'es'}]) assert.equal((await route.POST(request(invalid))).status,400);
  setSession({user:{id:'admin'}});
  global.fetch = async () => Response.json({quotaFinished:true},{status:429});
  const quota = await route.POST(request(body)); assert.equal(quota.status,429); assert.equal((await quota.json()).code,'TRANSLATION_QUOTA');
  global.fetch = async () => { throw Error('offline'); };
  assert.equal((await route.POST(request(body))).status,502);
  global.fetch = async () => success('Hello');
  assert.equal((await route.POST(request(body))).status,200);
  const limited = await route.POST(request(body)); assert.equal(limited.status,429); assert.equal((await limited.json()).code,'TRANSLATION_RATE_LIMIT');
  const React = req('react'); let index=0, states=[]; const ref={current:false};
  mockModule('react',{...React,useRef:()=>ref,useState:initial=>{const key=index++;if(!(key in states)) states[key]=initial;return [states[key],value=>states[key]=value];}});
  mockModule('next-intl',{useTranslations:()=>key=>key});
  const Button = load('apps/web/src/components/panel/TranslationDraftButton.tsx').default;
  function render() { index=0; return Button({source:'es',prefix:'desc'}); }
  controls = fields('es'); const form={elements:{namedItem:name=>controls[name.slice(-2).toLowerCase()]}};
  const event={currentTarget:{closest:()=>form}};
  let release; calls=0;
  global.fetch = async (_,options) => { calls++; const body=JSON.parse(options.body); await new Promise(resolve=>{ if (!release) release=[];release.push(resolve); }); return Response.json({traduccion:`Traducción ${body.idiomaDestino}`}); };
  const click=find(render(),node=>node.type==='button').props.onClick;
  const pending=click(event); await click(event); assert.equal(calls,2,'Doble clic no duplica solicitudes');
  assert.equal(find(render(),node=>node.type==='button').props.disabled,true);
  for(const resolve of release) resolve(); await pending;
  assert.equal(controls.en.value,'Traducción en'); assert.equal(controls.fr.value,'Traducción fr');
  assert.equal(find(render(),node=>node.props?.role==='status').props.children,'prepared');
  controls.en.value='Manual'; controls.fr.value=''; global.fetch=async()=>{throw Error('offline');}; await click(event);
  assert.equal(controls.en.value,'Manual'); assert.equal(controls.fr.value,''); assert.equal(find(render(),node=>node.props?.role==='status').props.children,'error');
  controls.es.value=''; calls=0; global.fetch=async()=>{calls++;return Response.json({});}; await click(event); assert.equal(calls,0);
  assert.equal(find(render(),node=>node.props?.role==='status').props.children,'emptySource');
  for(const locale of ['es','en','fr']) for(const key of ['button','translating','hint','prepared','emptySource','quota','rateLimit','sourceChanged','tooLong','busy','error']) assert.ok(require('../apps/web/messages/'+locale+'.json').panelTranslation[key]);
  console.log('OK traducción: tres orígenes, relleno atómico, ediciones protegidas, errores/cuota/rate, API autorizada, segmentos UTF-8 y botón sin doble clic.');
}
main().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>{global.fetch=originalFetch;memory.close();});
