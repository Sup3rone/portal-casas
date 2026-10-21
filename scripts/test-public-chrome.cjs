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
  // El monograma público añadió sus tokens en d9c35a2a; no son estilos de contenido/panel.
  else if (['.home-brand', 'html.dark .home-brand'].includes(rule.selector)) {
    rule.walkDecls(decl => assert.equal(decl.prop, '--logo-color', 'La excepción del monograma solo admite su token de color'));
  }
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

const typography = fs.readFileSync(path.resolve(__dirname, '../apps/web/src/app/typography.css'), 'utf8');
assert.ok(typography.includes(":where(h1, h2, h3, h4, h5, h6)"));
assert.ok(typography.includes('.brand-wordmark { font-family: var(--font-logo-family, Georgia, serif);'));
assert.ok(!/body\s*\{/.test(typography), 'Texto corrido intacto');
const font = fs.readFileSync(path.resolve(__dirname, '../apps/web/public/fonts/Cinzel-Variable.ttf'));
assert.equal(font.readUInt32BE(0),0x00010000,'Cinzel es TrueType, no respuesta HTML');
assert.ok(font.length > 10000);
assert.ok(fs.readFileSync(path.resolve(__dirname, '../apps/web/public/fonts/Cinzel-OFL.txt'),'utf8').includes('SIL OPEN FONT LICENSE'));
const galleryCss=fs.readFileSync(path.resolve(__dirname,'../apps/web/src/components/PropertyGallery.module.css'),'utf8');
assert.match(galleryCss,/width: 64px; height: 48px/);
console.log('OK tipografía local válida/licencia, títulos sin body, logo aislado y flechas 64×48 con tokens chrome contrastados.');

assert.ok(!typography.includes('Vilaka'));
assert.ok(!/fonts\.googleapis|fonts\.gstatic/.test(typography), 'Sin hotlink CSS');

// Modelo conservador del scrim vigente: fondo blanco detrás del gradiente,
// texto dentro de sus primeros 80px y 14rem = 224px con raíz de 16px.
const themeCss=fs.readFileSync(path.resolve(__dirname,'../apps/web/node_modules/tailwindcss/theme.css'),'utf8');
const oklch=themeCss.match(/--color-gray-900: oklch\(([^%]+)% ([\d.]+) ([\d.]+)\)/);
const L=Number(oklch[1])/100,C=Number(oklch[2]),h=Number(oklch[3])*Math.PI/180;
const a=C*Math.cos(h),b=C*Math.sin(h);
const l=(L+.3963377774*a+.2158037573*b)**3,m=(L-.1055613458*a-.0638541728*b)**3,s=(L-.0894841775*a-1.291485548*b)**3;
const linear=[4.0767416621*l-3.3077115913*m+.2309699292*s,-1.2684380046*l+2.6097574011*m-.3413193965*s,-.0041960863*l-.7034186147*m+1.707614701*s];
const channels=linear.map(v=>v<=.0031308?12.92*v:1.055*v**(1/2.4)-.055);
const alpha=1-80/224;
const background='#'+channels.map(v=>Math.round((alpha*v+1-alpha)*255).toString(16).padStart(2,'0')).join('');
const heroRatio=1.05/(luminance(background)+.05);
assert.ok(heroRatio>=4.5,'Wordmark blanco sobre el modelo conservador del scrim');
console.log('Hero blanco bajo scrim (modelo 80/224px): '+heroRatio.toFixed(2)+':1; confirmar geometría real en QA humana.');
