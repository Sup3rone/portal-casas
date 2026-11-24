// T-5213 (Task 8 del plan app-vendedor): PWA instalable. Offline: el manifest (campos e iconos que existen en public/)
// y el service worker ejecutado en un sandbox con caches/fetch simulados. Regla central: lo que es DATO (panel, api,
// cualquier página) va siempre a la red; sin red, una navegación cae en /offline.html; solo lo estático se cachea.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { load } = require('./test-property-access.cjs');

const root = path.join(__dirname, '..');
const pub = file => path.join(root, 'apps/web/public', file.replace(/^\//, ''));

(async () => {
  // 1) Manifest: entra por /es/app (T-5210 decide modo y marca la app), standalone, iconos any + maskable.
  const manifest = load('apps/web/src/app/manifest.ts').default();
  assert.equal(manifest.id, '/es/app');
  assert.equal(manifest.start_url, '/es/app');
  assert.equal(manifest.scope, '/');
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.background_color, '#F4F1EC', 'paleta paper del panel');
  assert.ok(manifest.name && manifest.short_name && manifest.short_name.length <= 12);
  const sizes = purpose => manifest.icons.filter(icon => (icon.purpose ?? 'any') === purpose).map(icon => icon.sizes);
  assert.deepEqual(sizes('any').sort(), ['192x192', '512x512']);
  assert.deepEqual(sizes('maskable'), ['512x512']);
  for (const icon of manifest.icons) {
    assert.ok(fs.existsSync(pub(icon.src)), 'existe ' + icon.src);
    const png = fs.readFileSync(pub(icon.src));
    const [w, h] = [png.readUInt32BE(16), png.readUInt32BE(20)];
    assert.equal(`${w}x${h}`, icon.sizes, icon.src + ' mide lo que dice');
  }
  assert.ok(fs.existsSync(path.join(root, 'apps/web/src/app/apple-icon.png')), 'icono de iPhone');
  assert.ok(fs.existsSync(pub('/offline.html')));
  console.log('manifest OK');

  // 2) Service worker en sandbox.
  const source = fs.readFileSync(pub('/sw.js'), 'utf8');
  const origin = 'https://alia.test';
  const stores = new Map();
  const cacheFor = name => {
    if (!stores.has(name)) stores.set(name, new Map());
    const store = stores.get(name);
    return {
      match: async req => store.get(typeof req === 'string' ? new URL(req, origin).href : req.url),
      put: async (req, res) => { store.set(typeof req === 'string' ? new URL(req, origin).href : req.url, res); },
      addAll: async urls => { for (const u of urls) store.set(new URL(u, origin).href, { body: 'pre:' + u, ok: true }); },
    };
  };
  const caches = {
    open: async name => cacheFor(name),
    keys: async () => [...stores.keys()],
    delete: async name => stores.delete(name),
    match: async req => { for (const name of stores.keys()) { const hit = await cacheFor(name).match(req); if (hit) return hit; } },
  };
  let online = true;
  const fetched = [];
  const fetch = async req => {
    fetched.push(req.url);
    if (!online) throw new TypeError('Failed to fetch');
    return { body: 'net:' + req.url, ok: true, clone() { return { body: this.body, ok: true }; } };
  };
  const listeners = {};
  const self = { location: new URL(origin + '/sw.js'), addEventListener: (type, fn) => { listeners[type] = fn; }, skipWaiting: async () => {}, clients: { claim: async () => {} } };
  vm.runInNewContext(source, { self, caches, fetch, URL, Promise, console });
  for (const type of ['install', 'activate', 'fetch']) assert.equal(typeof listeners[type], 'function', 'escucha ' + type);

  const lifecycle = async type => { let p; listeners[type]({ waitUntil: x => { p = x; } }); await p; };
  stores.set('alia-static-v0', new Map()); // caché de una versión vieja
  stores.set('otra-app', new Map());       // de otra cosa del mismo origen: no se toca
  await lifecycle('install');
  await lifecycle('activate');
  const names = [...stores.keys()];
  const current = names.find(name => name.startsWith('alia-static-'));
  assert.ok(/^alia-static-v\d+$/.test(current) && current !== 'alia-static-v0', 'caché versionado: ' + names);
  assert.ok(!names.includes('alia-static-v0'), 'borra la versión vieja');
  assert.ok(names.includes('otra-app'), 'no borra cachés ajenos');
  assert.ok(await cacheFor(current).match('/offline.html'), 'precachea offline.html');

  const request = (url, { mode = 'no-cors', method = 'GET' } = {}) => ({ url: new URL(url, origin).href, mode, method });
  const dispatch = async req => { let p = null; listeners.fetch({ request: req, respondWith: x => { p = x; } }); return p === null ? 'browser' : await p; };

  // Datos: nunca desde caché. Con red, al navegador o a la red; sin red, navegación → offline.html.
  for (const url of ['/es/panel/vender', '/es/panel/vender/abc/cotizar', '/es/app', '/es/casas', '/']) {
    online = true;
    const res = await dispatch(request(url, { mode: 'navigate' }));
    assert.ok(res === 'browser' || res.body === 'net:' + new URL(url, origin).href, url + ' con red viene de la red');
    online = false;
    assert.equal((await dispatch(request(url, { mode: 'navigate' }))).body, 'pre:/offline.html', url + ' sin red → offline');
  }
  online = true;
  for (const url of ['/api/properties', '/api/panel/vender/hold', '/es/panel/vender?_rsc=1']) {
    assert.equal(await dispatch(request(url, { mode: 'cors' })), 'browser', url + ' lo resuelve el navegador, sin caché');
  }
  assert.equal(await dispatch(request('/api/x', { method: 'POST', mode: 'cors' })), 'browser', 'POST nunca pasa por el SW');
  assert.equal(await dispatch(request('https://maps.googleapis.com/x.js')), 'browser', 'otros orígenes no se tocan');
  for (const store of stores.values()) for (const key of store.keys()) assert.ok(!/\/(api|es\/panel)\//.test(key) && !key.endsWith('/es/app'), 'no se guardó un dato: ' + key);

  // Estáticos: primera vez de la red y se guardan; después, de caché aunque no haya red.
  const asset = '/_next/static/chunks/app-abc123.js';
  online = true;
  fetched.length = 0;
  assert.equal((await dispatch(request(asset))).body, 'net:' + origin + asset);
  online = false;
  assert.equal((await dispatch(request(asset))).body, 'net:' + origin + asset, 'de caché sin red');
  assert.deepEqual(fetched, [origin + asset], 'la segunda vez no fue a la red');
  online = true;
  for (const url of ['/icon-192.png', '/brand/alia-spiral-emblem.png']) assert.notEqual(await dispatch(request(url)), 'browser', url + ' se cachea');
  console.log('service worker OK');

  // 3) Registro: solo en producción y desde el panel; nada de SW en desarrollo (los chunks de dev no llevan hash).
  const register = fs.readFileSync(path.join(root, 'apps/web/src/components/panel/RegisterServiceWorker.tsx'), 'utf8');
  assert.ok(register.includes("'/sw.js'") && register.includes("process.env.NODE_ENV !== 'production'"));
  const layout = fs.readFileSync(path.join(root, 'apps/web/src/app/[locale]/panel/layout.tsx'), 'utf8');
  assert.ok(layout.includes('<RegisterServiceWorker />'));
  // proxy: /manifest.webmanifest, /sw.js y /offline.html llevan punto → fuera del matcher (sin sesión ni idioma).
  const proxySource = fs.readFileSync(path.join(root, 'apps/web/src/proxy.ts'), 'utf8');
  const pattern = proxySource.match(/matcher:\s*\['([^']+)'\]/)[1].replace(/\\\\/g, '\\');
  const matcher = new RegExp('^' + pattern.replace('/((?!', '/(?!').replace(/\)\.\*\)$/, ').*') + '$');
  for (const url of ['/manifest.webmanifest', '/sw.js', '/offline.html', '/icon-192.png']) assert.ok(!matcher.test(url), url + ' no pasa por el proxy');
  assert.ok(matcher.test('/es/app'), '/es/app sí');
  const csp = JSON.parse(fs.readFileSync(path.join(root, 'apps/web/vercel.json'), 'utf8')).headers[0].headers.find(h => h.key.startsWith('Content-Security-Policy')).value;
  assert.ok(/worker-src 'self'/.test(csp) && /manifest-src 'self'/.test(csp), 'CSP');
  console.log('registro, proxy y CSP OK');
  console.log('test-pwa OK');
})().catch(error => { console.error(error); process.exit(1); });
