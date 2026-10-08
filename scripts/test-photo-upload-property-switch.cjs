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
class Input { value = ''; }
global.HTMLInputElement = Input;
global.FormData = class extends NativeFormData {
  constructor(form) { super(); if (form) for (const [key, value] of Object.entries(form.values)) this.set(key, value); }
};
let defer = false;
global.fetch = async (url, options) => {
  calls.push(url);
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
  console.log('OK A→B: routes/pathnames/Media correctos, key por propiedad y cancelación de upload A pendiente. Sin red/Blob/Neon.');
}
main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => {
  global.FormData = NativeFormData; global.fetch = nativeFetch; global.HTMLInputElement = nativeInput; memory.close();
});
