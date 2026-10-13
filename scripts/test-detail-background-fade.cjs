const assert=require('node:assert/strict');
const {load,memory}=require('./test-property-access.cjs');
const {attachLocalBackgroundFade}=load('apps/web/src/components/EditorialPresentation.tsx');
const native={window:global.window,setTimeout:global.setTimeout,clearTimeout:global.clearTimeout};
let id=0;const timers=new Map(),decodes=[];
function image(){const img={style:{},offsetWidth:1,src:'',decode(){return new Promise((resolve,reject)=>decodes.push({resolve,reject}));},setAttribute(){},remove(){this.removed=true;this.parentElement?.children.splice(this.parentElement.children.indexOf(this),1);}};return img;}
function section(url){const original=image();original.src=url;original.currentSrc=url;original.style.opacity='1';original.parentElement={children:[],append(img){this.children.push(img);img.parentElement=this;img.removed=false;}};return {original,querySelector:()=>original};}
async function flush(delay){for(const [key,value] of [...timers])if(value.delay===delay){timers.delete(key);value.fn();}for(let n=0;n<8;n++)await Promise.resolve();}
(async()=>{try{
 global.window={Image:class{constructor(){return image();}}};
 global.setTimeout=(fn,delay)=>{const key=++id;timers.set(key,{fn,delay});return key;};global.clearTimeout=key=>timers.delete(key);
 const scenes=[section('/a.jpg'),section('/b.jpg'),section('/c.jpg')];
 const fade=attachLocalBackgroundFade(scenes);assert.equal(decodes.length,4,'Solo las dos primeras secciones se preparan al inicio');
 fade.update(scenes[0]);await flush(80);
 assert.equal(decodes.length,6,'La sección activa anticipa las próximas dos');
 fade.update(scenes[1]);assert.equal(decodes.length,6,'Preparar la siguiente sección al activar la actual');await flush(80);assert.equal(scenes[1].original.parentElement.children.length,0,'No comenzar transición con imagen pendiente');
 decodes.forEach(d=>d.resolve());await flush(0);
 const overlay=scenes[1].original.parentElement.children[0];assert.ok(overlay);assert.equal(overlay.src,'/a.jpg');assert.equal(overlay.style.opacity,'0');
 scenes.forEach(s=>assert.deepEqual(s.original.style,{opacity:'1'},'La imagen original nunca se oculta'));
 fade.update(scenes[2]);fade.update(scenes[1]);await flush(80);await flush(300);assert.equal(scenes[2].original.parentElement.children.length,0,'Último trigger repetido evita segundo fundido');
 fade.update(scenes[2]);await flush(80);assert.equal(scenes[2].original.parentElement.children.length,1);await flush(300);assert.equal(scenes[2].original.parentElement.children.length,0);
 const preparedCount=decodes.length;
 fade.update(scenes[0]);await flush(80);assert.equal(scenes[0].original.parentElement.children.length,1,'Fundido también al subir');
 assert.equal(decodes.length,preparedCount,'Volver atrás reutiliza fondos preparados sin volver a decodificarlos');
 fade.dispose();assert.equal(timers.size,0);assert.equal(scenes[0].original.parentElement.children.length,0);
 const broken=[section('/good.jpg'),section('/bad.jpg')],start=decodes.length;
 const failedFade=attachLocalBackgroundFade(broken);failedFade.update(broken[0]);await flush(80);
 decodes[start].resolve();decodes[start+1].resolve();decodes[start+2].reject(new Error('decode'));decodes[start+3].reject(new Error('decode'));
 failedFade.update(broken[1]);await flush(80);assert.equal(broken[1].original.parentElement.children.length,0,'Error de decode no inicia fade');assert.equal(broken[1].original.style.opacity,'1');failedFade.dispose();
 const css=require('node:fs').readFileSync(require('node:path').join(__dirname,'../apps/web/src/app/globals.css'),'utf8');
 assert.ok(!css.includes('@keyframes detail-fullpage-enter'));assert.ok(!css.includes('.detail-background-crossfade'));
 assert.match(css,/data-detail-section="location"\] \{ min-height: 100vh !important; scroll-snap-align: start;/);
 console.log('OK fundido local: decode, capas coexistentes, originales nunca ocultos, agrupación, ida/vuelta, mapa independiente y cleanup.');
}finally{Object.assign(global,native);memory.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
