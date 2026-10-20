// Offline: handlers/SQL reales en SQLite y React simulado; no browser/Neon.
const assert = require('node:assert/strict'), fs = require('node:fs');
const { load, memory, req, setSession, setLocale, mockModule } = require('./test-property-access.cjs');
const React = req('react'), { renderToReadableStream } = req('react-dom/server'), { NextIntlClientProvider } = req('next-intl');
const { moduleNames, sectionOrder, validSectionOrder } = load('apps/web/src/lib/section-modules.ts');
const { managedProperty } = load('apps/web/src/lib/panel-server.ts');
const api = load('apps/web/src/app/api/properties/[id]/route.ts');
const create = load('apps/web/src/app/api/properties/route.ts');
const Page = load('apps/web/src/app/[locale]/casas/[slug]/page.tsx').default;
const order = ['amenidades','destino','lugar','mapa','habitaciones','advertencias','reserva'];
const manager = { id: 'a', role: 'COLLABORATOR' };
const request = body => new Request('http://localhost/test', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
const context = { params: Promise.resolve({ id: 'pa' }) };
const patch = body => api.PATCH(request(body), context);
const nodes = tree => !tree || typeof tree !== 'object' ? [] : [tree, ...React.Children.toArray(tree.props?.children).flatMap(nodes)];
async function main() {
  assert.deepEqual(sectionOrder(null), moduleNames); assert.ok(validSectionOrder(moduleNames)); assert.ok(validSectionOrder(order));
  setSession({ user: { id: 'a' } });
  assert.equal((await managedProperty('pa', manager)).sectionsOrder, null);
  const values = { titleEs:'Casa',titleEn:'House',titleFr:'Maison',descEs:'Descripción real',descEn:'Real description',descFr:'Description réelle',address:'Calle',maxGuests:4,bedrooms:1,bathrooms:1 };
  const added = await create.POST(request(values)); assert.equal(added.status,201);
  assert.equal((await managedProperty((await added.json()).id,manager)).sectionsOrder,null);
  const withOrder = await create.POST(request({...values,sectionsOrder:order})); assert.equal(withOrder.status,201);
  assert.deepEqual((await managedProperty((await withOrder.json()).id,manager)).sectionsOrder,order);
  for (const invalid of [null, [], 'destino', moduleNames.slice(0,-1), ['reserva',...moduleNames.slice(0,-1)], ['other',...moduleNames.slice(1)], ['destino',...moduleNames.slice(0,-1)]]) {
    const response = await patch({ sectionsOrder: invalid }); assert.equal(response.status,400);
    assert.equal((await response.json()).code,'INVALID_SECTIONS_ORDER');
  }
  for (const [actor,status] of [[null,401],['client',403],['b',404]]) {
    setSession(actor?{user:{id:actor}}:null); assert.equal((await patch({sectionsOrder:order})).status,status);
  }
  setSession({user:{id:'a'}});
  memory.prepare('UPDATE Property SET lat=20,lng=-105,address=?,descEs=?,descEn=?,descFr=? WHERE id=?').run('Calle','Descripción real','Real description','Description réelle','pa');
  for (const name of ['destino','amenidades','habitaciones','lugar','advertencias']) {
    memory.prepare('INSERT INTO PropertySection (propertyId,section,descriptionEs,descriptionEn,descriptionFr) VALUES (?,?,?,?,?)').run('pa',name,`${name} real`,`${name} real`,`${name} réel`);
  }
  for (const [index,category] of ['principal','amenidades','habitaciones','lugar'].entries()) memory.prepare('INSERT INTO Media (id,propertyId,url,type,category,"order") VALUES (?,?,?,?,?,?)').run(category,'pa',`/${category}.jpg`,'PHOTO',category,index);
  const readHtml = async locale => {
    setLocale(locale);
    const tree = await Page({params:Promise.resolve({locale,slug:'pa'})});
    const messages=JSON.parse(fs.readFileSync(`apps/web/messages/${locale}.json`,'utf8'));
    return new Response(await renderToReadableStream(React.createElement(NextIntlClientProvider,{locale,messages,timeZone:'UTC',onError(error){throw error;}},tree))).text();
  };
  const legacy=await readHtml('es');
  assert.ok(legacy.indexOf('data-editorial-slide="destino"')<legacy.indexOf('data-editorial-slide="amenidades"'));
  assert.ok(!legacy.includes('data-detail-section="warnings"'),'Sin personalizar se conserva fila compartida mapa/advertencias');
  assert.equal((await patch({sectionsOrder:order})).status,200);
  assert.deepEqual((await managedProperty('pa',manager)).sectionsOrder,order);
  for (const locale of ['es','en','fr']) {
    const html=await readHtml(locale);
    const markers=order.map(name=>name==='reserva'?'id="reservar"':name==='mapa'?'data-detail-section="location"':name==='advertencias'?'data-detail-section="warnings"':`data-editorial-slide="${name}"`);
    const positions=markers.map(marker=>html.indexOf(marker)); assert.ok(positions.every(position=>position>=0));
    assert.deepEqual([...positions].sort((a,b)=>a-b),positions,'DOM público sigue el orden persistido');
    for (const href of [...html.matchAll(/href="#([^"]+)"/g)].map(match=>match[1])) assert.ok(html.includes(`id="${href}"`));
  }
  assert.equal((await patch({sectionsEnabled:{amenidades:false}})).status,200);
  assert.ok(!(await readHtml('es')).includes('data-editorial-slide="amenidades"'));
  assert.deepEqual((await managedProperty('pa',manager)).sectionsOrder,order,'Activación no altera orden');
  console.log('OK orden: defaults/POST/PATCH/permisos/validación Reserva final, SSR es/en/fr y activación/anclas intactas.');

  let index=0, calls=0;const states=[];
  mockModule('react',{...React,useState(initial){const slot=index++;if(!(slot in states))states[slot]=initial;return[states[slot],value=>{states[slot]=typeof value==='function'?value(states[slot]):value;}];}});
  mockModule('next-intl',{useTranslations:()=>key=>key});
  mockModule('@/i18n/navigation',{useRouter:()=>({refresh(){}})});
  const Editor=load('apps/web/src/components/panel/PropertySectionsEditor-order-test.tsx',fs.readFileSync('apps/web/src/components/panel/PropertySectionsEditor.tsx','utf8')).default;
  const render=()=>{index=0;return Editor({propertyId:'pa',sections:[],media:[],modules:Object.fromEntries(moduleNames.map(name=>[name,true]))});};
  const items=()=>nodes(render()).filter(node=>node.props['data-module']);
  const item=name=>items().find(node=>node.props['data-module']===name);
  const nativeFetch=global.fetch,nativeFrame=global.requestAnimationFrame,nativeDocument=global.document;
  try {
    let finish,payload,focused;
    global.requestAnimationFrame=callback=>callback();global.document={getElementById:id=>({focus(){focused=id;}})};
    global.fetch=(url,options)=>{calls++;payload=JSON.parse(options.body);return new Promise(resolve=>{finish=resolve;});};
    nodes(item('amenidades')).find(node=>node.type==='button'&&node.props.children==='↑').props.onClick();
    assert.equal(items()[0].props['data-module'],'amenidades');
    assert.equal(nodes(render()).find(node=>node.props.name).props.name,'amenidades','Tarjetas se reordenan en vivo');
    assert.equal(focused,'rail-property-module-pa-amenidades');assert.deepEqual(payload.sectionsOrder.slice(0,2),['amenidades','destino']);
    finish(Response.json({success:true}));await new Promise(resolve=>setImmediate(resolve));
    nodes(item('amenidades')).find(node=>node.type==='button'&&node.props.children==='↓').props.onClick();
    assert.equal(items()[0].props['data-module'],'destino');
    finish(Response.json({error:'error'},{status:500}));await new Promise(resolve=>setImmediate(resolve));
    assert.equal(items()[0].props['data-module'],'amenidades','Fallo revierte orden');
    const transfer=new Map(),dataTransfer={setData:(key,value)=>transfer.set(key,value),getData:key=>transfer.get(key)||''};
    item('habitaciones').props.onDragStart({dataTransfer,preventDefault(){throw Error('Arrastre permitido');}});
    item('amenidades').props.onDrop({dataTransfer,preventDefault(){}});
    assert.equal(items()[0].props['data-module'],'habitaciones');finish(Response.json({success:true}));await new Promise(resolve=>setImmediate(resolve));
    const reservation=item('reserva');assert.equal(reservation.props.draggable,false);assert.equal(nodes(reservation).filter(node=>node.type==='button').length,1);
    let prevented=false;reservation.props.onDragStart({preventDefault(){prevented=true;}});assert.ok(prevented);
    const count=calls;reservation.props.onDrop({dataTransfer,preventDefault(){}});assert.equal(calls,count);
    assert.equal(items().at(-1).props['data-module'],'reserva');
  } finally {global.fetch=nativeFetch;global.requestAnimationFrame=nativeFrame;global.document=nativeDocument;}
  console.log('OK riel: subir/bajar, foco, drag/drop, actualización en vivo, rollback y Reserva inmóvil; sin navegador.');
}
main().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>memory.close());
