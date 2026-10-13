const assert=require('node:assert/strict');
const {load,req,mockModule,memory}=require('./test-property-access.cjs');
const React=req('react');let index=0;const states=[];
mockModule('react',{...React,useMemo:fn=>fn(),useState:initial=>{const key=index++;if(!(key in states))states[key]=initial;return[states[key],value=>{states[key]=typeof value==='function'?value(states[key]):value;}];}});
mockModule('next-intl',{useTranslations:()=>key=>key});
mockModule('./ReservationDatesProvider',{useReservationDates:()=>({dates:{startDate:'',endDate:''},setDates(){}})});
const Form=load('apps/web/src/components/MessageForm.tsx').default;
const props={propertyId:'pa',locale:'es',maxGuests:4,pricing:{base:{weekday:100,weekend:100},seasons:[],booked:[]},compact:true};
function render(){index=0;return Form(props);}
function find(node,predicate){if(!node||typeof node!=='object')return null;if(Array.isArray(node)){for(const child of node){const result=find(child,predicate);if(result)return result;}return null;}if(predicate(node))return node;return find(node.props?.children,predicate);}
(async()=>{try{
 let tree=render();assert.equal(find(tree,n=>n.props?.id==='name-error'),null);assert.equal(find(tree,n=>n.props?.id==='email-error'),null);
 assert.equal(find(tree,n=>n.props?.name==='name').props['aria-invalid'],false);
 assert.ok(find(tree,n=>n.props?.disabled===true),'Validación sigue bloqueando submit inválido');
 tree.props.onBlur({target:{getAttribute:()=> 'name'}});tree=render();assert.ok(find(tree,n=>n.props?.id==='name-error'));assert.equal(find(tree,n=>n.props?.id==='email-error'),null,'Solo campo tocado muestra error');
 find(tree,n=>n.props?.name==='name').props.onChange({target:{value:'Guest'}});tree=render();assert.equal(find(tree,n=>n.props?.id==='name-error'),null,'Corregir campo elimina error');
 await tree.props.action(new FormData());tree=render();assert.ok(find(tree,n=>n.props?.id==='email-error'));assert.ok(find(tree,n=>n.props?.id==='body-error'),'Intento de envío muestra errores pendientes');
 console.log('OK feedback: sin errores al cargar, blur por campo, corrección, intento submit y validación intacta.');
}finally{memory.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
