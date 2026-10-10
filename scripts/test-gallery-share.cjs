// Componentes reales y capacidades de compartir simuladas; sin red ni BD real.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { load, req, memory, setLocale, mockModule } = require('./test-property-access.cjs');
const React = req('react');
const { renderToStaticMarkup } = req('react-dom/server');
const { NextIntlClientProvider } = req('next-intl');
const Gallery = load('apps/web/src/components/PropertyGallery.tsx').default;
const Share = load('apps/web/src/components/PropertyShareButton.tsx');
const Map = load('apps/web/src/components/LocationMap.tsx').default;
const slides = Array.from({ length: 55 }, (_, i) => ({ url: '/images/photo-' + i + '.jpg', type: i === 7 ? 'VIDEO' : 'PHOTO' }));

async function main() {
  for (const locale of ['es', 'en', 'fr']) {
    setLocale(locale);
    const messages = JSON.parse(fs.readFileSync(path.join(__dirname, '../apps/web/messages/' + locale + '.json'), 'utf8'));
    const wrap = child => React.createElement(NextIntlClientProvider, { locale, messages, timeZone: 'America/Mexico_City', onError(error) { throw error; } }, child);
    const html = renderToStaticMarkup(wrap(React.createElement(Gallery, { slides })));
    assert.equal((html.match(/aria-haspopup="dialog"/g) ?? []).length, 8);
    assert.ok(!html.includes('+47'));
    assert.ok(!html.includes('/images/photo-8.jpg'));
    const short = renderToStaticMarkup(wrap(React.createElement(Gallery, { slides: slides.slice(0, 3) })));
    assert.equal((short.match(/aria-haspopup="dialog"/g) ?? []).length, 3);
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
  let active = null;
  mockModule('react', { ...React, useState: () => [active, next => { active = typeof next === 'function' ? next(active) : next; }], useRef: () => ({ current: null }), useEffect() {} });
  mockModule('next-intl', { useTranslations: () => (key, values) => key === 'posicion' ? `${values.number}/${values.count}` : key });
  const InteractiveGallery = load('apps/web/src/components/PropertyGallery-interactive.tsx', fs.readFileSync(path.join(__dirname, '../apps/web/src/components/PropertyGallery.tsx'), 'utf8')).default;
  const photos = Array.from({ length: 28 }, (_, i) => ({ url: `/test/${i}.jpg`, type: 'PHOTO' }));
  const render = () => InteractiveGallery({ slides: photos });
  function find(node, predicate) {
    if (!node || typeof node !== 'object') return;
    if (predicate(node)) return node;
    for (const child of [node.props?.children].flat(Infinity)) { const result = find(child, predicate); if (result) return result; }
  }
  let tree = render();
  const grid = tree.props.children[0];
  assert.equal(grid.props.children.length, 8);
  grid.props.children[7].props.onClick({ currentTarget: { focus() {} } });
  tree = render(); assert.equal(active, 7);
  assert.equal(find(tree, node => node.props?.role === 'status').props.children.join(''), '8/8');
  assert.ok(find(tree, node => node.props?.src === '/test/7.jpg'));
  find(tree, node => node.props?.['aria-label'] === 'siguiente').props.onClick();
  assert.equal(active, 0);
  find(render(), node => node.props?.['aria-label'] === 'anterior').props.onClick();
  assert.equal(active, 7);
  find(render(), node => node.type === 'dialog').props.onKeyDown({ key: 'ArrowRight', preventDefault() {} });
  assert.equal(active, 0);
  assert.ok(!find(render(), node => node.props?.src === '/test/8.jpg'));
  active = 7;
  const renderFull = () => InteractiveGallery({ slides: photos, fullCollection: true });
  find(renderFull(), node => node.props?.['aria-label'] === 'siguiente').props.onClick();
  assert.equal(active, 8);
  assert.ok(find(renderFull(), node => node.props?.src === '/test/8.jpg'));
  assert.equal(find(renderFull(), node => node.props?.role === 'status').props.children.join(''), '9/28');
  // Handler del botón: contenido calculado y feedback de ubicación/página correctos.
  let hooks,index;
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
