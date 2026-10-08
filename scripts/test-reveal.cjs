// HTML SSR y lifecycle real de Reveal con IntersectionObserver/matchMedia simulados.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { load, req, mockModule, memory } = require('./test-property-access.cjs');
const React = req('react'), { renderToStaticMarkup } = req('react-dom/server');
const Reveal = load('apps/web/src/components/Reveal.tsx').default;
const html = renderToStaticMarkup(React.createElement(Reveal, { as: 'section', className: 'test', delay: 80, distance: 32 }, React.createElement('h1', null, 'Contenido SSR')));
assert.ok(html.startsWith('<section'));
assert.ok(html.includes('Contenido SSR'));
assert.ok(html.includes('class="reveal test"'));
assert.ok(html.includes('--reveal-distance:32px') && html.includes('--reveal-delay:80ms'));
assert.ok(renderToStaticMarkup(React.createElement(Reveal, null, 'SSR')).includes('--reveal-distance:24px'));

let pathname = '/casas';
mockModule('@/i18n/navigation', { usePathname: () => pathname, Link: ({ children, ...props }) => React.createElement('a', props, children) });
const Footer = load('apps/web/src/components/Footer.tsx').default;
const { NextIntlClientProvider } = req('next-intl');
for (const locale of ['es', 'en', 'fr']) {
  const messages = JSON.parse(fs.readFileSync(path.join(__dirname, '../apps/web/messages', locale + '.json'), 'utf8'));
  const renderFooter = () => renderToStaticMarkup(React.createElement(NextIntlClientProvider, { locale, messages, timeZone: 'America/Mexico_City' }, React.createElement(Footer)));
  pathname = `/${locale}/casas`; assert.ok(renderFooter().includes('class="reveal '));
  for (pathname of [`/${locale}/panel`, '/panel/propiedades/pa', `/${locale}/admin/calendario`]) assert.ok(!renderFooter().includes('class="reveal '));
}

let effects = [], element;
mockModule('react', { ...React, useRef: () => ({ current: element }), useEffect: effect => effects.push(effect) });
const Interactive = load('apps/web/src/components/Reveal-interactive.tsx', fs.readFileSync(path.join(__dirname, '../apps/web/src/components/Reveal.tsx'), 'utf8')).default;
const nativeWindow = global.window, nativeObserver = global.IntersectionObserver;
try {
  function mount({ reduced = false, supported = true } = {}) {
    const classes = new Set(), listeners = new Set(), instances = [];
    element = { classList: { add: value => classes.add(value) } };
    const motion = { matches: reduced, addEventListener: (_, listener) => listeners.add(listener), removeEventListener: (_, listener) => listeners.delete(listener) };
    class Observer {
      constructor(callback, options) { this.callback = callback; this.options = options; this.disconnected = 0; instances.push(this); }
      observe(target) { this.target = target; }
      disconnect() { this.disconnected++; }
    }
    global.IntersectionObserver = Observer;
    global.window = { matchMedia: () => motion, ...(supported ? { IntersectionObserver: Observer } : {}) };
    effects = []; Interactive({ children: 'Siempre SSR' });
    const cleanup = effects[0]();
    return { classes, listeners, instances, motion, cleanup };
  }
  const observed = mount();
  assert.equal(observed.instances.length, 1);
  const observer = observed.instances[0];
  assert.equal(observer.target, element);
  observer.callback([{ isIntersecting: true, intersectionRatio: 0.15 }]);
  assert.equal(observed.classes.has('reveal-visible'), false);
  observer.callback([{ isIntersecting: true, intersectionRatio: 0.2 }]);
  assert.equal(observed.classes.has('reveal-visible'), true);
  assert.equal(observer.disconnected, 1);
  assert.equal(observed.listeners.size, 0);
  observed.cleanup();
  const reduced = mount({ reduced: true });
  assert.equal(reduced.instances.length, 0); assert.ok(reduced.classes.has('reveal-visible'));
  const unsupported = mount({ supported: false });
  assert.equal(unsupported.instances.length, 0); assert.ok(unsupported.classes.has('reveal-visible'));
  const changed = mount(); changed.motion.matches = true;
  for (const listener of [...changed.listeners]) listener();
  assert.ok(changed.classes.has('reveal-visible')); assert.equal(changed.instances[0].disconnected, 1);
  changed.cleanup();
  const css = fs.readFileSync(path.join(__dirname, '../apps/web/src/app/globals.css'), 'utf8');
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)\s*\{\s*\.reveal\s*\{[^}]*opacity: 1;[^}]*transform: none;[^}]*transition: none;/);
  console.log('OK Reveal: SSR, props, umbral >15%, disconnect, reduced-motion, fallback y footer sin reveal en panel/admin es/en/fr.');
} finally { global.window = nativeWindow; global.IntersectionObserver = nativeObserver; memory.close(); }
