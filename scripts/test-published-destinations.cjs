// Consulta SQL y handlers reales en SQLite; sin navegador ni Neon.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { load, memory, queryLog, mockModule, setSession, setLocale, req } = require('./test-property-access.cjs');
const { readPublishedDestinations } = load('apps/web/src/lib/published-destinations.ts');
const { renderNavbar } = require('./test-navbar.cjs');
const React=req('react'), {renderToStaticMarkup}=req('react-dom/server'), {NextIntlClientProvider}=req('next-intl');
const Form=load('apps/web/src/components/PropertySearchForm.tsx').default;
const invalidations = [];
mockModule('next/cache', { revalidatePath: (...args) => invalidations.push(args) });
const api = load('apps/web/src/app/api/properties/[id]/route-destinations-test.ts',fs.readFileSync('apps/web/src/app/api/properties/[id]/route.ts','utf8'));
async function main() {
  memory.prepare('UPDATE Property SET published=0').run();
  assert.deepEqual(await readPublishedDestinations(), []);
  memory.prepare('UPDATE Property SET published=1,state=?,destinationCity=? WHERE id=?').run('Jalisco','Guadalajara','pa');
  memory.prepare('UPDATE Property SET published=1,state=?,destinationCity=? WHERE id=?').run('Nayarit','Nuevo Vallarta','pb');
  const insert = memory.prepare('INSERT INTO Property (id,published,state,destinationCity,city) VALUES (?,?,?,?,?)');
  for (const row of [
    ['duplicate',1,'Jalisco','Guadalajara',null],
    ['second',1,'Jalisco','Puerto Vallarta',null],
    ['draft',0,'Yucatán','Mérida',null],
    ['legacy',1,null,null,'Cancún'],
    ['incomplete',1,'Yucatán',null,null],
    ['invalid',1,'Jalisco','Nuevo Vallarta',null],
    ['unknown',1,'Unknown','Somewhere',null],
  ]) insert.run(...row);
  const before = queryLog.length;
  const groups = await readPublishedDestinations();
  assert.equal(queryLog.length-before,1,'Una consulta, sin N+1');
  assert.deepEqual(groups,[{state:'Jalisco',cities:['Guadalajara','Puerto Vallarta']},{state:'Nayarit',cities:['Nuevo Vallarta']}]);
  for (const locale of ['es','en','fr']) {
    const html=renderNavbar(null,locale,true,'/',groups);
    assert.ok(html.includes(`/${locale}/casas?state=Nayarit&amp;destinationCity=Nuevo+Vallarta`));
    assert.ok(!html.includes('destinationCity=Canc') && !html.includes('destinationCity=M%C3%A9rida'));
    assert.ok(!renderNavbar(null,locale,true,'/',[]).includes('<summary'));
    setLocale(locale);
    const messages=require('../apps/web/messages/'+locale+'.json');
    const renderForm=(destinations,initial={})=>renderToStaticMarkup(React.createElement(NextIntlClientProvider,{locale,messages,timeZone:'UTC'},React.createElement(Form,{destinations,initial})));
    const select=(html,name)=>html.match(new RegExp(`<select[^>]*name="${name}"[\\s\\S]*?</select>`))[0];
    const plain=renderForm(groups);
    assert.ok(select(plain,'state').includes('Jalisco')&&select(plain,'state').includes('Nayarit'));
    assert.ok(!select(plain,'state').includes('Yucatán')&&!select(plain,'state').includes('Quintana Roo'));
    const selected=renderForm(groups,{state:'Jalisco',destinationCity:'Guadalajara'});
    assert.ok(select(selected,'destinationCity').includes('Puerto Vallarta'));
    assert.ok(!select(selected,'destinationCity').includes('Nuevo Vallarta'));
    const old=renderForm(groups,{state:'Yucatán',destinationCity:'Mérida'});
    assert.match(select(old,'state'),/<option value="Yucatán" selected="">/);
    assert.match(select(old,'destinationCity'),/<option value="Mérida" selected="">/);
    const oldCity=renderForm(groups,{state:'Jalisco',destinationCity:'San Juan de los Lagos'});
    assert.match(select(oldCity,'destinationCity'),/<option value="San Juan de los Lagos" selected="">/);
    const empty=renderForm([]);
    for(const name of ['state','destinationCity'])assert.equal((select(empty,name).match(/<option/g)||[]).length,1);
    assert.ok(empty.includes('name="start"')&&empty.includes('name="end"')&&empty.includes('name="guests"'));
    // La lupa recibe la misma lista, no el catálogo entero.
    assert.ok(!select(html,'state').includes('Yucatán'));

  }
  const patch=body=>api.PATCH(new Request('http://localhost/test',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}),{params:Promise.resolve({id:'pa'})});
  setSession({user:{id:'admin'}});
  assert.equal((await patch({published:false})).status,200);
  assert.ok(invalidations.some(args=>args[0]==='/[locale]'&&args[1]==='layout'));
  // Otra publicada en el mismo destino mantiene la entrada.
  assert.equal((await readPublishedDestinations())[0].cities[0],'Guadalajara');
  memory.prepare('UPDATE Property SET published=0 WHERE id=?').run('duplicate');
  assert.deepEqual((await readPublishedDestinations())[0].cities,['Puerto Vallarta']);
  invalidations.length=0;
  assert.equal((await patch({state:'Nayarit',destinationCity:'Nuevo Vallarta'})).status,200);
  assert.ok(invalidations.some(args=>args[0]==='/[locale]'&&args[1]==='layout'));
  invalidations.length=0;
  assert.equal((await patch({sectionsEnabled:{mapa:false}})).status,200);
  assert.ok(!invalidations.some(args=>args[0]==='/[locale]'),'Otros guardados no invalidan layout global');
  assert.equal((await patch({published:true})).status,200);
  assert.ok((await readPublishedDestinations()).some(group=>group.state==='Nayarit'));
  // Dependencia real de los selects: cambiar estado limpia ciudad.
  let slot=0;const states=[];
  mockModule('react',{...React,useId:()=> 'search',useState(initial){const index=slot++;if(!(index in states))states[index]=initial;return[states[index],value=>{states[index]=value;}];}});
  mockModule('next-intl',{useLocale:()=> 'es',useTranslations:()=>key=>key});
  const Interactive=load('apps/web/src/components/PropertySearchForm-destinations-test.tsx',fs.readFileSync('apps/web/src/components/PropertySearchForm.tsx','utf8')).default;
  const nodes=node=>!node||typeof node!=='object'?[]:[node,...React.Children.toArray(node.props?.children).flatMap(nodes)];
  const render=()=>{slot=0;return nodes(Interactive({destinations:groups,initial:{state:'Nayarit',destinationCity:'Nuevo Vallarta'}}));};
  render().find(node=>node.props.name==='state').props.onChange({target:{value:'Jalisco'}});
  assert.equal(render().find(node=>node.props.name==='destinationCity').props.value,'');
  assert.equal(render().find(node=>node.props.name==='state').props.value,'Jalisco');
  assert.ok(!nodes(render().find(node=>node.props.name==='destinationCity')).some(node=>node.props.value==='Nuevo Vallarta'));
  render().find(node=>node.props.name==='state').props.onChange({target:{value:''}});
  assert.equal(render().find(node=>node.props.name==='destinationCity').props.disabled,true);
  console.log('OK destinos publicados: SQL único, pares válidos, sin legacy/incompletos/borradores, deduplicación/orden, SSR es/en/fr, vacío y revalidación publicación/ubicación.');
}
main().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>memory.close());
