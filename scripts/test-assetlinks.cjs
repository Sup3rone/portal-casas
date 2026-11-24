// T-5243 (Task 9 del plan app-vendedor): /.well-known/assetlinks.json une el APK (TWA) con el dominio. Si Android lo
// valida, la app abre SIN barra de navegador. La huella del certificado sale de ANDROID_CERT_SHA256 (nunca del código);
// sin huella válida → 404, para no publicar un vínculo vacío o roto.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { load } = require('./test-property-access.cjs');

const root = path.join(__dirname, '..');
const route = load('apps/web/src/app/.well-known/assetlinks.json/route.ts');
const twa = JSON.parse(fs.readFileSync(path.join(root, 'android/twa-manifest.json'), 'utf8'));
const A = 'AB:'.repeat(31) + 'AB';
const B = '12:'.repeat(31) + '34';

(async () => {
  const call = async env => {
    const saved = process.env.ANDROID_CERT_SHA256;
    if (env === undefined) delete process.env.ANDROID_CERT_SHA256; else process.env.ANDROID_CERT_SHA256 = env;
    try { return await route.GET(); } finally { if (saved === undefined) delete process.env.ANDROID_CERT_SHA256; else process.env.ANDROID_CERT_SHA256 = saved; }
  };

  // Sin variable, vacía o basura → 404.
  for (const env of [undefined, '', '   ', 'no-es-una-huella', 'AB:CD']) assert.equal((await call(env)).status, 404, JSON.stringify(env));

  // Una huella (también en minúsculas y con espacios) → JSON con el paquete del APK.
  const one = await call(' ' + A.toLowerCase() + ' ');
  assert.equal(one.status, 200);
  assert.match(one.headers.get('content-type'), /application\/json/);
  const body = await one.json();
  assert.deepEqual(body, [{ relation: ['delegate_permission/common.handle_all_urls'], target: { namespace: 'android_app', package_name: twa.packageId, sha256_cert_fingerprints: [A] } }]);

  // Dos huellas (llave propia + la de Google Play si algún día se sube allá); las inválidas se ignoran.
  const two = await (await call(`${A}, basura ,${B}`)).json();
  assert.deepEqual(two[0].target.sha256_cert_fingerprints, [A, B]);
  console.log('assetlinks OK');

  // El APK apunta a producción y entra por /es/app, igual que la PWA.
  assert.equal(route.ANDROID_PACKAGE, twa.packageId);
  assert.match(twa.packageId, /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/);
  assert.equal(twa.host, 'aliaforrent.vercel.app');
  assert.equal(twa.startUrl, '/es/app');
  assert.equal(twa.webManifestUrl, 'https://aliaforrent.vercel.app/manifest.webmanifest');
  assert.equal(twa.display, 'standalone');
  // Sin Chrome compatible (LineageOS sin Google, Huawei…): WebView dentro de la app, sin barra; no un navegador con URL.
  assert.equal(twa.fallbackType, 'webview');
  assert.ok(!JSON.stringify(twa).match(/password/i), 'sin contraseñas en el manifest');

  // La llave nunca se versiona; el proyecto Android que genera Bubblewrap tampoco.
  const ignore = fs.readFileSync(path.join(root, '.gitignore'), 'utf8');
  assert.ok(/android\/\*/.test(ignore) && /!android\/twa-manifest\.json/.test(ignore) && /\*\.keystore/.test(ignore), '.gitignore');
  const workflow = fs.readFileSync(path.join(root, '.github/workflows/build-android.yml'), 'utf8');
  for (const secret of ['ANDROID_KEYSTORE_BASE64', 'ANDROID_KEYSTORE_PASSWORD']) assert.ok(workflow.includes('secrets.' + secret), secret);
  assert.ok(workflow.includes('workflow_dispatch') && workflow.includes("'app-v*'"));
  // proxy: la ruta lleva punto → no pasa por idioma ni sesión.
  const pattern = fs.readFileSync(path.join(root, 'apps/web/src/proxy.ts'), 'utf8').match(/matcher:\s*\['([^']+)'\]/)[1].replace(/\\\\/g, '\\');
  assert.ok(!new RegExp('^' + pattern.replace('/((?!', '/(?!').replace(/\)\.\*\)$/, ').*') + '$').test('/.well-known/assetlinks.json'));
  console.log('twa-manifest, .gitignore, workflow y proxy OK');
})().catch(error => { console.error(error); process.exit(1); });
