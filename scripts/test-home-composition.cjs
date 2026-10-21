// Composición SSR/API y reloj del carrusel aislados; sin navegador, Neon ni Blob.
const assert = require('node:assert/strict'), fs = require('node:fs');
const { load, memory, req, mockModule, setLocale, setSession } = require('./test-property-access.cjs');
const React = req('react'), {renderToStaticMarkup} = req('react-dom/server'), {NextIntlClientProvider} = req('next-intl');
const Home = load('apps/web/src/app/[locale]/page.tsx').default;
const Carousel = load('apps/web/src/components/HomeFeaturedCarousel.tsx').default;
const api = load('apps/web/src/app/api/panel/site-content/route.ts');
const content = { about_es:'Nuestro equipo',about_en:'Our team',about_fr:'Notre équipe',about_title_es:'Acerca de Alia',about_title_en:'About Alia',about_title_fr:'À propos d’Alia',about_image:'https://qa.public.blob.vercel-storage.com/about.jpg',social_instagram:'',social_facebook:'',featured_property_id:'pa',contact_whatsapp:'' };
const put = body => api.PUT(new Request('http://localhost/test',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}));
async function main(){
 setSession({user:{id:'admin'}});
 assert.equal((await put({...content,about_image:'http://bad.invalid/a.jpg'})).status,400);
 assert.equal((await put({...content,about_title_es:'x'.repeat(201)})).status,400);
 assert.equal((await put(content)).status,200);
 // Un editor antiguo no puede borrar títulos/imagen nuevos.
 const old={...content};for(const key of ['about_title_es','about_title_en','about_title_fr','about_image'])delete old[key];
 assert.equal((await put(old)).status,200); assert.equal((await (await api.GET()).json()).about_image,content.about_image);
 memory.prepare('UPDATE Property SET titleEs=?,titleEn=?,titleFr=? WHERE id=?').run('Casa','House','Maison','pa');
 memory.prepare('INSERT INTO Media (id,propertyId,url,type,"order",category) VALUES (?,?,?,?,?,?)').run('pic','pa','/a.jpg','PHOTO',0,'principal');
 for(const locale of ['es','en','fr']){
  setLocale(locale);const messages=require('../apps/web/messages/'+locale+'.json');
  const render=tree=>renderToStaticMarkup(React.createElement(NextIntlClientProvider,{locale,messages,timeZone:'America/Mexico_City'},tree));
  const html=render(await Home({params:Promise.resolve({locale})}));
  assert.ok(html.indexOf('home-featured-carousel')<html.indexOf('home-about-section'));
  assert.ok(html.includes(content['about_title_'+locale])); assert.ok(html.includes(content['about_'+locale]));
  assert.ok(html.includes('aspect-[2/3]')); assert.ok(html.includes('data-home-hero'));
  for(const count of [1,2,3,4]){
   const carousel=render(React.createElement(Carousel,null,Array.from({length:count},(_,i)=>React.createElement('a',{href:'/x',key:i},'Card'))));
   assert.equal((carousel.match(/<button/g)||[]).length,count===1?0:2);
   assert.equal(carousel.includes('home-featured-mobile-controls'),count===2||count===3);
  }
 }
 for(const value of [{about_image:''},{about_es:''}]){
  await put({...content,...value});setLocale('es');
  const html=renderToStaticMarkup(React.createElement(NextIntlClientProvider,{locale:'es',messages:require('../apps/web/messages/es.json'),timeZone:'America/Mexico_City'},await Home({params:Promise.resolve({locale:'es'})})));
  assert.ok(!html.includes('home-about-section'));assert.ok(html.includes('home-featured-carousel'));
 }
 // El nuevo CHECK permite las 13 claves; no permite claves arbitrarias.
 const sql=fs.readFileSync('scripts/sql/site-content-about.sql','utf8');
 memory.exec('CREATE TEMP TABLE test_about ("key" text CHECK ('+sql.match(/CHECK \(([\s\S]*?)\);/)[1]+'))');
 for(const key of Object.keys(content))memory.prepare('INSERT INTO test_about VALUES (?)').run(key);
 assert.throws(()=>memory.prepare('INSERT INTO test_about VALUES (?)').run('unknown'),/CHECK/);
 // Control de scroll del navbar: prueba de efecto aislado, sin navegador.
 const saved={window:global.window,document:global.document,raf:global.requestAnimationFrame,caf:global.cancelAnimationFrame};
 let navEffects=[],refIndex=0,queued,events={},attributes=new Set();
 const navElement={offsetHeight:80,contains:()=>false,toggleAttribute:(name,on)=>on?attributes.add(name):attributes.delete(name)};
 mockModule('react',{...React,useEffect:fn=>navEffects.push(fn),useRef:()=>({current:refIndex++===0?navElement:null}),useState:value=>[value,()=>{}],useId:()=>':test:'});
 mockModule('next-intl',{useLocale:()=> 'es',useTranslations:()=>key=>key});
 mockModule('next-auth/react',{useSession:()=>({data:null,status:'unauthenticated'}),signOut(){}});
 mockModule('@/i18n/navigation',{usePathname:()=> '/',Link:'a'});
 mockModule('next/font/google',{Marcellus:()=>({variable:'marcellus-logo-variable'})});
 const Nav=load('apps/web/src/components/Navbar-home-unit.tsx',fs.readFileSync('apps/web/src/components/Navbar.tsx','utf8')).default;
 try{
  global.window={scrollY:0,addEventListener:(name,fn)=>{events[name]=fn;},removeEventListener(){}};
  global.document={activeElement:null,querySelector:()=>({getBoundingClientRect:()=>({bottom:800-global.window.scrollY})})};
  global.requestAnimationFrame=fn=>{queued=fn;return 1;};global.cancelAnimationFrame=()=>{};
  Nav();const cleanup=navEffects[0]();assert.ok(attributes.has('data-home-top'));
  const scroll=y=>{global.window.scrollY=y;events.scroll();queued();};
  scroll(100);assert.ok(attributes.has('data-home-hidden'));assert.ok(!attributes.has('data-home-top'));
  scroll(50);assert.ok(!attributes.has('data-home-hidden'));assert.ok(!attributes.has('data-home-top'));
  scroll(900);assert.ok(!attributes.has('data-home-hidden'),'Fuera del hero reaparece mate');
  scroll(0);assert.ok(attributes.has('data-home-top'));cleanup();
 }finally{global.window=saved.window;global.document=saved.document;global.requestAnimationFrame=saved.raf;global.cancelAnimationFrame=saved.caf;}
 // Prueba unitaria del reloj: pausa por hover/foco/reduced-motion y sin timer <=3.
 let effects=[],refs=[],cursor=0,callback,interval=0,hover=false,focused=false,reduced=false,scrolled=[];
 const previousWindow=global.window,previousDocument=global.document;
 const rail={scrollLeft:0,clientWidth:300,children:[0,100,200,300].map(offsetLeft=>({offsetLeft})),scrollTo:options=>scrolled.push(options.left)};
 const container={matches:()=>hover,contains:()=>focused,getBoundingClientRect:()=>({top:0,bottom:300})};
 mockModule('react',{...React,useEffect:fn=>effects.push(fn),useRef:()=>({current:refs[cursor++]})});
 mockModule('next-intl',{useTranslations:()=>key=>key});
 const Unit=load('apps/web/src/components/HomeFeaturedCarousel-unit.tsx',fs.readFileSync('apps/web/src/components/HomeFeaturedCarousel.tsx','utf8')).default;
 try{
  global.document={hidden:false,activeElement:null};
  global.window={innerHeight:800,matchMedia:query=>({matches:query.includes('reduced-motion')?reduced:true}),setInterval:(fn,ms)=>{callback=fn;interval=ms;return 1;},clearInterval:()=>{}};
  refs=[container,rail];cursor=0;Unit({children:[1,2,3,4]});const cleanup=effects.pop()();
  assert.equal(interval,3000);callback();assert.deepEqual(scrolled,[100]);
  hover=true;callback();hover=false;focused=true;callback();focused=false;reduced=true;callback();assert.equal(scrolled.length,1);cleanup();
  callback=undefined;effects=[];cursor=0;Unit({children:[1,2,3]});effects.pop()();assert.equal(callback,undefined);
 }finally{global.window=previousWindow;global.document=previousDocument;}
 console.log('OK home: orden, título/imagen/texto, fallbacks, autoplay 3s/pausas, controles 1/3 vistas, CHECK y compatibilidad de editor.');
}
main().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>memory.close());
