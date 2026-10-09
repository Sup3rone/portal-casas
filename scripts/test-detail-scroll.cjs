// Página/cliente reales; SSR + efectos con DOM/scroll simulados. Sin Neon.
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const { execFileSync } = require('node:child_process');
for (const file of ['apps/web/src/components/EditorialPresentation.module.css']) {
  const before = execFileSync('git',['show',`a7e53aa57a24919592d28e8cffb4957a83510e9e:${file}`],{encoding:'utf8'});
  assert.equal(fs.readFileSync(path.join(__dirname,'..',file),'utf8').replace(/\r\n/g,'\n'),before.replace(/\r\n/g,'\n'),`${file} debe conservarse intacto`);
}
const editorialSource = fs.readFileSync(path.join(__dirname,'../apps/web/src/components/EditorialPresentation.tsx'),'utf8');
assert.ok(!/setInterval|setTimeout/.test(editorialSource),'No debe haber avance editorial por tiempo');
const originalEditorial = execFileSync('git',['show','a7e53aa57a24919592d28e8cffb4957a83510e9e:apps/web/src/components/EditorialPresentation.tsx'],{encoding:'utf8'});
for (const [start,end] of [['    {slide.hero','    <div className={styles.floating}>'],['    <div className={`${styles.narrative}','  </section>;']]) {
  const fragment = text => text.slice(text.indexOf(start),text.indexOf(end,text.indexOf(start))).replace(/\r\n/g,'\n');
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
  for (const child of [node.props?.children].flat(Infinity)) { const result = find(child, predicate); if (result) return result; }
}
async function main() {
  for (const locale of ['es','en','fr']) {
    setLocale(locale); pathname = `/${locale}/casas/pa`;
    const messages = JSON.parse(fs.readFileSync(path.join(__dirname,'../apps/web/messages',locale+'.json'),'utf8'));
    const tree = await Page({ params: Promise.resolve({locale,slug:'pa'}) });
    const stream = await renderToReadableStream(React.createElement(NextIntlClientProvider, {locale,messages,timeZone:'America/Mexico_City',onError(error){throw error;}}, React.createElement(React.Fragment,null,tree,React.createElement(Footer))));
    await stream.allReady;
    const html = await new Response(stream).text();
    assert.equal((html.match(/data-detail-section=/g)||[]).length,4);
    assert.equal((html.match(/<footer\b/g)||[]).length,1);
    assert.ok(html.indexOf('data-detail-section="gallery"') < html.indexOf('data-detail-section="location"'));
    assert.ok(html.indexOf('data-detail-section="gallery"') < html.indexOf('data-detail-section="editorial"'));
    assert.ok(html.indexOf('data-detail-section="editorial"') < html.indexOf('data-detail-section="location"'));
    assert.ok(!html.includes('data-detail-section="category"'));
    assert.ok(html.indexOf('data-detail-section="location"') < html.indexOf('id="reservar"'));
    assert.ok(html.indexOf('<footer') > html.indexOf('id="reservar"'));
    assert.ok(html.indexOf('https://wa.me/') > html.indexOf('type="submit"'));
    assert.ok(html.includes(messages.details.backToTop));
    assert.ok(html.includes(['Advertencia ES','Warning EN','Avertissement FR'][['es','en','fr'].indexOf(locale)]));
    const gallery = find(tree, node => node.type === Gallery);
    assert.equal(gallery.props.slides.length,6);
    assert.deepEqual(gallery.props.slides.map(item=>item.order),[0,2,4,6,8,10]);
    assert.equal(find(tree,node=>node.type===Presentation).props.slides.length,4);
    assert.equal((html.match(/data-editorial-panel=/g)||[]).length,4);
    assert.equal((html.match(/class="detail-editorial-stop"/g)||[]).length,4);
    assert.equal((html.match(/aria-haspopup="dialog"/g)||[]).length,6);
  }
  memory.prepare('DELETE FROM "PropertySection"').run();
  let tree = await Page({params:Promise.resolve({locale:'es',slug:'pa'})});
  assert.ok(!find(tree,node=>node.type===Presentation));
  assert.equal(find(tree,node=>node.type===Gallery).props.slides.length,6);
  pathname='/es/casas';
  const messages=JSON.parse(fs.readFileSync(path.join(__dirname,'../apps/web/messages/es.json'),'utf8'));
  assert.ok(renderToStaticMarkup(React.createElement(NextIntlClientProvider,{locale:'es',messages,timeZone:'America/Mexico_City'},React.createElement(Footer))).includes('<footer'));
  memory.prepare('DELETE FROM "Media"').run();
  tree = await Page({params:Promise.resolve({locale:'es',slug:'pa'})});
  assert.equal(find(tree,node=>node.type===Gallery).props.slides.length,0);
  assert.ok(!find(tree,node=>node.type===Presentation));

  // Dirección de scroll, foco, reduced-motion, viewport/teclado y limpieza local.
  function eventTarget() {
    const listeners = new Map();
    return { listeners, addEventListener: (name, listener) => listeners.set(name,listener), removeEventListener: name => listeners.delete(name) };
  }
  const classes = new Set(), style = new Map(), buttonStyle = new Map();
  const container = {...eventTarget(),scrollTop:0,style:{setProperty:(name,value)=>style.set(name,value)},scrollTo(options){this.lastScroll=options;}};
  const navbar = {...eventTarget(),contains:()=>false,getBoundingClientRect:()=>({height:132}),classList:{remove:(...names)=>names.forEach(name=>classes.delete(name)),toggle:(name,enabled)=>enabled?classes.add(name):classes.delete(name)}};
  const motion={...eventTarget(),matches:false};
  const viewport={...eventTarget(),height:800,offsetTop:0};
  const native={window:global.window,document:global.document,ResizeObserver:global.ResizeObserver,requestAnimationFrame:global.requestAnimationFrame,cancelAnimationFrame:global.cancelAnimationFrame};
  let effects=[],refIndex=0,callback;
  mockModule('react',{...React,useRef:()=>({current:refIndex++===0?container:{style:{setProperty:(name,value)=>buttonStyle.set(name,value)}}}),useEffect:effect=>effects.push(effect)});
  mockModule('next-intl',{useTranslations:()=>key=>key});
  const Controller=load('apps/web/src/components/PropertyDetailScroll-interactive.tsx',fs.readFileSync(path.join(__dirname,'../apps/web/src/components/PropertyDetailScroll.tsx'),'utf8')).default;
  try {
    global.window={...eventTarget(),scrollY:0,scrollTo(options){this.lastScroll=options;},innerHeight:800,visualViewport:viewport,matchMedia:()=>motion};
    global.document={querySelector:()=>navbar,activeElement:null};
    global.ResizeObserver=class {observe(){} disconnect(){this.closed=true;}};
    global.requestAnimationFrame=fn=>{callback=fn;return 1;}; global.cancelAnimationFrame=()=>{};
    const ui=Controller({children:'SSR'}),cleanup=effects[0]();
    assert.ok(classes.has('detail-nav-top')); assert.equal(style.get('--detail-nav-height'),'132px');
    function scroll(top){global.window.scrollY=top;global.window.listeners.get('scroll')();callback();}
    scroll(120); assert.ok(classes.has('detail-nav-hidden'));
    scroll(80); assert.ok(!classes.has('detail-nav-hidden'));
    scroll(150); navbar.listeners.get('focusin')(); assert.ok(!classes.has('detail-nav-hidden'));
    motion.matches=true; motion.listeners.get('change')(); scroll(300); assert.ok(!classes.has('detail-nav-hidden'));
    const button=find(ui,node=>node.type==='button'); button.props.onClick(); assert.deepEqual(global.window.lastScroll,{top:0,behavior:'auto'});
    motion.matches=false;button.props.onClick();assert.equal(global.window.lastScroll.behavior,'smooth');
    viewport.height=400;viewport.listeners.get('resize')();
    assert.equal(style.get('--detail-viewport-height'),'400px');assert.equal(buttonStyle.get('--detail-keyboard-offset'),'400px');
    cleanup();assert.equal(container.listeners.size,0);assert.ok(!classes.has('detail-nav-top'));assert.ok(!classes.has('detail-nav-hidden'));
    // Efecto real editorial: el scroll cambia paneles y fotos; no existen timers.
    let distance=0;
    const panels=Array.from({length:4},()=>{
      const values=new Map(),attributes=new Map();
      const photos=Array.from({length:2},()=>({attributes:new Map(),setAttribute(name,value){this.attributes.set(name,value);}}));
      return {style:{setProperty:(name,value)=>values.set(name,value)},values,attributes,photos,
        setAttribute:(name,value)=>attributes.set(name,value),querySelectorAll:()=>photos};
    });
    const element={getBoundingClientRect:()=>({top:-distance}),querySelectorAll:()=>panels,querySelector:()=>({offsetHeight:1000})};
    effects=[];
    mockModule('react',{...React,useRef:()=>({current:element}),useEffect:effect=>effects.push(effect)});
    const ScrollPresentation=load('apps/web/src/components/EditorialPresentation-scroll-test.tsx',editorialSource).default;
    ScrollPresentation({slides:Array.from({length:4},(_,i)=>({section:['destino','amenidades','habitaciones','lugar'][i],photos:[]}))});
    const stop=effects[0]();
    function editorialScroll(value){distance=value;global.window.listeners.get('scroll')();callback();}
    editorialScroll(500);assert.equal(panels[0].values.get('--editorial-photo-progress'),'0.5');
    editorialScroll(875);assert.equal(panels[1].style.opacity,'0.5');assert.equal(panels[1].inert,false);
    editorialScroll(1000);assert.equal(panels[1].style.opacity,'1');assert.equal(panels[0].inert,true);
    editorialScroll(3500);assert.equal(panels[3].values.get('--editorial-photo-progress'),'0.5');
    motion.matches=true;motion.listeners.get('change')();callback();assert.equal(panels[3].values.get('--editorial-photo-progress'),'1');
    editorialScroll(0);assert.equal(panels[0].style.opacity,'1');assert.equal(panels[0].values.get('--editorial-photo-progress'),'0');
    stop();assert.equal(global.window.listeners.size,0);
  } finally {Object.assign(global,native);}
  console.log('OK detalle: orden blueprint, editorial sin timers, paneles/fotos por scroll y reduced-motion, galería/fallbacks, footer, es/en/fr; navbar/teclado simulados.');
}
main().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>memory.close());
