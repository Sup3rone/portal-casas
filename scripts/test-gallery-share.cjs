// Componentes reales y capacidades de compartir simuladas; sin red ni BD real.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { load, req, memory, setLocale, mockModule } = require('./test-property-access.cjs');
const React = req('react');
const { renderToStaticMarkup } = req('react-dom/server');
const { NextIntlClientProvider } = req('next-intl');
const Gallery = load('apps/web/src/components/PropertyGallery.tsx').default;
const DeferredImage = load('apps/web/src/components/DeferredDetailImage.tsx').default;
const Share = load('apps/web/src/components/PropertyShareButton.tsx');
const Map = load('apps/web/src/components/LocationMap.tsx').default;
const slides = Array.from({ length: 55 }, (_, i) => ({ url: '/images/photo-' + i + '.jpg', type: i === 7 ? 'VIDEO' : 'PHOTO' }));

async function main() {
  // Cascada CSS offline: no navegador ni medición visual simulada.
  const {createRequire}=require('node:module');
  const postcss=createRequire(req.resolve('@tailwindcss/postcss'))('postcss');
  const galleryCss=postcss.parse(fs.readFileSync('apps/web/src/components/PropertyGallery.module.css','utf8'));
  function computed(selector,width) {
    const styles={};
    galleryCss.walkRules(rule=>{
      if(rule.selector!==selector)return;
      if(rule.parent.type==='atrule') {
        assert.equal(rule.parent.params,'(width < 64rem)');
        if(width>=1024)return;
      }
      rule.walkDecls(decl=>{styles[decl.prop]=decl.value;});
    });
    return styles;
  }
  for(const width of [375,768,1440]) {
    const order=['hero','strip','controls'].sort((a,b)=>Number(computed('.'+a,width).order||0)-Number(computed('.'+b,width).order||0));
    assert.deepEqual(order,width<1024?['hero','controls','strip']:['hero','strip','controls']);
    assert.equal(computed('.controls',width)['justify-content'],width<1024?'center':'space-between');
    assert.equal(computed('.controls',width)['margin-top'],width<1024?'.5rem':'.25rem');
    assert.equal(computed('.arrow',width).width,'64px');assert.equal(computed('.arrow',width).height,'48px');
  }
  assert.equal(computed('.gallery',1440).display,undefined,'Escritorio conserva display original');
  for(const width of [375,768]) {
    const dialog=computed('.lightbox[open]',width);
    assert.equal(dialog.display,'grid');
    assert.equal(dialog['grid-template-rows'],'auto minmax(0, 1fr) auto');
    assert.equal(dialog.height,'100dvh');assert.equal(dialog['max-height'],'100dvh');
    assert.equal(dialog.overflow,'hidden');
    assert.ok(dialog['padding-bottom'].includes('safe-area-inset-bottom'));
    const media=computed('.lightboxMedia :is(img, video)',width);
    assert.equal(media.height,'100%');assert.equal(media.width,'100%');assert.equal(media['object-fit'],'contain');
    assert.equal(computed('.lightboxMedia',width)['min-height'],'0');
  }
  assert.deepEqual(computed('.lightbox[open]',1440),{},'Sin cambio de lightbox desktop');
  assert.deepEqual(computed('.lightboxMedia :is(img, video)',1440),{},'Sin override de imagen desktop');


  const deferred = renderToStaticMarkup(React.createElement(DeferredImage, { src: '/far-background.jpg', alt: '', fill: true, unoptimized: true }));
  assert.ok(!deferred.includes(' src="/far-background.jpg"'), 'El fondo lejano no se descarga desde el HTML inicial');
  const eager = renderToStaticMarkup(React.createElement(DeferredImage, { src: '/first-background.jpg', alt: '', fill: true, eager: true, unoptimized: true }));
  assert.ok(eager.includes('src="/first-background.jpg"'), 'El primer fondo está disponible desde SSR');
  for (const locale of ['es', 'en', 'fr']) {
    setLocale(locale);
    const messages = JSON.parse(fs.readFileSync(path.join(__dirname, '../apps/web/messages/' + locale + '.json'), 'utf8'));
    const wrap = child => React.createElement(NextIntlClientProvider, { locale, messages, timeZone: 'America/Mexico_City', onError(error) { throw error; } }, child);
    const html = renderToStaticMarkup(wrap(React.createElement(Gallery, { slides })));
    assert.equal((html.match(/aria-haspopup="dialog"/g) ?? []).length, 1);
    assert.equal((html.match(/loading="eager"/g) ?? []).length, 1, 'Solo la imagen principal carga eager');
    assert.equal((html.match(/loading="lazy"/g) ?? []).length, 7, 'Las siete fotos de la franja cargan lazy; el video conserva su flujo');
    assert.ok(!html.includes('+47'));
    assert.ok(!html.includes('/images/photo-8.jpg'));
    const short = renderToStaticMarkup(wrap(React.createElement(Gallery, { slides: slides.slice(0, 3) })));
    assert.equal((short.match(/aria-haspopup="dialog"/g) ?? []).length, 1);
    assert.ok(html.includes('aria-modal="true"'));
    assert.ok(html.includes(messages.details.gallery.lightbox));
    assert.ok(html.includes('<video'));
    assert.equal(renderToStaticMarkup(wrap(React.createElement(Gallery, { slides: [] }))), '');
    const map = renderToStaticMarkup(wrap(await Map({ lat: 20, lng: -105, address: 'Address', propertyTitle: 'Property' })));
    assert.ok(map.includes(messages.details.share.locationAction));
    assert.ok(map.includes('hl=' + locale));

    const data = { title: 'Property ' + locale, url: 'https://example.com/' + locale + '/casas/property' };
    let native, copied;
    const clipboard = { writeText: async url => { copied = url; } };
    assert.equal(await Share.shareProperty(data, { share: async value => { native = value; }, clipboard }), 'shared');
    assert.deepEqual(native, data); assert.equal(copied, undefined);
    assert.equal(await Share.shareProperty(data, { clipboard }), 'copied'); assert.equal(copied, data.url);
    copied = undefined;
    assert.equal(await Share.shareProperty(data, { share: async () => { throw new DOMException('Cancel', 'AbortError'); }, clipboard }), 'idle');
    assert.equal(copied, undefined, 'Cancelar no debe copiar');
    assert.equal(await Share.shareProperty(data, { share: async () => { throw new DOMException('Unavailable', 'NotAllowedError'); }, clipboard }), 'copied');
    await assert.rejects(() => Share.shareProperty(data, { clipboard: { writeText: async () => { throw new Error('Denied'); } } }), /Denied/);
    for (const [location, query] of [
      [{ lat:20, lng:-105, address:'Ignored', city:'Nuevo Vallarta' }, '20,-105'],
      [{ lat:null, lng:null, address:'Av. México 1 & 2', city:'Nuevo Vallarta' }, 'Av. México 1 & 2, Nuevo Vallarta'],
      [{ address:'', city:'' }, null],
    ]) {
      const props={title:'Property '+locale,...location};
      const shared=Share.propertyShareData(props,data.url);
      assert.equal(shared.url,query ? 'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(query) : data.url);
      assert.equal(shared.text,props.title+(props.city ? ' — '+props.city : ''));
      native=undefined;copied=undefined;
      assert.equal(await Share.shareProperty(shared,{share:async value=>{native=value;},clipboard}),'shared');
      assert.deepEqual(native,shared);assert.equal(copied,undefined);
      assert.equal(await Share.shareProperty(shared,{clipboard}),'copied');assert.equal(copied,shared.url);
    }
    assert.equal(Share.propertyLocationUrl({lat:0,lng:0}),'https://www.google.com/maps/search/?api=1&query=0%2C0');
    assert.equal(Share.propertyLocationUrl({lat:NaN,lng:0,city:'City'}),'https://www.google.com/maps/search/?api=1&query=City');
    assert.equal(Share.propertyLocationUrl({lat:91,lng:181,address:'Address'}),'https://www.google.com/maps/search/?api=1&query=Address');
    assert.equal(Share.propertyLocationUrl({lat:20,lng:null}),null);
    assert.equal(Share.propertyLocationUrl({address:'   ',city:' '}),null);
    console.log(locale + ': mosaico, límite, video, mapa y share/copia/cancelación OK');
  }
  // Handlers reales: lightbox limitada y navegación circular/teclado entre 0 y 7.
  let hooks=[], hookIndex=0, refIndex=0; const refs=[];
  mockModule('react', { ...React, useState: initial => {const slot=hookIndex++;if(!(slot in hooks))hooks[slot]=initial;return [hooks[slot], next => {hooks[slot]=typeof next==='function'?next(hooks[slot]):next;}];}, useRef: initial => {const slot=refIndex++;return refs[slot] ||= {current:initial};}, useEffect() {} });
  mockModule('next-intl', { useTranslations: () => (key, values) => key === 'posicion' ? `${values.number}/${values.count}` : key });
  const InteractiveGallery = load('apps/web/src/components/PropertyGallery-interactive.tsx', fs.readFileSync(path.join(__dirname, '../apps/web/src/components/PropertyGallery.tsx'), 'utf8')).default;
  const photos = Array.from({ length: 28 }, (_, i) => ({ url: `/test/${i}.jpg`, type: 'PHOTO' }));
  const render = () => {hookIndex=0;refIndex=0;return InteractiveGallery({ slides: photos });};
  function find(node, predicate) {
    if (!node || typeof node !== 'object') return;
    if (predicate(node)) return node;
    for (const child of [node.props?.children].flat(Infinity)) { const result = find(child, predicate); if (result) return result; }
  }
  let tree = render();
  const thumbnails=find(tree,node=>node.props?.className==='strip');
  assert.equal(thumbnails.props.children.length,8);
  const priorWindow=global.window;const movements=[];
  try {
    let reduce=false;global.window={matchMedia:()=>({matches:reduce})};
    thumbnails.props.ref.current={clientWidth:300,scrollBy:options=>movements.push(options)};
    find(tree,node=>node.props?.className==='arrow'&&node.props['aria-label']==='anterior').props.onClick();
    reduce=true;
    find(tree,node=>node.props?.className==='arrow'&&node.props['aria-label']==='siguiente').props.onClick();
    assert.deepEqual(movements,[{left:-300,behavior:'smooth'},{left:300,behavior:'instant'}]);
  } finally {global.window=priorWindow;}

  thumbnails.props.children[7].props.onClick();
  tree=render();assert.equal(hooks[0],7,'La miniatura cambia la principal');assert.equal(hooks[1],null,'Seleccionar no abre el modal');
  assert.equal(find(tree,node=>node.props?.className==='hero').props.children.props.src,'/test/7.jpg');
  let returnedFocus=0;
  find(tree,node=>node.props?.className==='hero').props.onClick({currentTarget:{focus(){returnedFocus++;}}});
  tree=render();assert.equal(hooks[1],7);
  assert.equal(find(tree,node=>node.props?.role==='status').props.children.join(''),'8/8');
  find(tree,node=>node.props?.['aria-label']==='siguiente'&&node.props.className!=='arrow').props.onClick();assert.equal(hooks[1],0);
  find(render(),node=>node.type==='dialog').props.onKeyDown({key:'ArrowLeft',preventDefault(){}});assert.equal(hooks[1],7);
  assert.ok(!find(render(),node=>node.props?.src==='/test/8.jpg'));
  const dialog=find(render(),node=>node.type==='dialog');
  assert.ok(dialog.props.className.includes('lightbox property-lightbox'));
  assert.ok(find(dialog,node=>node.props?.className?.includes('lightboxMedia')));
  let cancelled=false;
  dialog.props.onCancel({preventDefault(){cancelled=true;}});
  assert.ok(cancelled);assert.equal(hooks[1],null);assert.equal(returnedFocus,1,'Escape/cancel devuelve foco al opener');
  find(render(),node=>node.props?.className==='hero').props.onClick({currentTarget:{focus(){returnedFocus++;}}});
  const nativeElement=global.Element;
  try {
    global.Element=class {closest(){return null;}};
    find(render(),node=>node.type==='dialog').props.onClick({target:new global.Element()});
    assert.equal(hooks[1],null);assert.equal(returnedFocus,2,'Clic fuera devuelve foco');
  } finally {global.Element=nativeElement;}
  find(render(),node=>node.props?.className==='hero').props.onClick({currentTarget:{focus(){returnedFocus++;}}});
  const renderFull=()=>{hookIndex=0;refIndex=0;return InteractiveGallery({slides:photos,fullCollection:true});};
  find(renderFull(),node=>node.props?.['aria-label']==='siguiente'&&node.props.className!=='arrow').props.onClick();assert.equal(hooks[1],8);
  assert.equal(find(renderFull(),node=>node.props?.role==='status').props.children.join(''),'9/28');
  // Handler del botón: contenido calculado y feedback de ubicación/página correctos.
  let index;
  mockModule('react',{...React,useEffect(){},useState(initial){const slot=index++;if(!(slot in hooks))hooks[slot]=initial;return [hooks[slot],value=>{hooks[slot]=value;}];}});
  const InteractiveShare=load('apps/web/src/components/PropertyShareButton-interactive.tsx',fs.readFileSync(path.join(__dirname,'../apps/web/src/components/PropertyShareButton.tsx'),'utf8')).default;
  const oldNavigator=Object.getOwnPropertyDescriptor(global,'navigator'),oldWindow=global.window;
  const pageUrl='https://example.com/fr/casas/property';
  let copiedLink;
  global.window={location:{href:pageUrl}};
  Object.defineProperty(global,'navigator',{configurable:true,value:{clipboard:{writeText:async url=>{copiedLink=url;}}}});
  try{
    for(const props of [{title:'Maison',lat:20,lng:-105,city:'Vallarta'},{title:'Maison',address:'Calle 1',city:'Vallarta'},{title:'Maison'}]){
      hooks=[];const renderShare=()=>{index=0;return InteractiveShare(props);};
      const url=Share.propertyLocationUrl(props);
      assert.equal(find(renderShare(),node=>node.type==='button').props['aria-label'],url?'locationAction':'action');
      await find(renderShare(),node=>node.type==='button').props.onClick();
      assert.equal(copiedLink,url||pageUrl);
      assert.equal(find(renderShare(),node=>node.props?.role==='status').props.children,url?'locationCopied':'copied');
      assert.equal(find(renderShare(),node=>node.type==='button').props.disabled,false);
    }
  }finally{if(oldNavigator)Object.defineProperty(global,'navigator',oldNavigator);else delete global.navigator;global.window=oldWindow;}
  memory.close();
  console.log('OK: galería y compartir sin red, escrituras ni librerías nuevas.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
