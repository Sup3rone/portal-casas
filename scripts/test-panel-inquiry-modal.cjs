const assert=require('node:assert/strict'),fs=require('node:fs');
const {load,req,memory,mockModule}=require('./test-property-access.cjs');
const React=req('react'),{renderToStaticMarkup}=req('react-dom/server');
const {createTranslator}=req('next-intl');
const Modal=load('apps/web/src/components/MessageModal.tsx').default;
const messages=JSON.parse(fs.readFileSync('apps/web/messages/es.json'));
let states=[],index=0,effects=[],refreshes=0,calls=[];
mockModule('react',{...React,useState(initial){const slot=index++;if(!(slot in states))states[slot]=initial;return [states[slot],value=>{states[slot]=value;}];},useEffect(effect){effects.push(effect);}});
mockModule('next-intl',{useLocale:()=> 'es',useTranslations:ns=>createTranslator({locale:'es',messages,namespace:ns})});
mockModule('@/i18n/navigation',{Link:({href,children,...props})=>React.createElement('a',{...props,href:'/es'+href},children),useRouter:()=>({refresh(){refreshes++;}})});
const {default:Inquiries}=load('apps/web/src/components/panel/Inquiries.tsx');
const row={id:'qa',propertyId:'pa',userId:'guest-qa',slug:'qa-house',title:'Casa de prueba',name:'Cliente QA',email:'qa@example.invalid',phone:null,body:'Consulta de prueba',read:false,createdAt:'2026-10-13T12:00:00Z',startDate:'2026-11-01',endDate:'2026-11-04',rentalType:'nocturna',weekdayPrice:1500,weekendPrice:1500,photoUrl:null};
function render(){index=0;effects=[];return Inquiries({rows:[row]});}
function nodes(tree){if(!tree||typeof tree!=='object')return [];return [tree,...React.Children.toArray(tree.props?.children).flatMap(nodes)];}
let tree=render(),article=nodes(tree).find(e=>e.type==='article');
assert.equal(article.props.role,'button');assert.equal(article.props.tabIndex,0);
if(process.env.MODAL_QA_DIR) save(tree,'before');
article.props.onClick(); tree=render();let modal=nodes(tree).find(e=>e.type===Modal);
assert.equal(modal.props.message.userId,'guest-qa');assert.equal(modal.props.message.propertyName,row.title);assert.equal(modal.props.message.propertySlug,row.slug);
if(process.env.MODAL_QA_DIR)save(tree,'after');
modal.props.onClose();assert.ok(!nodes(render()).some(e=>e.type===Modal),'Clic fuera usa onClose');
for(const key of ['Enter',' ']){let prevented=false;article.props.onKeyDown({target:article,currentTarget:article,key,preventDefault(){prevented=true;}});assert.ok(prevented);assert.ok(nodes(render()).some(e=>e.type===Modal));states[4]=null;}
article.props.onKeyDown({target:{},currentTarget:article,key:'Enter',preventDefault(){throw Error('Evento de hijo no interceptado');}});assert.equal(states[4],null);
article.props.onClick();render();let escape;
global.window={addEventListener(name,fn){assert.equal(name,'keydown');escape=fn;},removeEventListener(){}};
const cleanup=effects[0]();escape({key:'Escape'});cleanup();assert.equal(states[4],null);
global.fetch=async(url,options)=>{calls.push({url,body:JSON.parse(options.body)});return {ok:true,status:200,json:async()=>({success:true})};};
(async()=>{try{
for(const node of nodes(render()).filter(e=>e.type==='a'||(typeof e.type==='function'&&e.props.href)||e.type==='button')){
let stopped=false;await node.props.onClick({stopPropagation(){stopped=true;}});assert.ok(stopped);assert.equal(states[4],null,'Enlace/email/leída no abre modal');
}
await new Promise(resolve=>setImmediate(resolve));
article.props.onClick();modal=nodes(render()).find(e=>e.type===Modal);modal.props.onSuccess();assert.equal(states[4],null);assert.equal(refreshes,2,'Leída y confirmación refrescan');
article.props.onClick();modal=nodes(render()).find(e=>e.type===Modal);await modal.props.onDelete(row.id);assert.deepEqual(calls.at(-1),{url:'/api/messages/delete',body:{id:'qa'}});assert.equal(states[4],null);assert.equal(refreshes,3);
global.fetch=async()=>({ok:false,status:500,json:async()=>({code:'INTERNAL_ERROR'})});article.props.onClick();modal=nodes(render()).find(e=>e.type===Modal);await assert.rejects(()=>modal.props.onDelete(row.id));assert.ok(states[4],'Fallo no cierra ni aparenta éxito');assert.equal(refreshes,3);
console.log('OK modal consultas: clic/Enter/Espacio, props, Escape/cierre, propagación, refresh éxito y conservación en fallo.');
}finally{memory.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
function save(tree,phase){fs.writeFileSync(process.env.MODAL_QA_DIR+'/inquiry-modal-'+phase+'.html',`<!doctype html><html lang="es"><head><meta charset="utf-8"><link rel="stylesheet" href="http://localhost:3000/_next/static/chunks/apps_web_src_app_globals_1wvyn-h.css"></head><body><main class="mx-auto max-w-4xl px-4 py-10"><p>QA OFFLINE — datos ficticios</p>${renderToStaticMarkup(tree)}</main></body></html>`);}
