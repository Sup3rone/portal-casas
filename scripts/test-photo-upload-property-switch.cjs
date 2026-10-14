// Handlers cliente/servidor reales; hooks y DOM mínimo simulados, sin red ni Blob.
const assert = require('node:assert/strict');
const { load, memory, req, mockModule, setSession } = require('./test-property-access.cjs');
const React = req('react');
let instance, index;
const effects = [];
mockModule('react', { ...React,
  useState(value) {
    const slot = index++;
    if (!(slot in instance.hooks)) instance.hooks[slot] = typeof value === 'function' ? value() : value;
    const mounted = instance;
    return [mounted.hooks[slot], next => { mounted.hooks[slot] = typeof next === 'function' ? next(mounted.hooks[slot]) : next; }];
  },
  useRef(value) {
    const slot = index++;
    return instance.hooks[slot] ||= { current: value };
  },
  useEffect(effect) { effects.push(effect); },
});
mockModule('next-intl', { ...req('next-intl'), useTranslations: () => key => key });
const paths = [], calls = [];
mockModule('@vercel/blob', { put: async pathname => {
  paths.push(pathname); return { url: 'https://teststore.public.blob.vercel-storage.com/' + pathname };
} });
const upload = load('apps/web/src/app/api/properties/[id]/upload/route.ts');
const media = load('apps/web/src/app/api/properties/[id]/[resource]/route.ts');
const Page = load('apps/web/src/app/[locale]/panel/propiedades/[id]/page.tsx').default;
const Editor = load('apps/web/src/components/panel/ResourceEditor.tsx').default;
const NativeFormData = global.FormData, nativeFetch = global.fetch, nativeInput = global.HTMLInputElement;
const nativeBitmap = global.createImageBitmap, nativeDocument = global.document;
class Input { value = ''; }
global.HTMLInputElement = Input;
global.FormData = class extends NativeFormData {
  constructor(form) { super(); if (form) for (const [key, value] of Object.entries(form.values)) this.set(key, value); }
};
let defer = false, failNextUpload = false;
global.fetch = async (url, options) => {
  calls.push(url);
  if(failNextUpload&&url.endsWith('/upload')){failNextUpload=false;return new Response(JSON.stringify({code:'UPLOAD_FAILED'}),{status:500});}
  if (defer && url.endsWith('/upload')) {
    defer = false;
    return new Promise((resolve, reject) => options.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true }));
  }
  const [, id, resource] = url.match(/^\/api\/properties\/([^/]+)\/(upload|media)$/);
  const context = { params: Promise.resolve({ id: decodeURIComponent(id), resource }) };
  const request = new Request('http://localhost' + url, options);
  return resource === 'upload' ? upload.POST(request, context) : media.POST(request, context);
};
function find(node, predicate) {
  if (!node || typeof node !== 'object') return;
  if (predicate(node)) return node;
  for (const child of [node.props?.children].flat(Infinity)) { const result = find(child, predicate); if (result) return result; }
}
const mounted = new Map();
function render(propertyId, key) {
  instance = mounted.get(key) || { hooks: [], cleanup: [] };
  mounted.set(key, instance); index = 0;
  const tree = Editor({ propertyId, resource: 'media', items: [] });
  instance.tree=tree;
  const form = find(tree, node => node.type === 'form');
  form.props.ref.current = { values: { category: 'habitaciones', order: '7' }, elements: { namedItem: () => new Input() } };
  const input = find(tree, node => node.type === 'input' && node.props.type === 'file');
  input.props.ref.current = new Input();
  for (const effect of effects.splice(0)) instance.cleanup.push(effect());
  return input.props.onChange;
}
function unmount(key) { for (const cleanup of mounted.get(key).cleanup) cleanup?.(); mounted.delete(key); }
async function settle() { for (let i = 0; i < 30; i++) await new Promise(resolve => setImmediate(resolve)); }
async function main() {
  memory.prepare('UPDATE Property SET ownerId=? WHERE id=?').run('a', 'pb');
  setSession({ user: { id: 'a' } });
  const pageA = await Page({ params: Promise.resolve({ locale: 'es', id: 'pa' }) });
  const pageB = await Page({ params: Promise.resolve({ locale: 'es', id: 'pb' }) });
  assert.equal(pageA.key, 'pa'); assert.equal(pageB.key, 'pb');
  const selected = () => ({ currentTarget: { files: [new File(['photo'], 'photo.png', { type: 'image/png' })] } });
  render('pa', pageA.key)(selected()); await settle(); unmount(pageA.key);
  render('pb', pageB.key)(selected()); await settle(); unmount(pageB.key);
  assert.deepEqual(calls, ['/api/properties/pa/upload','/api/properties/pa/media','/api/properties/pb/upload','/api/properties/pb/media']);
  assert.match(paths[0], /^properties\/pa\//); assert.match(paths[1], /^properties\/pb\//);
  for (const id of ['pa','pb']) {
    const photo = memory.prepare('SELECT * FROM Media WHERE propertyId=?').get(id);
    assert.ok(photo.url.includes('/properties/'+id+'/')); assert.equal(photo.category,'habitaciones'); assert.equal(photo.order,7);
  }
  // Cambiar de propiedad mientras A sigue pendiente impide el POST Media tardío.
  calls.length = 0; paths.length = 0; defer = true;
  render('pa',pageA.key)(selected()); await settle(); unmount(pageA.key);
  render('pb',pageB.key)(selected()); await settle(); unmount(pageB.key);
  assert.deepEqual(calls, ['/api/properties/pa/upload','/api/properties/pb/upload','/api/properties/pb/media']);
  assert.equal(paths.length,1); assert.match(paths[0],/^properties\/pb\//);
  // Foto de cámara: el handler cliente envía el JPEG final, no los 8 MB originales.
  calls.length=0;paths.length=0;
  global.createImageBitmap=async()=>({width:4000,height:6000,close(){}});
  global.document={createElement:()=>({width:0,height:0,getContext:()=>({fillRect(){},drawImage(){}}),toBlob:callback=>callback(new Blob([new Uint8Array(450000)],{type:'image/jpeg'}))})};
  render('pb',pageB.key)({currentTarget:{files:[new File([new Uint8Array(8000000)],'camera.png',{type:'image/png'})]}});await settle();
  assert.deepEqual(calls,['/api/properties/pb/upload','/api/properties/pb/media']);assert.match(paths[0],/\.jpg$/);
  assert.ok(mounted.get(pageB.key).hooks.some(value=>value?.original===8&&value?.final===450));unmount(pageB.key);
  // Cola real: MIME inválido, tamaño final excesivo y fallo HTTP no frenan siguientes.
  calls.length=0;paths.length=0;failNextUpload=true;
  global.createImageBitmap=async file=>{if(file.name==='oversized.png')throw new Error('decode');return {width:4000,height:6000,close(){}};};
  const batch=[new File(['ok'],'http-fails.png',{type:'image/png'}),new File(['text'],'invalid.txt',{type:'text/plain'}),
    new File([new Uint8Array(5000000)],'oversized.png',{type:'image/png'}),
    new File([new Uint8Array(8000000)],'camera-queue.png',{type:'image/png'}),
    new File(['ok'],'last.png',{type:'image/png'})];
  const before=memory.prepare('SELECT count(*) n FROM Media WHERE propertyId=?').get('pb').n;
  const handler=render('pb',pageB.key);
  assert.equal(find(mounted.get(pageB.key).tree,node=>node.type==='input'&&node.props.type==='file').props.multiple,true);
  handler({currentTarget:{files:batch}});await settle();
  assert.deepEqual(calls,['/api/properties/pb/upload','/api/properties/pb/upload','/api/properties/pb/media','/api/properties/pb/upload','/api/properties/pb/media']);
  assert.equal(memory.prepare('SELECT count(*) n FROM Media WHERE propertyId=?').get('pb').n,before+2);
  assert.ok(mounted.get(pageB.key).hooks.some(value=>value?.success===2&&value?.failed===3));
  const failures=mounted.get(pageB.key).hooks.find(value=>Array.isArray(value)&&value[0]?.code);
  assert.deepEqual(failures.map(value=>[value.name,value.code]),[['http-fails.png','uploadFailed'],['invalid.txt','typeError'],['oversized.png','sizeError']]);
  for(const order of [10,11])assert.equal(memory.prepare('SELECT count(*) n FROM Media WHERE propertyId=? AND "order"=?').get('pb',order).n,1);
  unmount(pageB.key);
  // Abort de una cola A detiene todos los archivos pendientes y deja B independiente.
  calls.length=0;paths.length=0;defer=true;
  render('pa',pageA.key)({currentTarget:{files:[batch[0],batch[4]]}});await settle();unmount(pageA.key);
  render('pb',pageB.key)(selected());await settle();unmount(pageB.key);
  assert.deepEqual(calls,['/api/properties/pa/upload','/api/properties/pb/upload','/api/properties/pb/media']);
  for(const locale of ['es','en','fr']){
    const messages=require('../apps/web/messages/'+locale+'.json');const translate=req('next-intl').createTranslator({locale,messages,namespace:'photoUpload',onError:error=>{throw error;}});
    assert.ok(translate('queueProgress',{current:3,total:5,name:'camera.png'}).includes('camera.png'));
    assert.ok(translate('queueSummary',{success:2,failed:3}).includes('2'));
    assert.ok(translate('fileFailure',{name:'invalid.txt',error:translate('typeError')}).includes('invalid.txt'));
  }
  console.log('OK A→B: routes/pathnames/Media correctos, key por propiedad y cancelación de upload A pendiente. Sin red/Blob/Neon.');
}
main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => {
  global.FormData = NativeFormData; global.fetch = nativeFetch; global.HTMLInputElement = nativeInput; memory.close();
  global.createImageBitmap=nativeBitmap;global.document=nativeDocument;
});
