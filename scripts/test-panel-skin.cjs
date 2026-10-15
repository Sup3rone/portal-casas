// Contraste de los tokens y aislamiento del skin, sin navegador ni BD.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const req = createRequire(path.resolve(__dirname, '../apps/web/package.json'));
const postcss = createRequire(req.resolve('@tailwindcss/postcss'))('postcss');
const css = postcss.parse(fs.readFileSync(path.resolve(__dirname, '../apps/web/src/app/panel-skin.css'), 'utf8'));
const light = {}, dark = {};
css.walkRules(rule => {
  assert.ok(rule.selectors.every(selector => selector.includes('.panel-skin')), 'Sin selectores públicos/globales');
  if (rule.selector === '.panel-skin' || rule.selector === 'html.dark .panel-skin') {
    rule.walkDecls(decl => { (rule.selector.startsWith('html.dark') ? dark : light)[decl.prop] = decl.value; });
  }
  rule.walkDecls(decl => assert.ok(!/^(display|position|order|grid.*|flex.*|margin.*|padding.*|width|height)$/.test(decl.prop), 'El skin no cambia la distribución'));
});
function luminance(hex) {
  const rgb = hex.slice(1).match(/../g).map(value => parseInt(value, 16) / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
  return .2126 * rgb[0] + .7152 * rgb[1] + .0722 * rgb[2];
}
for (const [name, tokens] of [['claro', light], ['oscuro', { ...light, ...dark }]]) {
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
