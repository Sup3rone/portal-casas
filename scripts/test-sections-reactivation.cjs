// Regresión offline: componentes reales, hooks por instancia y transporte simulado.
// No reproduce CSS del navegador ni sustituye la QA del despliegue de Emma.
const assert=require('node:assert/strict'),fs=require('node:fs');
const {load,req,mockModule,memory}=require('./test-property-access.cjs');
const React=req('react');
let instance,cursor,locale='es',calls=[],server;
function mounted(){return {hooks:[]};}
function renderInstance(target,render){instance=target;cursor=0;return render();}
mockModule('react',{...React,useState(initial){const owner=instance,index=cursor++;if(!(index in owner.hooks))owner.hooks[index]=typeof initial==='function'?initial():initial;return[owner.hooks[index],next=>{owner.hooks[index]=typeof next==='function'?next(owner.hooks[index]):next;}];}});
mockModule('next-intl',{useTranslations:namespace=>req('next-intl').createTranslator({locale,messages:require('../apps/web/messages/'+locale+'.json'),namespace,onError(error){throw error;}})});
mockModule('@/i18n/navigation',{useRouter:()=>({refresh(){}})});
mockModule('./request',{buttonClass:'button',inputClass:'input',panelRequest:async(url,method,body)=>{
  calls.push({url,method,body:structuredClone(body)});
  if(method==='PATCH')server.modules=structuredClone(body.sectionsEnabled);
  if(method==='PUT')Object.assign(server.sections.find(row=>row.section===url.split('/').at(-1)),body);
}});
const Editor=load('apps/web/src/components/panel/PropertySectionsEditor-reactivation-test.tsx',fs.readFileSync('apps/web/src/components/panel/PropertySectionsEditor.tsx','utf8')).default;
const {moduleNames}=load('apps/web/src/lib/section-modules.ts');
const nodes=node=>!node||typeof node!=='object'?[]:[node,...React.Children.toArray(node.props?.children).flatMap(nodes)];
const settle=()=>new Promise(resolve=>setImmediate(resolve));
async function scenario(name){
  calls=[];
  const order=['lugar','amenidades','destino','habitaciones','mapa','advertencias','reserva'];
  server={modules:Object.fromEntries(moduleNames.map(key=>[key,true])),sections:['destino','amenidades','habitaciones','lugar'].map(section=>({propertyId:'p',section,descriptionEs:section+' guardado',descriptionEn:section+' saved',descriptionFr:section+' enregistré',heroMediaId:null,photoMediaIds:[]}))};
  let parent=mounted(),children=new Map();
  const media=[{id:'photo',url:'/test.jpg',type:'PHOTO',order:1}];
  function tree(){const result=renderInstance(parent,()=>Editor({propertyId:'p',sections:server.sections,media,modules:server.modules,order}));const active=nodes(result).filter(node=>node.props.name).map(node=>node.props.name);for(const key of children.keys())if(!active.includes(key))children.delete(key);return result;}
  function card(){const element=nodes(tree()).find(node=>node.props.name===name);if(!element)return null;if(!children.has(name))children.set(name,mounted());return renderInstance(children.get(name),()=>element.type(element.props));}
  const toggle=()=>nodes(nodes(tree()).find(node=>node.props['data-module']===name)).find(node=>node.type==='button').props.onClick();
  function expanded(expected){
    const form=card();assert.ok(form,name+' tarjeta presente');assert.equal(form.type,'form');
    assert.ok(!nodes(form).some(node=>node.type==='details'||node.props.hidden===true||node.props['aria-hidden']===true||String(node.props.className||'').split(' ').includes('hidden')),'Sin compuerta de expansión/ocultamiento');
    const fields=nodes(form).filter(node=>node.type==='textarea');assert.equal(fields.length,3);assert.ok(fields.every(node=>!node.props.disabled));assert.equal(fields[0].props.defaultValue,expected);
    assert.ok(nodes(form).some(node=>node.type==='fieldset'&&!node.props.disabled));return form;
  }
  const saved=name+' guardado',draft=name+' borrador';
  let form=expanded(saved);assert.equal(calls.length,0,'Montaje no guarda');
  nodes(form).find(node=>node.props.name==='descriptionEs').props.onChange({target:{value:draft}});
  nodes(form).find(node=>node.type==='input'&&node.props.type==='checkbox').props.onChange({target:{checked:true}});
  assert.equal(calls.length,0,'Editar borrador no guarda implícitamente');
  toggle();await settle();assert.equal(card(),null,'Apagada fuera de la lista');
  toggle();await settle();form=expanded(draft);
  assert.ok(nodes(form).find(node=>node.type==='input'&&node.props.type==='checkbox').props.checked,'Foto del borrador conservada');
  assert.ok(nodes(tree()).find(node=>node.props.name===name).props.revealed,'Realce conservado');
  assert.equal(calls.filter(call=>call.method==='PUT').length,0,'Reactivar no guarda contenido');
  // Guardado explícito antes de la recarga: solo así sobrevive un borrador al reload.
  const nativeFormData=global.FormData;
  global.FormData=class{constructor(form){this.values=form.values;}get(key){return this.values[key];}};
  try{await form.props.onSubmit({preventDefault(){},currentTarget:{values:Object.fromEntries(nodes(form).filter(node=>node.type==='textarea').map(node=>[node.props.name,node.props.defaultValue]))}});}finally{global.FormData=nativeFormData;}
  assert.equal(calls.filter(call=>call.method==='PUT').length,1);
  toggle();await settle();assert.equal(card(),null);
  parent=mounted();children=new Map(); // Recarga: hooks nuevos, props persistidos del servidor.
  assert.equal(card(),null,'Tras recargar sigue desactivada');
  toggle();await settle();form=expanded(draft);
  assert.ok(nodes(form).find(node=>node.type==='input'&&node.props.type==='checkbox').props.checked);
  const updates=calls.filter(call=>call.method==='PATCH');assert.equal(updates.length,4);
  for(const call of updates)assert.deepEqual(Object.keys(call.body),['sectionsEnabled'],'No cambios de orden/contenido espurios');
  assert.deepEqual(parent.hooks[4],order,'Orden preservado');
  const treeNodes=nodes(tree());
  for(const module of ['mapa','reserva']){
    const info=treeNodes.find(node=>node.type==='section'&&node.props.id==='property-module-p-'+module);
    assert.ok(info);assert.ok(nodes(info).some(node=>node.type==='p'));assert.ok(!nodes(info).some(node=>node.type==='textarea'||node.type==='input'));
  }
  const reservation=nodes(treeNodes.find(node=>node.props['data-module']==='reserva')).find(node=>node.type==='button');assert.equal(reservation.props.disabled,true);assert.equal(reservation.props['aria-pressed'],true);
}
(async()=>{for(locale of ['es','en','fr'])for(const name of ['amenidades','destino','habitaciones','lugar'])await scenario(name);console.log('OK 12 escenarios: campos visibles en carga/caliente/frío, borradores/fotos y contenido guardado conservados; sin guardados espurios, orden y Reserva intactos. Sin navegador.');})().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>memory.close());
