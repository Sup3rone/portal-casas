// Página/cliente reales; SSR + efectos con DOM/scroll simulados. Sin Neon.
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const { execFileSync } = require('node:child_process');
for (const file of ['apps/web/src/components/EditorialPresentation.module.css']) {
  const before = execFileSync('git',['show',`a7e53aa57a24919592d28e8cffb4957a83510e9e:${file}`],{encoding:'utf8'});
  const current=fs.readFileSync(path.join(__dirname,'..',file),'utf8');
  for(const selector of ['.backdrop::after','.frames','.photo']) {
    const line=text=>text.replace(/\r\n/g,'\n').split('\n').find(line=>line.startsWith(selector+' {'));
    assert.equal(line(current),line(before),'Imagen/fundido editorial conservados');
  }
  assert.match(current,/\.flow \.screen \{[^}]*height: auto;/);
  assert.match(current,/\.flow \.description \{ max-height: none; overflow: visible;/);
  assert.match(current,/\.flow \.floating \.images, \.flow \.floating \.narrative \{\s*background-color: color-mix[^;]*65%, transparent/);
}
const editorialSource = fs.readFileSync(path.join(__dirname,'../apps/web/src/components/EditorialPresentation.tsx'),'utf8');
assert.ok(!/setInterval|setTimeout/.test(editorialSource),'No debe haber avance editorial por tiempo');
const originalEditorial = execFileSync('git',['show','a7e53aa57a24919592d28e8cffb4957a83510e9e:apps/web/src/components/EditorialPresentation.tsx'],{encoding:'utf8'});
for (const [start,end] of [['    {slide.hero','    <div className={styles.floating}>'],['    <div className={`${styles.narrative}','  </section>;']]) {
  const fragment = text => { const normal=text.replace(/\r\n/g,'\n').replace('!flow && slide.hero','slide.hero');return normal.slice(normal.indexOf(start),normal.indexOf(end,normal.indexOf(start))); };
  assert.equal(fragment(editorialSource),fragment(originalEditorial),'Fondos y narrativa originales conservados');
}
const { load, memory, req, setLocale, mockModule } = require('./test-property-access.cjs');
const React = req('react'), { renderToStaticMarkup, renderToReadableStream } = req('react-dom/server');
const { NextIntlClientProvider } = req('next-intl');
let pathname = '/es/casas/pa';
mockModule('@/i18n/navigation', {
  usePathname: () => pathname, useRouter: () => ({ push() {}, refresh() {} }),
  Link: ({ children, href, ...props }) => React.createElement('a', { ...props, href }, children)
});
const Page = load('apps/web/src/app/[locale]/casas/[slug]/page.tsx').default;
const Footer = load('apps/web/src/components/Footer.tsx').default;
const FooterFlow = load('apps/web/src/components/DetailFooterFlow.tsx').default;
const Presentation = load('apps/web/src/components/EditorialPresentation.tsx').default;
const Gallery = load('apps/web/src/components/PropertyGallery.tsx').default;
memory.prepare('UPDATE "Property" SET titleEs=?,titleEn=?,titleFr=?,descEs=?,descEn=?,descFr=?,address=?,city=?,bedrooms=2,bathrooms=1,lat=20,lng=-105,whatsapp=? WHERE id=?')
  .run('Casa','House','Maison','Descripción ES','Description EN','Description FR','Address','City','5215512345678','pa');
for (let i = 0; i < 12; i++) memory.prepare('INSERT INTO "Media" (id,"propertyId",url,type,"order",category,"isCover","coverOrder") VALUES (?,?,?,?,?,?,?,?)')
  .run('photo'+i,'pa','/photo'+i+'.jpg','PHOTO',i,i % 2 ? 'habitaciones' : 'principal',i >= 10 ? 1 : 0,i === 11 ? 0 : i === 10 ? 1 : null);
memory.prepare('INSERT INTO "PropertySection" ("propertyId",section,"descriptionEs","descriptionEn","descriptionFr") VALUES (?,?,?,?,?)')
  .run('pa','advertencias','Advertencia ES','Warning EN','Avertissement FR');
for (const section of ['destino','amenidades','habitaciones','lugar']) memory.prepare('INSERT INTO "PropertySection" ("propertyId",section,"descriptionEs","descriptionEn","descriptionFr",heroMediaId) VALUES (?,?,?,?,?,?)')
  .run('pa',section,section+' ES',section+' EN',section+' FR','photo0');
function find(node, predicate) {
  if (!node || typeof node !== 'object') return;
  if (predicate(node)) return node;
  for (const child of [node.props?.children, node.props?.scenes?.map(scene=>scene.content), node.props?.afterScenes?.map(scene=>scene.content)].flat(Infinity)) { const result = find(child, predicate); if (result) return result; }
}
async function main() {
  for (const locale of ['es','en','fr']) {
    setLocale(locale); pathname = `/${locale}/casas/pa`;
    const messages = JSON.parse(fs.readFileSync(path.join(__dirname,'../apps/web/messages',locale+'.json'),'utf8'));
    const tree = await Page({ params: Promise.resolve({locale,slug:'pa'}) });
    const stream = await renderToReadableStream(React.createElement(NextIntlClientProvider, {locale,messages,timeZone:'America/Mexico_City',onError(error){throw error;}}, React.createElement(React.Fragment,null,tree,React.createElement(Footer))));
    await stream.allReady;
    const html = await new Response(stream).text();
    assert.equal((html.match(/data-detail-section=/g)||[]).length,3);
    assert.equal((html.match(/<footer\b/g)||[]).length,1);
    assert.ok(html.indexOf('data-detail-section="gallery"') < html.indexOf('data-detail-section="location"'));
    assert.ok(html.indexOf('data-detail-section="gallery"') < html.indexOf('data-editorial-slide="destino"'));
    assert.ok(html.indexOf('data-editorial-slide="destino"') < html.indexOf('data-detail-section="location"'));
    assert.ok(!html.includes('data-detail-section="category"'));
    assert.ok(html.indexOf('data-detail-section="location"') < html.indexOf('id="reservar"'));
    assert.ok(html.indexOf('<footer') > html.indexOf('id="reservar"'));
    assert.ok(html.indexOf('https://wa.me/') > html.indexOf('type="submit"'));
    assert.ok(html.includes(messages.details.backToTop));
    assert.ok(html.includes(['Advertencia ES','Warning EN','Avertissement FR'][['es','en','fr'].indexOf(locale)]));
    const gallery = find(tree, node => node.type === Gallery);
    const presentation=find(tree,node=>node.type===Presentation);
    assert.equal(presentation.props.scenes,undefined,'El mosaico no entra al stage');
    assert.equal(presentation.props.afterScenes,undefined,'Mapa/reserva no entran al stage');
    const flow=find(tree,node=>node.props?.['data-detail-flow']!==undefined);
    const children=[flow.props.children].flat(Infinity).filter(Boolean);
    assert.ok(flow.props.className.includes('detail-snap-container'));
    assert.ok(!find(flow,node=>node.type===FooterFlow),'Footer después del contenedor snap');
    assert.deepEqual(children.map(node=>node.props?.name || (node.type===Presentation?'editorial':null)),['gallery','editorial','editorial','editorial','editorial','location','reservation']);
    assert.ok(find(children[6],node=>node.props?.maxGuests));
    assert.equal((html.match(/data-scene-height="100dvh"/g)||[]).length,0);
    assert.equal((html.match(/data-editorial-slide=/g)||[]).length,4);
    assert.ok(find(tree,node=>node.type===FooterFlow));
    assert.ok(!html.includes('data-editorial-stage'));
    assert.ok(!html.includes('data-scene-body'));
    assert.ok(html.includes('https://www.google.com/maps/search/?api=1'));
    assert.equal(gallery.props.slides.length,6);
    assert.deepEqual(gallery.props.slides.map(item=>item.order),[0,2,4,6,8,10]);
    assert.deepEqual(children.filter(node=>node.type===Presentation).map(node=>node.props.slides.map(slide=>slide.section)),[['destino'],['amenidades'],['habitaciones'],['lugar']]);
    assert.equal((html.match(/data-editorial-flow=/g)||[]).length,4);
    assert.ok(!html.includes('detail-journey'));
    assert.ok(html.includes('rel="preload" as="image" href="/photo0.jpg"'),'Hero precargado');
    assert.equal((html.match(/data-flow-background=/g)||[]).length,4);
    assert.equal((html.match(/data-editorial-panel=/g)||[]).length,0);
    assert.equal((html.match(/data-scene-stop="true"/g)||[]).length,0);
    assert.equal((html.match(/aria-haspopup="dialog"/g)||[]).length,6);
  }
  memory.prepare('DELETE FROM "PropertySection"').run();
  let tree = await Page({params:Promise.resolve({locale:'es',slug:'pa'})});
  assert.equal(find(tree,node=>node.type===Presentation),undefined);
  assert.equal(find(tree,node=>node.type===Gallery).props.slides.length,6);
  pathname='/es/casas';
  const messages=JSON.parse(fs.readFileSync(path.join(__dirname,'../apps/web/messages/es.json'),'utf8'));
  assert.ok(renderToStaticMarkup(React.createElement(NextIntlClientProvider,{locale:'es',messages,timeZone:'America/Mexico_City'},React.createElement(Footer))).includes('<footer'));
  memory.prepare('DELETE FROM "Media"').run();
  tree = await Page({params:Promise.resolve({locale:'es',slug:'pa'})});
  assert.equal(find(tree,node=>node.type===Gallery).props.slides.length,0);
  assert.equal(find(tree,node=>node.type===Presentation),undefined);

  // Dirección de scroll, foco, reduced-motion, viewport/teclado y limpieza local.
  function eventTarget() {
    const listeners = new Map();
    return { listeners, addEventListener: (name, listener) => listeners.set(name,listener), removeEventListener: name => listeners.delete(name) };
  }
  const classes = new Set(), style = new Map(), buttonStyle = new Map();
  const container = {...eventTarget(),scrollTop:0,style:{setProperty:(name,value)=>style.set(name,value)},scrollTo(options){this.lastScroll=options;}};
  const navbar = {...eventTarget(),contains:()=>false,getBoundingClientRect:()=>({height:132}),classList:{contains:name=>classes.has(name),remove:(...names)=>names.forEach(name=>classes.delete(name)),toggle:(name,enabled)=>enabled?classes.add(name):classes.delete(name)}};
  const motion={...eventTarget(),matches:false};
  const viewport={...eventTarget(),height:800,offsetTop:0};
  const native={window:global.window,document:global.document,ResizeObserver:global.ResizeObserver,MutationObserver:global.MutationObserver,IntersectionObserver:global.IntersectionObserver,requestAnimationFrame:global.requestAnimationFrame,cancelAnimationFrame:global.cancelAnimationFrame};
  let effects=[],refIndex=0,callback;
  mockModule('react',{...React,useRef:()=>({current:refIndex++===0?container:{style:{setProperty:(name,value)=>buttonStyle.set(name,value)}}}),useEffect:effect=>effects.push(effect)});
  mockModule('next-intl',{useTranslations:()=>key=>key});
  const Controller=load('apps/web/src/components/PropertyDetailScroll-interactive.tsx',fs.readFileSync(path.join(__dirname,'../apps/web/src/components/PropertyDetailScroll.tsx'),'utf8')).default;
  try {
    global.window={...eventTarget(),scrollY:0,scrollTo(options){this.lastScroll=options;},innerHeight:800,visualViewport:viewport,location:{hash:''},history:{replaceState(){}},matchMedia:()=>motion};
    global.document={...eventTarget(),querySelector:()=>navbar,activeElement:null};
    global.ResizeObserver=class {observe(){} disconnect(){this.closed=true;}};
    global.requestAnimationFrame=fn=>{callback=fn;return 1;}; global.cancelAnimationFrame=()=>{};
    const observedClasses=[];
    global.MutationObserver=class {constructor(fn){observedClasses.push(fn);}observe(){}disconnect(){}};
    const ui=Controller({children:'SSR'}),cleanup=effects[0]();
    assert.ok(classes.has('detail-nav-top')); assert.equal(style.get('--detail-nav-height'),'132px');
    function scroll(top){global.window.scrollY=top;global.window.listeners.get('scroll')();callback();}
    scroll(120); assert.ok(classes.has('detail-nav-hidden'));
    classes.clear();observedClasses[0]();assert.ok(classes.has('detail-nav-hidden'),'React className no pierde el estado');
    scroll(80); assert.ok(!classes.has('detail-nav-hidden'));
    scroll(150); navbar.listeners.get('focusin')(); assert.ok(!classes.has('detail-nav-hidden'));
    motion.matches=true; motion.listeners.get('change')(); scroll(300); assert.ok(!classes.has('detail-nav-hidden'));
    const button=find(ui,node=>node.type==='button'); button.props.onClick(); assert.deepEqual(global.window.lastScroll,{top:0,behavior:'auto'});
    motion.matches=false;button.props.onClick();assert.equal(global.window.lastScroll.behavior,'smooth');
    viewport.height=400;viewport.listeners.get('resize')();
    assert.equal(style.get('--detail-viewport-height'),'400px');assert.equal(buttonStyle.get('--detail-keyboard-offset'),'400px');
    cleanup();assert.equal(container.listeners.size,0);assert.ok(!classes.has('detail-nav-top'));assert.ok(!classes.has('detail-nav-hidden'));
    // Motor real con geometría medida, foco, diálogo y reduced-motion.
    // Navbar/↑ sobre el nuevo scroller local, sin depender de window.scrollY.
    const localScroller={...eventTarget(),scrollTop:0,scrollTo(options){this.lastScroll=options;}};
    container.querySelector=()=>localScroller;global.window.scrollY=0;refIndex=0;effects=[];
    const localUI=Controller({children:'SSR'}),disposeLocal=effects[0]();
    localScroller.scrollTop=200;localScroller.listeners.get('scroll')();callback();assert.ok(classes.has('detail-nav-hidden'));
    localScroller.scrollTop=100;localScroller.listeners.get('scroll')();callback();assert.ok(!classes.has('detail-nav-hidden'));
    find(localUI,node=>node.type==='button').props.onClick();assert.equal(localScroller.lastScroll.top,0);
    global.window.scrollY=100;global.window.listeners.get('scroll')();callback();
    global.window.scrollY=50;localScroller.scrollTop=150;global.window.listeners.get('scroll')();callback();
    assert.ok(!classes.has('detail-nav-hidden'),'Scroll externo hacia arriba no se cancela con scroll interno');
    localScroller.scrollTop=250;localScroller.listeners.get('scroll')();callback();assert.ok(classes.has('detail-nav-hidden'));
    disposeLocal();assert.equal(localScroller.listeners.size,0);delete container.querySelector;
    let distance=0,dialog=false;
    const panels=Array.from({length:4},(_,number)=>{
      const values=new Map(),attributes=new Map();
      const body={scrollTop:0},content={scrollHeight:1000};
      const photos=Array.from({length:2},()=>({setAttribute(){}}));
      return {style:{setProperty:(name,value)=>values.set(name,value)},values,attributes,photos,body,content,
        contains:node=>node?.owner===number,setAttribute:(name,value)=>attributes.set(name,value),removeAttribute:name=>attributes.delete(name),
        focus(){assert.equal(this.inert,false);assert.equal(this.style.visibility,'visible');global.document.activeElement={owner:number,matches:()=>false};},querySelectorAll:()=>photos,
        querySelector:selector=>selector==='[id="reservar"]'?(number===2?{}:null):selector==='[data-scene-body]'?body:selector==='[data-scene-content]'?content:null};
    });
    const stage={offsetHeight:1000},stops=panels.map(()=>({style:{}}));
    const element={style:{},contains:()=>false,getBoundingClientRect:()=>({top:-distance}),
      querySelectorAll:selector=>selector==='[data-editorial-panel]'?panels:stops,
      querySelector:selector=>selector==='[data-editorial-stage]'?stage:dialog?{}:null};
    global.MutationObserver=class {observe(){} disconnect(){}};
    effects=[];
    mockModule('react',{...React,useRef:()=>({current:element}),useEffect:effect=>effects.push(effect)});
    const ScrollStage=load('apps/web/src/components/EditorialPresentation-scroll-test.tsx',editorialSource).EditorialStage;
    ScrollStage({scenes:Array.from({length:4},(_,i)=>({id:String(i),label:String(i),content:null}))});
    const stop=effects[0]();
    function editorialScroll(value){distance=value;global.window.listeners.get('scroll')();callback();}
    editorialScroll(500);assert.equal(panels[0].values.get('--editorial-photo-progress'),'0.5');
    editorialScroll(875);assert.equal(panels[1].style.opacity,'0.5');assert.equal(panels[1].inert,false);
    global.document.activeElement={owner:1,matches:()=>false};
    editorialScroll(2000);assert.equal(global.document.activeElement.owner,2);assert.equal(panels[1].inert,true);
    dialog=true;editorialScroll(0);assert.equal(panels[2].style.opacity,'1');dialog=false;
    panels[0].content.scrollHeight=1800;global.window.listeners.get('resize')();callback();
    assert.equal(stops[1].style.top,'1000px');assert.equal(element.style.height,'4000px');assert.ok(stops.every(stop=>stop.style.height==='1000px'));
    global.document.activeElement={matches:()=>true};
    panels[0].content.scrollHeight=2000;global.window.listeners.get('resize')();assert.equal(element.style.height,'4000px');
    panels[0].content.scrollHeight=1800;global.document.activeElement=null;
    global.document.listeners.get('focusout')();callback();callback();
    panels[0].body.scrollTop=350;editorialScroll(800);assert.equal(panels[0].body.scrollTop,350);assert.equal(panels[0].values.get('--editorial-photo-progress'),'1');
    editorialScroll(1500);assert.equal(panels[1].values.get('--editorial-photo-progress'),'0.5');
    let prevented=false;global.document.listeners.get('click')({target:{closest:()=>({getAttribute:()=>'#reservar'})},preventDefault(){prevented=true;}});
    assert.ok(prevented);assert.equal(global.window.lastScroll.top,global.window.scrollY-distance+2000);
    motion.matches=true;motion.listeners.get('change')();callback();
    assert.equal(element.style.height,'auto');assert.ok(panels.every(panel=>!panel.inert && panel.style.opacity==='1'));
    panels[2].body.scrollTop=420;editorialScroll(2500);
    assert.equal(panels[2].body.scrollTop,420,'Reduced-motion conserva el scroll interno');
    global.window.listeners.get('resize')();callback();assert.equal(panels[2].body.scrollTop,420);
    motion.matches=false;motion.listeners.get('change')();callback();editorialScroll(0);
    assert.equal(panels[0].style.opacity,'1');assert.equal(panels[0].values.get('--editorial-photo-progress'),'0');
    stop();assert.equal(global.window.listeners.size,0);
    // Editoriales naturales: progreso/fundido independientes del snap desactivado.
    let flowDistance=-1200;
    const flowAttributes=new Map(),heights=[400,800,500,600];
    const flowScreens=heights.map((_,number)=>({
      get offsetHeight(){return heights[number];},
      getBoundingClientRect:()=>({top:-flowDistance+heights.slice(0,number).reduce((a,b)=>a+b,0)}),
      style:{setProperty(name,value){this[name]=value;}},
      querySelectorAll:()=>[{setAttribute(){}},{setAttribute(){}}],
    }));
    const flowBackgrounds=flowScreens.map(()=>({style:{}}));
    const flowRoot={getBoundingClientRect:()=>({top:-flowDistance,bottom:heights.reduce((a,b)=>a+b,0)-flowDistance}),
      querySelectorAll:selector=>selector==='[data-editorial-slide]'?flowScreens:flowBackgrounds,
      setAttribute:(name,value)=>flowAttributes.set(name,value),removeAttribute:name=>flowAttributes.delete(name)};
    effects=[];global.window.innerHeight=1000;
    mockModule('react',{...React,useRef:()=>({current:flowRoot}),useEffect:effect=>effects.push(effect)});
    const flowSlides=heights.map((_,index)=>({section:['destino','amenidades','habitaciones','lugar'][index],photos:[],description:'Text'}));
    const FlowPresentation=load('apps/web/src/components/EditorialPresentation-flow-test.tsx',editorialSource).default;
    const FreeFlow=FlowPresentation({slides:flowSlides}).props.children[1].type;
    effects=[];FreeFlow({slides:flowSlides});const disposeFlow=effects[0]();
    assert.equal(flowAttributes.get('data-scroll-free'),'false');
    flowDistance=0;global.window.listeners.get('scroll')();callback();
    assert.equal(flowAttributes.get('data-scroll-free'),'true');
    assert.equal(flowBackgrounds[1].style.opacity,'0.5'); // último cuarto de los 400px naturales.
    assert.equal(flowScreens[0].style['--editorial-photo-progress'],'1');
    flowDistance=500;global.window.listeners.get('scroll')();callback();assert.equal(flowBackgrounds[1].style.opacity,'1');
    assert.ok(flowScreens.every(screen=>!screen.inert));
    heights[0]=1100;global.window.listeners.get('resize')();callback();assert.equal(flowBackgrounds[0].style.opacity,'1');
    motion.matches=true;motion.listeners.get('change')();callback();assert.ok(flowScreens.every(screen=>screen.style['--editorial-photo-progress']==='0'));
    flowDistance=heights.reduce((a,b)=>a+b,0);global.window.listeners.get('scroll')();callback();assert.equal(flowAttributes.get('data-scroll-free'),'false');
    disposeFlow();assert.equal(flowAttributes.size,0);assert.equal(global.window.listeners.size,0);global.window.innerHeight=800;
    const detailCss=fs.readFileSync(path.join(__dirname,'../apps/web/src/app/globals.css'),'utf8');
    assert.match(detailCss,/\.detail-snap-container \{[^}]*height: 100vh;[^}]*overflow-y: scroll;[^}]*scroll-snap-type: y proximity;/);
    assert.match(detailCss,/min-height: 100vh !important;[^}]*scroll-snap-align: start;[^}]*display: flex;/);
    assert.match(detailCss,/\.detail-independent > \.detail-screen,[\s\S]*?height: auto;[\s\S]*?min-height: 100vh !important;/);
    assert.match(detailCss,/\.detail-screen \{[^}]*min-height: 0;[^}]*padding: 1\.5rem 1rem;/);
    assert.match(detailCss,/\.detail-location-map iframe \{ pointer-events: none;/);
    assert.match(detailCss,/\.detail-location-map iframe:focus \{ pointer-events: auto;/);
    const stageCss=fs.readFileSync(path.join(__dirname,'../apps/web/src/components/EditorialPresentation.module.css'),'utf8');
    assert.ok(!/scroll-snap-align:\s*start/.test(stageCss));
    assert.match(detailCss,/body:has\(\.property-detail\) > nav \{[^}]*var\(--background\) 75%, transparent/);
    assert.ok(!detailCss.includes('.detail-journey'),'Sin fondo global compartido');
    assert.ok(!detailCss.includes('animation-timeline:'),'Sin animaciones complejas de fondo');
    assert.match(detailCss,/\.detail-independent \[data-editorial-flow\] > \[aria-hidden="true"\] > div \{[^}]*position: absolute;/);
    assert.match(detailCss,/\.detail-snap-container:has\(dialog\[open\]\) \{ overflow-y: hidden;/);
    // Fondo compartido real: sirve también a casas sin filas editoriales.
    let journeyScroll=0;
    const journeyHeights=[1200,800,1000],journeyNames=['gallery','location','reservation'];
    const journeySections=journeyNames.map((name,index)=>({dataset:{detailSection:name},offsetHeight:journeyHeights[index],
      getBoundingClientRect:()=>({top:journeyHeights.slice(0,index).reduce((a,b)=>a+b,0)-journeyScroll})}));
    const journeyLayers=journeyNames.map(name=>({dataset:{journeyBackground:name},style:{}}));
    const journeyAttributes=new Map();
    const journey={querySelectorAll:selector=>selector.includes('data-detail-section')?journeySections:journeyLayers,
      setAttribute:(name,value)=>journeyAttributes.set(name,value),removeAttribute:name=>journeyAttributes.delete(name)};
    effects=[];motion.matches=false;global.window.innerHeight=1000;
    mockModule('react',{...React,useRef:()=>({current:{closest:()=>journey}}),useEffect:effect=>effects.push(effect)});
    const JourneyPresentation=load('apps/web/src/components/EditorialPresentation-journey-test.tsx',editorialSource).default;
    JourneyPresentation({slides:[]});const disposeJourney=effects[0]();
    assert.equal(journeyAttributes.get('data-background-ready'),'true');
    assert.deepEqual(journeyLayers.map(layer=>layer.style.opacity),['1','0','0']);
    function journeyMove(value){journeyScroll=value;global.window.listeners.get('scroll')();callback();}
    journeyMove(700);assert.deepEqual(journeyLayers.map(layer=>layer.style.opacity),['1','0.5','0']);
    journeyMove(1200);assert.deepEqual(journeyLayers.map(layer=>layer.style.opacity),['0','1','0']);
    journeyMove(2000);assert.deepEqual(journeyLayers.map(layer=>layer.style.opacity),['0','0','1']);
    journeyMove(0);assert.equal(journeyLayers[0].style.opacity,'1','El fondo vuelve al inicio');
    motion.matches=true;motion.listeners.get('change')();callback();assert.ok(!journeyAttributes.has('data-background-ready'));
    motion.matches=false;motion.listeners.get('change')();callback();assert.ok(journeyAttributes.has('data-background-ready'));
    disposeJourney();assert.equal(journeyAttributes.size,0);assert.equal(global.window.listeners.size,0);global.window.innerHeight=800;
    // Footer fuera del stage: frontera de viewport y cleanup sin tocar el motor.
    let rect={top:900,bottom:1400},observed,closed=false;
    const attributes=new Map(),footerElement={getBoundingClientRect:()=>rect,setAttribute:(name,value)=>attributes.set(name,value)};
    global.IntersectionObserver=class {constructor(callback){observed=callback;}observe(){}disconnect(){closed=true;}};
    global.window.IntersectionObserver=global.IntersectionObserver;
    effects=[];mockModule('react',{...React,useRef:()=>({current:footerElement}),useEffect:effect=>effects.push(effect)});
    const Flow=load('apps/web/src/components/DetailFooterFlow-test.tsx',fs.readFileSync(path.join(__dirname,'../apps/web/src/components/DetailFooterFlow.tsx'),'utf8')).default;
    const footerUI=Flow({children:'Footer original'}),dispose=effects[0]();
    assert.equal(footerUI.props.className,'detail-footer-flow');assert.equal(attributes.get('data-visible'),'false');
    rect={top:800,bottom:1300};observed();assert.equal(attributes.get('data-visible'),'true');
    rect={top:1000,bottom:1500};observed();assert.equal(attributes.get('data-visible'),'false');
    dispose();assert.ok(closed);
  } finally {Object.assign(global,native);}
  console.log('OK detalle: orden blueprint, editorial sin timers, paneles/fotos por scroll y reduced-motion, galería/fallbacks, footer, es/en/fr; navbar/teclado simulados.');
}
main().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>memory.close());
