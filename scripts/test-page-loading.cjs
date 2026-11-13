// T-4835: carga al navegar (PageLoading) y primera carga (SiteIntro): SSR, reglas y CSS. Sin red.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { createRequire } = require('node:module');
const { load, req, memory, mockModule } = require('./test-property-access.cjs');
const React = req('react');
const { renderToStaticMarkup } = req('react-dom/server');
const postcss = createRequire(req.resolve('@tailwindcss/postcss'))('postcss');

// --- Cambio de página: el emblema al centro, sobre papel, oculto a lectores de pantalla. ---
const Loading = load('apps/web/src/components/PageLoading.tsx').default;
for (const variant of ['home', 'list', 'detail']) {
  const html = renderToStaticMarkup(React.createElement(Loading, { variant }));
  assert.ok(html.includes('aria-busy="true"') && html.includes('aria-hidden="true"'));
  assert.ok(html.includes('loading-emblem') && html.includes('public-paper'), 'Emblema sobre papel');
  assert.ok(!html.includes('animate-pulse') && !/\bblock"/.test(html), 'Sin esqueletos');
}
const css = postcss.parse(fs.readFileSync('apps/web/src/components/PageLoading.module.css', 'utf8'));
function motionOnly(node) {
  let parent = node.parent;
  while (parent && !(parent.type === 'atrule' && parent.name === 'media' && parent.params === '(prefers-reduced-motion: no-preference)')) parent = parent.parent;
  assert.ok(parent, 'Toda animación queda dentro de no-preference');
}
css.walkAtRules('keyframes', motionOnly);
css.walkDecls('animation', motionOnly);
const rule = selector => { let found; css.walkRules(selector, r => { if (r.parent.type === 'atrule' && r.parent.params === '(prefers-reduced-motion: no-preference)') found = r; }); return found; };
assert.equal(rule('.content').nodes.find(node => node.prop === 'animation').value, 'content-arrival 200ms ease-out');
assert.match(rule('.emblem').nodes.find(node => node.prop === 'animation').value, / 150ms both$/, 'Solo se ve si la carga pasa de 150 ms');
assert.ok(!/#(?:[a-f\d]{3}){1,2}\b/i.test(css.toString()));
for (const file of ['apps/web/src/app/[locale]/page.tsx','apps/web/src/app/[locale]/casas/page.tsx','apps/web/src/app/[locale]/casas/[slug]/page.tsx']) {
  const source = fs.readFileSync(file,'utf8'); assert.ok(source.includes('${loadingStyles.content}'));
}

// --- Primera carga: solo rutas públicas con papel; una vez por visita. ---
const { SITE_INTRO_PATH, SITE_INTRO_SKIP, SITE_INTRO_KEY, SITE_INTRO_SEEN_CLASS } = load('apps/web/src/lib/site-intro.ts');
for (const path of ['/', '/es', '/es/', '/en/casas', '/fr/casas/', '/es/casas/del-canto-vallarta']) assert.ok(SITE_INTRO_PATH.test(path), path);
for (const path of ['/es/panel', '/es/panel/reservas', '/es/admin/calendario', '/es/login', '/es/mi-cuenta', '/es/registro', '/es/casas/a/b']) assert.ok(!SITE_INTRO_PATH.test(path), path);
// El script en línea: con la marca guardada oculta la animación; sin ella, no toca nada; sin storage, no rompe.
const run = storage => { const classes = new Set(); new Function('sessionStorage', 'document', SITE_INTRO_SKIP)(storage, { documentElement: { classList: { add: c => classes.add(c) } } }); return classes; };
assert.ok(run({ getItem: key => key === SITE_INTRO_KEY ? '1' : null }).has(SITE_INTRO_SEEN_CLASS));
assert.equal(run({ getItem: () => null }).size, 0);
assert.equal(run({ getItem: () => { throw new Error('bloqueado'); } }).size, 0);
const layout = fs.readFileSync('apps/web/src/app/[locale]/layout.tsx', 'utf8');
assert.ok(layout.indexOf('SITE_INTRO_SKIP }} />') < layout.indexOf('<SiteIntro />'), 'El script va antes de la animación');

mockModule('next/font/google', { Marcellus: () => ({ variable: 'font-logo' }) });
let pathname = '/es';
mockModule('next/navigation', { usePathname: () => pathname });
const SiteIntro = load('apps/web/src/components/SiteIntro.tsx').default;
const intro = renderToStaticMarkup(React.createElement(SiteIntro));
assert.ok(intro.includes('class="site-intro font-logo"') && intro.includes('aria-hidden="true"'));
assert.ok(intro.includes('site-intro-emblem'));
assert.equal((intro.match(/--i:/g) || []).length, 11, 'ALIA FOR RENT: 11 letras animadas');
assert.equal((intro.match(/site-intro-for/g) || []).length, 3, 'FOR en el tono apagado del header');
pathname = '/es/panel';
assert.equal(renderToStaticMarkup(React.createElement(SiteIntro)), '', 'El panel no muestra la animación');

// CSS: oculta si ya se vio, nunca bloquea clics, termina invisible y respeta reduced-motion.
const loader = fs.readFileSync('apps/web/src/app/site-loader.css', 'utf8');
assert.ok(loader.includes('html.alia-intro-seen .site-intro { display: none; }'));
assert.ok(/\.site-intro \{[^}]*pointer-events: none;/.test(loader));
assert.ok(/site-intro-gone 150ms linear 1650ms forwards/.test(loader), 'Termina a los 1.8 s aunque no se anime el círculo');
assert.ok(/@media \(prefers-reduced-motion: reduce\) \{\s*\.site-intro \{[^}]*animation: site-intro-gone 200ms/.test(loader));
assert.ok(fs.readFileSync('apps/web/src/app/globals.css', 'utf8').includes('@import "./site-loader.css";'));
assert.ok(fs.statSync('apps/web/public/brand/alia-spiral-emblem-mask.webp').size < 20_000, 'Máscara ligera, no el PNG de 454 KB');

memory.close();
console.log('OK carga: emblema al navegar (150 ms, sin esqueletos); primera carga solo en rutas públicas, una vez por visita, sin bloquear clics y con reduced-motion.');
