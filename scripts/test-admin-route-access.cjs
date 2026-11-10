// T-4719: el proxy deja al colaborador entrar a /admin/mensajes y /admin/tarifas
// (enlaces de su menú) y mantiene el resto de /admin solo para ADMIN.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { load } = require('./test-property-access.cjs');
const { adminRouteAllowed } = load('apps/web/src/lib/admin-route-access.ts');

for (const locale of ['es', 'en', 'fr']) {
  for (const path of ['/admin/mensajes', '/admin/tarifas', '/admin/tarifas/']) {
    assert.equal(adminRouteAllowed(`/${locale}${path}`, 'COLLABORATOR'), true, `colaborador en ${locale}${path}`);
    assert.equal(adminRouteAllowed(`/${locale}${path}`, 'ADMIN'), true);
    for (const role of ['CLIENT', undefined]) assert.equal(adminRouteAllowed(`/${locale}${path}`, role), false, `${role} fuera de ${path}`);
  }
  for (const path of ['/admin', '/admin/', '/admin/calendario', '/admin/mensajes-falsos', '/admin/usuarios/x']) {
    assert.equal(adminRouteAllowed(`/${locale}${path}`, 'COLLABORATOR'), false, `colaborador fuera de ${locale}${path}`);
    assert.equal(adminRouteAllowed(`/${locale}${path}`, 'ADMIN'), true, `admin en ${locale}${path}`);
  }
}
for (const path of ['/es', '/es/panel', '/es/administrar', '/de/admin/mensajes', '/admin/mensajes']) assert.equal(adminRouteAllowed(path, 'CLIENT'), null, `${path} no es ruta admin`);

// Cada enlace /admin del menú del colaborador apunta a una sección permitida.
const layout = fs.readFileSync('apps/web/src/app/[locale]/panel/layout.tsx', 'utf8');
const collaboratorBlock = layout.slice(layout.indexOf("manager.role === 'COLLABORATOR' && <>"), layout.indexOf('</>}'));
const adminLinks = [...collaboratorBlock.matchAll(/href="(\/admin\/[^"]+)"/g)].map(m => m[1]);
assert.deepEqual(adminLinks.sort(), ['/admin/mensajes', '/admin/tarifas']);
for (const href of adminLinks) assert.equal(adminRouteAllowed(`/es${href}`, 'COLLABORATOR'), true, href);

// Las páginas abiertas al colaborador validan y filtran en servidor; calendario sigue con requireAdmin.
for (const file of ['mensajes/page.tsx', 'tarifas/page.tsx', 'tarifas/actions.ts']) {
  const source = fs.readFileSync(`apps/web/src/app/[locale]/admin/${file}`, 'utf8');
  assert.match(source, /requirePropertyManager\(\)/, file); assert.match(source, /managedResource|managedProperties/, file);
}
assert.match(fs.readFileSync('apps/web/src/app/[locale]/admin/calendario/page.tsx', 'utf8'), /requireAdmin\(\)/);
assert.match(fs.readFileSync('apps/web/src/proxy.ts', 'utf8'), /adminRouteAllowed\(pathname, session\?\.user\?\.role\) === false/);
console.log('OK proxy /admin: colaborador en mensajes/tarifas, resto solo ADMIN.');
