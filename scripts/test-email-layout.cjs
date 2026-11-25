// T-5309: marco común de los correos (lib/email-layout.ts) y su uso en sendEmail y en las plantillas.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { load } = require('./test-property-access.cjs');
const { emailLayout, emailButton, EMAIL_COLORS } = load('apps/web/src/lib/email-layout.ts');

delete process.env.PUBLIC_SITE_URL;
// Local: sin logo (localhost no se puede cargar desde un buzón) ni enlace al sitio; el resto del marco sí.
let html = emailLayout('<p>Hola</p>');
assert.ok(html.startsWith('<!doctype html>') && html.includes('<p>Hola</p>'));
assert.ok(!html.includes('<img') && !html.includes('localhost'), 'en local no hay logo ni enlace a localhost');
assert.ok(html.includes(EMAIL_COLORS.paper) && html.includes(EMAIL_COLORS.brand) && html.includes('ALIA for Rent'));
assert.ok(html.includes('name="color-scheme" content="light"'));
assert.equal(emailLayout(html), html, 'idempotente: no se envuelve dos veces');

// Producción: logo pequeño absoluto + enlace al sitio en el pie; preheader escapado y oculto.
process.env.PUBLIC_SITE_URL = 'https://aliaforrent.vercel.app';
html = emailLayout('<p>x</p>', { preheader: 'Reserva <confirmada> & "lista"' });
assert.ok(html.includes('src="https://aliaforrent.vercel.app/brand/alia-email-logo.png"'));
assert.ok(html.includes('href="https://aliaforrent.vercel.app"') && html.includes('>aliaforrent.vercel.app</a>'));
assert.ok(html.includes('display:none') && html.includes('Reserva &lt;confirmada&gt; &amp; &quot;lista&quot;'));
assert.ok(fs.existsSync('apps/web/public/brand/alia-email-logo.png') && fs.statSync('apps/web/public/brand/alia-email-logo.png').size < 20_000, 'logo de correo liviano');

// Botón: tabla (Outlook) y todo escapado.
const button = emailButton('https://x.test/a?b=1&c="2"', 'Ver <más>');
assert.ok(button.startsWith('<table') && button.includes('href="https://x.test/a?b=1&amp;c=&quot;2&quot;"') && button.includes('Ver &lt;más&gt;'));

// sendEmail aplica el marco; las plantillas usan el botón y ya no fijan su propio ancho.
assert.match(fs.readFileSync('apps/web/src/lib/mailer.ts', 'utf8'), /html = emailLayout\(html, \{ preheader: subject \}\)/);
for (const file of ['apps/web/src/app/[locale]/olvide-password/actions.ts', 'apps/web/src/lib/inquiry-notice.ts', 'apps/web/src/lib/account-emails.ts', 'apps/web/src/lib/booking-emails.ts']) {
  assert.ok(!/max-width: 4[0-9]0px|max-width: 520px/.test(fs.readFileSync(file, 'utf8')), `${file}: sin ancho propio`);
}
assert.ok(fs.readFileSync('apps/web/src/app/[locale]/olvide-password/actions.ts', 'utf8').includes("emailButton(resetUrl, 'Cambiar mi contraseña')"));
assert.ok(fs.readFileSync('apps/web/src/lib/inquiry-notice.ts', 'utf8').includes("emailButton(localizedUrl('es', '/admin/mensajes'), 'Ver la consulta en el panel')"));
console.log('test-email-layout OK');
