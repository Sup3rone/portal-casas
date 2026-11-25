// T-5308: lib/mailer.ts elige Gmail (SMTP) si están GMAIL_USER y GMAIL_APP_PASSWORD; si no, Resend. Offline: se
// simulan nodemailer y resend. Cubre remitente, adjuntos, espacios de la contraseña, cambio de variables en caliente,
// y que un error de Gmail no filtre la contraseña.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { load, mockModule } = require('./test-property-access.cjs');

const transports = [], smtp = [], resendCalls = [];
let smtpFails = null;
mockModule('nodemailer', { __esModule: true, default: { createTransport: options => {
  transports.push(options);
  return { sendMail: async message => { if (smtpFails) throw smtpFails; smtp.push(message); return { messageId: 'x' }; } };
} } });
mockModule('resend', { Resend: class { constructor(key) { this.key = key; this.emails = { send: async message => { resendCalls.push({ key: this.key, ...message }); return { error: null }; } }; } } });

const mailer = load('apps/web/src/lib/mailer.ts');
const env = vars => { for (const k of ['GMAIL_USER', 'GMAIL_APP_PASSWORD', 'EMAIL_FROM', 'RESEND_API_KEY']) delete process.env[k]; Object.assign(process.env, vars); };
const msg = { to: ['uno@test.invalid', 'dos@test.invalid'], subject: 'Asunto', html: '<p>Hola</p>' };

async function main() {
  // Sin Gmail → Resend (comportamiento anterior intacto).
  env({ RESEND_API_KEY: 're_x' });
  assert.equal(mailer.mailProvider(), 'resend');
  await mailer.sendEmail(msg);
  const first = resendCalls.pop();
  // Logo incrustado como adjunto en línea (Resend: contentId).
  assert.deepEqual(first.attachments.map(a => [a.filename, a.contentId, a.content.subarray(1, 4).toString()]), [['alia.png', 'alia-logo', 'PNG']]);
  delete first.attachments;
  assert.ok(first.html.startsWith('<!doctype html>') && first.html.includes('<p>Hola</p>'), 'T-5309: el marco envuelve el contenido');
  assert.ok(first.text.includes('Hola'), 'T-5309: también va la versión de texto');
  assert.deepEqual({ ...first, html: undefined, text: undefined }, { key: 're_x', from: 'ALIA for Rent <onboarding@resend.dev>', ...msg, html: undefined, text: undefined });
  env({ RESEND_API_KEY: 're_x', EMAIL_FROM: 'ALIA <noreply@dominio.mx>', GMAIL_USER: 'solo-usuario@gmail.com' });
  assert.equal(mailer.mailProvider(), 'resend', 'falta la contraseña → Resend');
  await mailer.sendEmail(msg);
  assert.equal(resendCalls.pop().from, 'ALIA <noreply@dominio.mx>');

  // Con las dos → Gmail SMTP 587 + STARTTLS obligatorio, remitente = la cuenta, contraseña sin espacios, adjunto intacto.
  env({ RESEND_API_KEY: 're_x', GMAIL_USER: ' portal@gmail.com ', GMAIL_APP_PASSWORD: 'abcd efgh ijkl mnop' });
  assert.equal(mailer.mailProvider(), 'gmail');
  const excel = Buffer.from('PK');
  await mailer.sendEmail({ ...msg, attachments: [{ filename: 'r.xlsx', content: excel }] });
  assert.deepEqual(transports.at(-1), { host: 'smtp.gmail.com', port: 587, secure: false, requireTLS: true, auth: { user: 'portal@gmail.com', pass: 'abcdefghijklmnop' } });
  const viaGmail = smtp.pop();
  // Excel del llamador intacto + logo en línea (nodemailer: cid).
  const logoPart = viaGmail.attachments.pop();
  assert.deepEqual([logoPart.filename, logoPart.cid, logoPart.contentType, logoPart.contentDisposition], ['alia.png', 'alia-logo', 'image/png', 'inline']);
  assert.ok(viaGmail.html.includes('<p>Hola</p>') && viaGmail.html.includes('alia-email-layout'));
  assert.ok(viaGmail.text.includes('Hola'));
  assert.deepEqual({ ...viaGmail, html: undefined, text: undefined }, { from: { name: 'ALIA for Rent', address: 'portal@gmail.com' }, ...msg, html: undefined, text: undefined, attachments: [{ filename: 'r.xlsx', content: excel }] });
  assert.equal(resendCalls.length, 0, 'no se usa Resend');
  // Reutiliza la conexión mientras no cambien las variables; si cambian, crea otra.
  const before = transports.length;
  await mailer.sendEmail(msg);
  assert.equal(transports.length, before);
  assert.deepEqual(smtp.pop().attachments.map(a => a.cid), ['alia-logo'], 'sin adjuntos del llamador: solo el logo');
  env({ GMAIL_USER: 'otra@gmail.com', GMAIL_APP_PASSWORD: 'zzzzzzzzzzzzzzzz' });
  await mailer.sendEmail(msg);
  assert.equal(transports.length, before + 1);
  assert.equal(smtp.pop().from.address, 'otra@gmail.com');

  // Error de Gmail (p. ej. contraseña de aplicación revocada): lanza sin la contraseña, ni en el error ni en el log.
  smtpFails = Object.assign(new Error('Invalid login: 535-5.7.8 Username and Password not accepted zzzzzzzzzzzzzzzz'), { code: 'EAUTH', responseCode: 535 });
  const logged = [], original = console.error;
  console.error = (...args) => logged.push(args.map(String).join(' '));
  try { await assert.rejects(mailer.sendEmail(msg), error => error.message === 'No se pudo enviar el email (Gmail EAUTH 535)'); }
  finally { console.error = original; smtpFails = null; }
  assert.ok(!logged.join('\n').includes('zzzz'), 'el log no lleva la contraseña');

  // Documentado para quien configure Vercel.
  const example = fs.readFileSync('.env.example', 'utf8');
  assert.ok(example.includes('GMAIL_USER=') && example.includes('GMAIL_APP_PASSWORD='));
  console.log('test-mailer OK');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
