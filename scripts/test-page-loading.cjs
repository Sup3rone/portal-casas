const assert = require('node:assert/strict');
const fs = require('node:fs');
const { createRequire } = require('node:module');
const { load, req, memory } = require('./test-property-access.cjs');
const React = req('react');
const { renderToStaticMarkup } = req('react-dom/server');
const postcss = createRequire(req.resolve('@tailwindcss/postcss'))('postcss');
const Loading = load('apps/web/src/components/PageLoading.tsx').default;
for (const [variant, blocks] of [['home', 6], ['list', 13], ['detail', 6]]) {
  const html = renderToStaticMarkup(React.createElement(Loading, { variant }));
  assert.equal((html.match(/\bblock"/g) || []).length, blocks);
  assert.ok(html.includes('aria-busy="true"') && html.includes('aria-hidden="true"'));
  assert.ok(!html.includes('animate-pulse'));
}
const css = postcss.parse(fs.readFileSync('apps/web/src/components/PageLoading.module.css', 'utf8'));
function motionOnly(node) {
  let parent = node.parent;
  while (parent && !(parent.type === 'atrule' && parent.name === 'media' && parent.params === '(prefers-reduced-motion: no-preference)')) parent = parent.parent;
  assert.ok(parent, 'Toda animación queda dentro de no-preference');
}
css.walkAtRules('keyframes', motionOnly);
css.walkDecls('animation', motionOnly);
const rules = selector => css.nodes.flatMap(node => node.nodes || []).find(node => node.selector === selector);
assert.equal(rules('.content').nodes.find(node => node.prop === 'animation').value, 'content-arrival 200ms ease-out');
assert.equal(rules('.block::after').nodes.find(node => node.prop === 'animation').value, 'shimmer 1.8s linear infinite');
assert.ok(!/#(?:[a-f\d]{3}){1,2}\b/i.test(css.toString()));
for (const file of ['apps/web/src/app/[locale]/page.tsx','apps/web/src/app/[locale]/casas/page.tsx','apps/web/src/app/[locale]/casas/[slug]/page.tsx']) {
  const source = fs.readFileSync(file,'utf8'); assert.ok(source.includes('${loadingStyles.content}'));
}
memory.close();
console.log('OK carga: tres variantes SSR, bloques shimmer, aria, sin pulse, tokens y animaciones restringidas a no-preference; fade 200ms solo contenido.');
