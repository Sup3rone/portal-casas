// Bootstrap y persistencia reales con DOM/storage simulados; sin red ni BD.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const req = createRequire(path.resolve(__dirname, '../apps/web/package.json'));
const ts = req('typescript');
const compile = file => ts.transpileModule(fs.readFileSync(path.resolve(__dirname, '..', file), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
function fixture(saved, blocked = false) {
  const classes = new Set(['font-ready', 'dark']), storage = new Map(), listeners = new Map();
  if (saved !== undefined) storage.set('portal-casas-theme', saved);
  const context = {
    exports: {}, Event,
    document: { documentElement: { classList: { add: value => classes.add(value), remove: (...values) => values.forEach(value => classes.delete(value)), contains: value => classes.has(value) } } },
    localStorage: { getItem: key => { if (blocked) throw new Error('Blocked'); return storage.get(key) ?? null; }, setItem: (key, value) => { if (blocked) throw new Error('Blocked'); storage.set(key, value); } },
    window: { addEventListener: (key, callback) => listeners.set(key, callback), removeEventListener: key => listeners.delete(key), dispatchEvent: event => listeners.get(event.type)?.() },
  };
  vm.runInNewContext(compile('apps/web/src/lib/theme.ts'), context);
  const theme = context.exports;
  const boot = () => vm.runInNewContext(fs.readFileSync(path.resolve(__dirname, '../apps/web/public/theme-init.js'), 'utf8'), context);
  return { theme, boot, classes, storage };
}
for (const [saved, expected] of [[undefined, 'light'], ['light', 'light'], ['dark', 'dark'], ['system', 'light'], ['invalid', 'light']]) {
  const f = fixture(saved); f.boot();
  assert.equal(f.theme.getTheme(), expected); assert.ok(f.classes.has('font-ready'));
  assert.equal(f.theme.getStoredTheme(), expected);
  assert.equal(f.classes.has('light') && f.classes.has('dark'), false);
}
for (const blocked of [false, true]) {
  const f = fixture(undefined, blocked); f.boot();
  let notifications = 0; const unsubscribe = f.theme.subscribeTheme(() => notifications++);
  f.theme.applyTheme('light'); assert.equal(f.theme.getTheme(), 'light'); assert.equal(notifications, 1);
  if (!blocked) {
    assert.equal(f.storage.get(f.theme.themeStorageKey), 'light'); f.boot(); assert.equal(f.theme.getTheme(), 'light');
    f.classes.delete('light'); f.classes.add('dark');
    f.theme.applyTheme(f.theme.getStoredTheme()); assert.equal(f.theme.getTheme(), 'light');
  }
  else { f.boot(); assert.equal(f.theme.getTheme(), 'light'); }
  f.theme.applyTheme('dark'); assert.equal(f.theme.getTheme(), 'dark'); assert.equal(f.classes.has('light'), false);
  if (!blocked) { f.boot(); assert.equal(f.theme.getTheme(), 'dark'); }
  const beforeUnsubscribe = notifications;
  unsubscribe(); f.theme.applyTheme('light'); assert.equal(notifications, beforeUnsubscribe);
}
const theme = fixture().theme;
assert.equal(theme.getServerTheme(), 'light');
const noClass = fixture(); noClass.classes.delete('dark');
assert.equal(noClass.theme.getTheme(), 'light');
const toggleModule = { exports: {} };
new Function('require', 'exports', compile('apps/web/src/components/ThemeToggle.tsx'))(name => name === '@/lib/theme' ? theme : req(name), toggleModule.exports);
const React = req('react'), { renderToStaticMarkup } = req('react-dom/server'), { NextIntlClientProvider } = req('next-intl');
for (const locale of ['es', 'en', 'fr']) {
  const messages = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../apps/web/messages/' + locale + '.json'), 'utf8'));
  const html = renderToStaticMarkup(React.createElement(NextIntlClientProvider, { locale, messages, timeZone: 'America/Mexico_City', onError(error) { throw error; } }, React.createElement(toggleModule.exports.default)));
  assert.ok(html.includes(messages.theme.dark)); assert.ok(html.includes('type="button"')); assert.ok(html.includes('aria-hidden="true"'));
}
console.log('OK: claro inicial, light/dark exclusivos, persistencia/reinicio, storage bloqueado, suscripción y toggle es/en/fr. Sin red ni BD.');
