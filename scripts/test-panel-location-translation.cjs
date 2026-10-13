const assert=require('node:assert/strict');
const {load,req,mockModule,memory}=require('./test-property-access.cjs');
const {parseMapsUrl}=load('apps/web/src/lib/panel-maps-url.ts');
for(const url of ['https://maps.google.com/?q=20.72,-105.30','https://www.google.com/maps/@20.72,-105.30,17z','https://www.google.com/maps/place/Casa/@20.72,-105.30,17z','https://www.google.com/maps/place/Casa/data=!3d20.72!4d-105.30','https://www.google.com/maps/place/Casa/data=!3d20.72!4d-105.30?entry=ttu','https://www.google.com/maps/search/?api=1&query=20.72%2C-105.30'])assert.deepEqual(parseMapsUrl(url).location,{lat:20.72,lng:-105.30});
assert.deepEqual(parseMapsUrl('https://www.google.com/maps/place/Casa/@10,11,17z/data=!3d20.72!4d-105.30').location,{lat:20.72,lng:-105.30},'Pin tiene prioridad sobre cámara');
assert.deepEqual(parseMapsUrl('https://maps.google.com/?q=0,0').location,{lat:0,lng:0});
assert.deepEqual(parseMapsUrl('https://maps.google.com/?q=-90,180').location,{lat:-90,lng:180});
for(const url of ['https://maps.app.goo.gl/abc','https://goo.gl/maps/abc'])assert.equal(parseMapsUrl(url).error,'mapsShort');
for(const url of ['','garbage','javascript:alert(1)','http://maps.google.com/?q=0,0','https://google.com.evil.example/maps/@0,0,17z','https://example.com/?q=0,0','https://user@maps.google.com/?q=0,0','https://www.google.com/mail?q=0,0','https://www.google.com/mapsfoo/@0,0,17z','https://maps.google.com/?q=some+address'])assert.equal(parseMapsUrl(url).error,'mapsInvalid');
for(const url of ['https://maps.google.com/?q=91,0','https://maps.google.com/?q=0,-181'])assert.equal(parseMapsUrl(url).error,'mapsRange');
for(const locale of ['es','en','fr']){const messages=require('../apps/web/messages/'+locale+'.json');for(const key of ['label','mapsInvalid','mapsShort','mapsRange','detected','view','advanced'])assert.ok(messages.panelLocation[key]);for(const key of ['button','hint','prepared','emptySource','quota','rateLimit','error'])assert.ok(messages.panelTranslation[key]);}
const React=req('react');let i=0,states=[],validity='';const inputRef={setCustomValidity:text=>validity=text};
mockModule('react',{...React,useState:initial=>{const n=i++;if(!(n in states))states[n]=initial;return[states[n],value=>states[n]=typeof value==='function'?value(states[n]):value];},useRef:()=>({current:inputRef})});
mockModule('next-intl',{useTranslations:()=>key=>key});
const Maps=load('apps/web/src/components/panel/MapsLocationInput.tsx').default;
function find(n,test){if(!n||typeof n!=='object')return null;if(Array.isArray(n)){for(const x of n){const found=find(x,test);if(found)return found;}return null;}if(test(n))return n;return find(n.props?.children,test);}
function render(){i=0;return Maps({lat:1,lng:2});}
let tree=render(),urlInput=find(tree,n=>n.type==='input'&&n.props.type==='text');
urlInput.props.onChange({target:{value:'https://maps.google.com/?q=20.72,-105.30'}});tree=render();assert.equal(find(tree,n=>n.props?.name==='lat').props.value,'20.72');assert.equal(find(tree,n=>n.props?.name==='lng').props.value,'-105.3');assert.equal(validity,'');
find(tree,n=>n.type==='input'&&n.props.type==='text').props.onChange({target:{value:'https://maps.app.goo.gl/abc'}});assert.equal(validity,'mapsShort');tree=render();assert.equal(find(tree,n=>n.props?.name==='lat').props.value,'20.72','URL inválida no mete basura en lat');
find(tree,n=>n.props?.name==='lat').props.onChange({target:{value:'21'}});tree=render();assert.equal(validity,'');assert.equal(find(tree,n=>n.type==='input'&&n.props.type==='text').props.value,'https://www.google.com/maps?q=21,-105.3');
memory.close();
console.log('OK panel: Maps formatos/rangos/rechazos, coordenadas/formulario/manual y mensajes localizados. Sin red/BD.');
