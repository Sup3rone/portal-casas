// Header real con sesión simulada; sin red, login ni BD.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { createRequire } = require('node:module');
const req = createRequire(path.resolve(__dirname, '../apps/web/package.json'));
const ts = req('typescript'), React = req('react');
const { renderToStaticMarkup } = req('react-dom/server');
const { NextIntlClientProvider } = req('next-intl');
let role, locale, menuOpen = false, testPath = '/';
const cache = new Map();
function load(file) {
  if (cache.has(file)) return cache.get(file);
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(path.resolve(__dirname, '..', file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  new Function('require', 'exports', code)(name => {
    if (name === 'react' && file.endsWith('/Navbar.tsx')) return {...React, useState: initial => React.useState(menuOpen || initial)};
    if (name === 'next-auth/react') return { useSession: () => ({ data: role ? { user: { role } } : null, status: role ? 'authenticated' : 'unauthenticated' }), signOut() {} };
    if (name === '@/i18n/navigation') return { usePathname: () => testPath, Link: ({ href, ...props }) => React.createElement('a', { ...props, href: `/${locale}${href}` }) };
    if (name === 'next/navigation') return { useRouter: () => ({ push() {} }), usePathname: () => `/${locale}` };
    if (name === '@/lib/theme') return { getServerTheme: () => 'light', getTheme: () => 'light', getStoredTheme: () => 'light', subscribeTheme: () => () => {}, applyTheme() {} };
    if (name.startsWith('./')) return load(`apps/web/src/components/${name.slice(2)}.tsx`);
    return req(name);
  }, exports);
  cache.set(file, exports); return exports;
}
function renderNavbar(selectedRole, selectedLocale, open = false, pathname = '/') {
  testPath = pathname;
  menuOpen = open;
  role = selectedRole; locale = selectedLocale;
  const messages = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../apps/web/messages/' + locale + '.json'), 'utf8'));
  const Navbar = load('apps/web/src/components/Navbar.tsx').default;
  return renderToStaticMarkup(React.createElement(NextIntlClientProvider, { locale, messages, timeZone: 'America/Mexico_City', onError(e) { throw e; } }, React.createElement(Navbar)));
}
if (require.main === module) {
  for (const locale of ['es', 'en', 'fr']) for (const role of ['ADMIN', 'COLLABORATOR', 'CLIENT', 'VIEWER', null]) {
    const closed = renderNavbar(role, locale);
    assert.ok(closed.includes('aria-expanded="false"'));
    assert.ok(closed.includes('public-header'));
    for(const privatePath of ['/panel','/admin/tarifas']) assert.ok(!renderNavbar(role,locale,false,privatePath).includes('public-header'));
    renderNavbar(role,locale);
    assert.ok(!closed.includes('href="/'+locale+'/casas"'));
    assert.ok(!closed.includes('<form'));
    assert.ok(!closed.includes('🇪🇸'));
    assert.ok(!closed.includes('🇬🇧'));
    assert.ok(!closed.includes('🇫🇷'));
    assert.ok(!closed.includes('href="/'+locale+'/login"'));
    const html = renderNavbar(role, locale, true);
    assert.ok(html.includes('aria-expanded="true"'));
    assert.ok(html.includes('action="/'+locale+'/casas"'));
    assert.ok(html.includes('method="GET"'));
    for(const name of ['start','end','guests']) assert.ok(html.includes('name="'+name+'"'));
    assert.equal((html.match(/<form/g)||[]).length,1);
    const messages = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../apps/web/messages/' + locale + '.json'), 'utf8'));
    const manager = role === 'ADMIN' || role === 'COLLABORATOR';
    assert.equal((html.match(new RegExp(`href="/${locale}/panel"`, 'g')) || []).length, manager ? 1 : 0);
    if (manager) assert.ok(html.includes(messages.nav[role === 'ADMIN' ? 'panelAdmin' : 'panelCollaborator']));
    assert.equal(html.includes('href="/'+locale+'/login"'), !role);
    assert.equal(html.includes('href="/'+locale+'/registro"'), !role);
    assert.equal(html.includes('href="/'+locale+'/mi-cuenta"'), Boolean(role));
    assert.ok(!html.includes('/admin/')); assert.ok(!html.includes('group-hover:'));
  }
  console.log('OK: un único acceso al panel por rol, rutas localizadas es/en/fr y sin desplegable ADMIN. Sin red ni BD.');
}
module.exports = { renderNavbar };
