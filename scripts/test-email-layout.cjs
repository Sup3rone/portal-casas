// T-5309: marco común de los correos (lib/email-layout.ts) y su uso en sendEmail y en las plantillas.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { load } = require('./test-property-access.cjs');
const { emailLayout, emailButton, EMAIL_COLORS } = load('apps/web/src/lib/email-layout.ts');

delete process.env.PUBLIC_SITE_URL;
// Local: logo incrustado (cid:) y sin enlace a localhost; el resto del marco igual.
let html = emailLayout('<p>Hola</p>');
assert.ok(html.startsWith('<!doctype html>') && html.includes('<p>Hola</p>'));
assert.ok(html.includes('src="cid:alia-logo"') && !html.includes('localhost'), 'logo incrustado siempre; en local sin enlace a localhost');
assert.ok(html.includes(EMAIL_COLORS.paper) && html.includes(EMAIL_COLORS.brand) && html.includes('ALIA for Rent'));
assert.ok(html.includes('name="color-scheme" content="light"'));
assert.equal(emailLayout(html), html, 'idempotente: no se envuelve dos veces');

// Producción: logo incrustado (nunca una URL externa) + enlace al sitio en el pie; preheader escapado y oculto.
process.env.PUBLIC_SITE_URL = 'https://aliaforrent.vercel.app';
html = emailLayout('<p>x</p>', { preheader: 'Reserva <confirmada> & "lista"' });
assert.ok(html.includes('src="cid:alia-logo"') && !/<img[^>]+src="https?:/.test(html), 'el logo no depende de una URL externa');
assert.ok(html.includes('href="https://aliaforrent.vercel.app"') && html.includes('>aliaforrent.vercel.app</a>'));
assert.ok(html.includes('display:none') && html.includes('Reserva &lt;confirmada&gt; &amp; &quot;lista&quot;'));
const { EMAIL_LOGO_PNG_BASE64 } = load('apps/web/src/lib/email-logo.ts');
const logoBytes = Buffer.from(EMAIL_LOGO_PNG_BASE64, 'base64');
assert.ok(logoBytes.subarray(1, 4).toString() === 'PNG' && logoBytes.length < 20_000, 'logo incrustado: PNG liviano');

// Botón: tabla (Outlook) y todo escapado.
const button = emailButton('https://x.test/a?b=1&c="2"', 'Ver <más>');
assert.ok(button.startsWith('<table') && button.includes('href="https://x.test/a?b=1&amp;c=&quot;2&quot;"') && button.includes('Ver &lt;más&gt;'));

// sendEmail aplica el marco; las plantillas usan el botón y ya no fijan su propio ancho.
const mailerSource = fs.readFileSync('apps/web/src/lib/mailer.ts', 'utf8');
assert.match(mailerSource, /html = emailLayout\(html\);/);
assert.ok(!mailerSource.includes('preheader'), 'sin texto oculto de bandeja (suma puntos de spam en cuentas nuevas)');

// Texto plano: enlaces legibles, viñetas, entidades decodificadas, sin <head>, texto oculto ni etiquetas.
const { emailText } = load('apps/web/src/lib/email-layout.ts');
const plain = emailText(emailLayout('<h2>Hola &amp; adiós</h2><p>Línea 1<br>Línea 2</p><ul><li>Casa &lt;Sol&gt;</li></ul>'
  + emailButton('https://a.test/x?y=1&z=2', 'Ver gastos'), { preheader: 'OCULTO' }));
assert.ok(plain.startsWith('ALIA for Rent'), plain);
assert.ok(plain.includes('Hola & adiós\n') && plain.includes('Línea 1\nLínea 2') && plain.includes('• Casa <Sol>'), plain);
assert.ok(plain.includes('Ver gastos: https://a.test/x?y=1&z=2'), plain);
assert.ok(plain.includes('aliaforrent.vercel.app'), plain);
assert.ok(!/[<>]/.test(plain.replace('<Sol>', '')) && !plain.includes('OCULTO') && !plain.includes('\n\n\n'), plain);
for (const file of ['apps/web/src/app/[locale]/olvide-password/actions.ts', 'apps/web/src/lib/inquiry-notice.ts', 'apps/web/src/lib/account-emails.ts', 'apps/web/src/lib/booking-emails.ts']) {
  assert.ok(!/max-width: 4[0-9]0px|max-width: 520px/.test(fs.readFileSync(file, 'utf8')), `${file}: sin ancho propio`);
}
assert.ok(fs.readFileSync('apps/web/src/app/[locale]/olvide-password/actions.ts', 'utf8').includes("emailButton(resetUrl, 'Cambiar mi contraseña')"));
assert.ok(fs.readFileSync('apps/web/src/lib/inquiry-notice.ts', 'utf8').includes("emailButton(localizedUrl('es', '/admin/mensajes'), 'Ver la consulta en el panel')"));
console.log('test-email-layout OK');
