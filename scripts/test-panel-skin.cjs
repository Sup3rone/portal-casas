// Contraste de los tokens y aislamiento del skin, sin navegador ni BD.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const req = createRequire(path.resolve(__dirname, '../apps/web/package.json'));
const postcss = createRequire(req.resolve('@tailwindcss/postcss'))('postcss');
const css = postcss.parse(fs.readFileSync(path.resolve(__dirname, '../apps/web/src/app/panel-skin.css'), 'utf8'));
const light = {}, dark = {};
const paper = {};
css.walkRules(rule => {
  assert.ok(rule.selectors.every(selector => selector.includes('.panel-skin')), 'Sin selectores públicos/globales');
  if (rule.selector === '.panel-skin' || rule.selector === 'html.dark .panel-skin') {
    rule.walkDecls(decl => { (rule.selector.startsWith('html.dark') ? dark : light)[decl.prop] = decl.value; });
  }
  if (rule.selector === 'html .panel-skin[data-panel-palette="paper"]') rule.walkDecls(decl => { paper[decl.prop] = decl.value; });
  rule.walkDecls(decl => assert.ok(!/^(display|position|order|grid.*|flex.*|margin.*|padding.*|width|height)$/.test(decl.prop), 'El skin no cambia la distribución'));
});
function luminance(hex) {
  const rgb = hex.slice(1).match(/../g).map(value => parseInt(value, 16) / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
  return .2126 * rgb[0] + .7152 * rgb[1] + .0722 * rgb[2];
}
const sharedLight = {}, sharedDark = {};
for (const file of ['public-chrome.css','globals.css']) {
  postcss.parse(fs.readFileSync(path.resolve(__dirname, '../apps/web/src/app/' + file), 'utf8')).walkRules(rule => {
    if (rule.selector === ':root' || rule.selector === 'html.dark') rule.walkDecls(decl => { (rule.selector === ':root' ? sharedLight : sharedDark)[decl.prop] = decl.value; });
  });
}
function resolveTokens(tokens) {
  const resolve = value => /^var\(--[\w-]+\)$/.test(value) ? resolve(tokens[value.slice(4,-1)]) : value;
  return Object.fromEntries(Object.entries(tokens).map(([key,value]) => [key,resolve(value)]));
}
const palettes = [['lavanda claro',light],['lavanda oscuro',{...light,...dark}],
  ['papel claro',resolveTokens({...sharedLight,...light,...paper})],
  ['papel oscuro',resolveTokens({...sharedLight,...sharedDark,...light,...dark,...paper})]];
for (const [name, tokens] of palettes) {
  const ratios = [];
  for (const [foreground, background] of [['text','surface'], ['text','canvas'], ['text','accent'], ['text','accent-hover'], ['muted','surface'], ['muted','canvas'], ['danger-text','danger-bg'], ['on-selected','selected']]) {
    const values = [foreground, background].map(key => luminance(tokens['--panel-' + key]));
    const ratio = (Math.max(...values) + .05) / (Math.min(...values) + .05);
    assert.ok(ratio >= 4.5, `${name}: ${foreground}/${background}: ${ratio}`);
    ratios.push(ratio);
  }
  assert.equal(tokens['--panel-touch'], '44px');
  console.log(`${name}: AA, mínimo ${Math.min(...ratios).toFixed(2)}:1; controles 44px.`);
}
assert.equal(paper['--panel-canvas'], 'var(--paper-bg)');
assert.equal(paper['--panel-surface'], 'var(--header-bg)');
for (const route of ['panel','admin']) assert.ok(fs.readFileSync(path.resolve(__dirname,`../apps/web/src/app/[locale]/${route}/layout.tsx`),'utf8').includes('data-panel-palette="paper"'));
assert.ok(css.toString().includes('body:has(.panel-skin[data-panel-palette="paper"])'));
