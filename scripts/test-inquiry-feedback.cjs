const assert=require('node:assert/strict');
const {load,req,mockModule,memory}=require('./test-property-access.cjs');
const React=req('react');let index=0;const states=[];
const events=[]; const nativeFetch=global.fetch;
mockModule('@vercel/analytics',{track:(name,data)=>events.push({name,data})});
mockModule('@vercel/analytics/next',{Analytics:()=>null});
mockModule('react',{...React,useContext:ctx=>ctx===SessionContext&&session?{data:session,status:'authenticated'}:undefined,useMemo:fn=>fn(),useState:initial=>{const key=index++;if(!(key in states))states[key]=initial;return[states[key],value=>{states[key]=typeof value==='function'?value(states[key]):value;}];}});
mockModule('next-intl',{useTranslations:()=>key=>key});
let dates={startDate:'',endDate:''};let session=null;
const SessionContext={};mockModule('next-auth/react',{SessionContext});
mockModule('./ReservationDatesProvider',{useReservationDates:()=>({dates,setDates(){}})});
const Form=load('apps/web/src/components/MessageForm.tsx').default;
const props={propertyId:'pa',propertySlug:'test-house',locale:'es',maxGuests:4,pricing:{base:{weekday:100,weekend:100},seasons:[],booked:[]},compact:true};
function render(){index=0;return Form(props);}
function find(node,predicate){if(!node||typeof node!=='object')return null;if(Array.isArray(node)){for(const child of node){const result=find(child,predicate);if(result)return result;}return null;}if(predicate(node))return node;return find(node.props?.children,predicate);}
(async()=>{try{
 // T-4770: con sesión, nombre y correo salen de la cuenta; editarlos manda; sin sesión quedan vacíos.
 {const value=(t,f)=>find(t,n=>n.props?.name===f).props.value;
  let t=render();assert.deepEqual([value(t,'name'),value(t,'email')],['',''],'Sin sesión: vacíos');
  session={user:{name:'Propietario Del Canto',email:'dueno@example.com'}};t=render();
  assert.deepEqual([value(t,'name'),value(t,'email')],['Propietario Del Canto','dueno@example.com'],'Con sesión: se llenan');
  assert.equal(value(t,'phone'),'','El teléfono no viene de la sesión');
  find(t,n=>n.props?.name==='name').props.onChange({target:{value:'Otro Nombre'}});t=render();assert.equal(value(t,'name'),'Otro Nombre','Lo editado gana');
  find(t,n=>n.props?.name==='email').props.onChange({target:{value:''}});t=render();assert.equal(value(t,'email'),'','Borrarlo a propósito lo deja vacío');
  states.length=0;session=null;}
 let tree=render();assert.equal(find(tree,n=>n.props?.id==='name-error'),null);assert.equal(find(tree,n=>n.props?.id==='email-error'),null);
 assert.equal(find(tree,n=>n.props?.name==='name').props['aria-invalid'],false);
 assert.deepEqual(find(tree,n=>n.type?.name==='SubmitButton').props,{},'T-4770: el botón no se bloquea con errores ocultos');assert.equal(find(tree,n=>n.props?.id==='inquiry-incomplete'),null,'Sin aviso antes de intentar enviar');
 tree.props.onBlur({target:{getAttribute:()=> 'name'}});tree=render();assert.ok(find(tree,n=>n.props?.id==='name-error'));assert.equal(find(tree,n=>n.props?.id==='email-error'),null,'Solo campo tocado muestra error');
 find(tree,n=>n.props?.name==='name').props.onChange({target:{value:'Guest'}});tree=render();assert.equal(find(tree,n=>n.props?.id==='name-error'),null,'Corregir campo elimina error');
 await tree.props.action(new FormData());tree=render();assert.ok(find(tree,n=>n.props?.id==='email-error'));assert.ok(find(tree,n=>n.props?.id==='body-error'),'Intento de envío muestra errores pendientes');assert.equal(find(tree,n=>n.props?.id==='inquiry-incomplete')?.props.role,'alert','T-4770: aviso general de datos faltantes');assert.equal(find(tree,n=>n.props?.id==='inquiry-incomplete').props.children,'incompleto');
 assert.equal(events.length,0,'Validación fallida no cuenta conversión');
 const day=new Date(); day.setDate(day.getDate()+2); const start=day.toISOString().slice(0,10);day.setDate(day.getDate()+2);dates={startDate:start,endDate:day.toISOString().slice(0,10)};
 const data=new FormData();for(const [key,value] of Object.entries({name:'Guest',email:'guest@example.com',body:'Inquiry',guests:'2',startDate:dates.startDate,endDate:dates.endDate}))data.set(key,value);
 for(const status of [400,429,500]) {
   global.fetch=async()=>Response.json({fields:{},message:'Limit'},{status});
   await render().props.action(data);assert.equal(events.length,0,'Un rechazo del servidor no cuenta conversión');
 }
 let confirm;global.fetch=()=>new Promise(resolve=>{confirm=resolve;});
 const pending=render().props.action(data);assert.equal(events.length,0,'No contar antes de la confirmación');
 confirm(Response.json({success:true},{status:201}));await pending;
 {let done=render();assert.equal(find(done,n=>n.props?.role==='status')&&find(done,n=>n.props?.children==='exitoReserva')?.props.children,'exitoReserva','T-4770: mensaje de petición recibida');
  const again=find(done,n=>n.props?.children==='otraConsulta');assert.ok(again,'T-4770: botón Enviar otra consulta');
  assert.equal(render().type,'div','El aviso se queda (sin temporizador)');again.props.onClick();assert.equal(render().type,'form','Vuelve al formulario');}
 assert.deepEqual(events,[{name:'query_submitted',data:{property:'test-house'}}],'Solo slug tras envío confirmado');
 const analytics=load('apps/web/src/components/SiteAnalytics.tsx');
 analytics.PropertyWhatsAppLink({propertySlug:'test-house',href:'https://wa.me/521234567890'}).props.onClick();
 assert.deepEqual(events[1],{name:'whatsapp_clicked',data:{property:'test-house'}});
 assert.equal(analytics.default().props.beforeSend({url:'https://example.com/fr/reset-password?token=secret#x',type:'pageview'}).url,'https://example.com/fr/reset-password','No enviar tokens/query en pageviews');
 console.log('OK feedback: sin errores al cargar, blur por campo, corrección, intento submit y validación intacta.');
}finally{global.fetch=nativeFetch;memory.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
