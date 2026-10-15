const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const req = createRequire(path.resolve(__dirname, '../apps/web/package.json'));
const postcss = createRequire(req.resolve('@tailwindcss/postcss'))('postcss');
const css = postcss.parse(fs.readFileSync(path.resolve(__dirname, '../apps/web/src/app/public-chrome.css'), 'utf8'));
const light = {}, dark = {};
css.walkRules(rule => {
  if (rule.selector === ':root' || rule.selector === 'html.dark') rule.walkDecls(decl => { (rule.selector === ':root' ? light : dark)[decl.prop] = decl.value; });
  else assert.ok(rule.selectors.every(selector => /public-header|public-footer/.test(selector)), 'Estilos visuales aislados del panel y del contenido');
});
function luminance(hex) {
  const rgb = hex.slice(1).match(/../g).map(value => parseInt(value, 16) / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
  return .2126 * rgb[0] + .7152 * rgb[1] + .0722 * rgb[2];
}
for (const [theme, tokens] of [['claro', light], ['oscuro', { ...light, ...dark }]]) {
  for (const foreground of ['--chrome-text', '--chrome-muted']) for (const background of ['--header-bg', '--footer-bg', '--search-surface']) {
    const values = [foreground, background].map(key => luminance(tokens[key]));
    const ratio = (Math.max(...values) + .05) / (Math.min(...values) + .05);
    assert.ok(ratio >= 4.5, `${theme} ${foreground}/${background}: ${ratio}`);
    console.log(`${theme} ${foreground}/${background}: ${ratio.toFixed(2)}:1`);
  }
}
