// T-5310: bitácora de correos enviados. Offline: mailer real con proveedores simulados sobre SQLite en memoria; registra
// enviados y fallidos (con su tipo, sin contenido), un fallo del registro no rompe el envío, borra lo de más de 90 días,
// y /panel/correos es solo para ADMIN con filtros y búsqueda. Textos es/en/fr y cada plantilla declara su tipo.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { load, memory, req, portal, mockModule, setSession } = require('./test-property-access.cjs');
const { getTableConfig } = req('drizzle-orm/pg-core');
const React = req('react');
const { renderToStaticMarkup } = req('react-dom/server');

const config = getTableConfig(portal.emailLogs);
memory.exec(`CREATE TABLE IF NOT EXISTS "${config.name}" (${config.columns.map(column => `"${column.name}" ${/integer|boolean|double/.test(column.getSQLType()) ? 'REAL' : 'TEXT'}${column.primary ? ' PRIMARY KEY' : ''}`).join(', ')})`);

let resendError = null;
mockModule('resend', { Resend: class { constructor() { this.emails = { send: async () => ({ error: resendError }) }; } } });
mockModule('nodemailer', { __esModule: true, default: { createTransport: () => ({ sendMail: async () => ({}) }) } });
const { sendEmail } = load('apps/web/src/lib/mailer.ts');
const { EMAIL_LOG_DAYS } = load('apps/web/src/lib/email-log.ts');
const page = load('apps/web/src/app/[locale]/panel/correos/page.tsx').default;
const rows = () => memory.prepare(`SELECT * FROM "EmailLog" ORDER BY "createdAt"`).all();
const quiet = async fn => { const original = console.error; console.error = () => {}; try { return await fn(); } finally { console.error = original; } };

async function main() {
  for (const key of ['GMAIL_USER', 'GMAIL_APP_PASSWORD']) delete process.env[key];
  process.env.RESEND_API_KEY = 're_test';

  // 1) Enviado: fila con tipo, destinatarios en minúsculas, asunto y proveedor. Sin el contenido.
  await sendEmail({ kind: 'password-reset', to: ' Ana@Test.Invalid ', subject: 'Recupera tu contraseña', html: '<p>token=SECRETO123</p>' });
  let [row] = rows();
  assert.deepEqual([row.kind, JSON.parse(row.recipients), row.subject, row.status, row.provider, row.error], ['password-reset', ['ana@test.invalid'], 'Recupera tu contraseña', 'sent', 'resend', null]);
  assert.ok(!JSON.stringify(rows()).includes('SECRETO123'), 'nunca guarda el contenido');
  assert.deepEqual(config.columns.map(c => c.name).sort(), ['createdAt', 'error', 'id', 'kind', 'provider', 'recipients', 'status', 'subject'], 'sin columna de contenido');
  // Sin tipo → «other»; varios destinatarios.
  await sendEmail({ to: ['a@test.invalid', 'b@test.invalid'], subject: 'Sin tipo', html: '<p>x</p>' });
  assert.deepEqual([rows().at(-1).kind, JSON.parse(rows().at(-1).recipients)], ['other', ['a@test.invalid', 'b@test.invalid']]);

  // 2) Fallo del proveedor: se registra con el motivo y el error llega a quien llamó.
  resendError = { name: 'validation_error', message: 'You can only send testing emails to your own email address' };
  await quiet(() => assert.rejects(sendEmail({ kind: 'inquiry', to: 'x@test.invalid', subject: 'Consulta', html: '<p>x</p>' }), /Resend: You can only send/));
  resendError = null;
  row = rows().at(-1);
  assert.deepEqual([row.kind, row.status, row.error], ['inquiry', 'failed', 'No se pudo enviar el email (Resend: You can only send testing emails to your own email address)']);

  // 3) Si la bitácora falla (p. ej. deploy antes del SQL), el correo se envía igual.
  memory.exec(`ALTER TABLE "EmailLog" RENAME TO "EmailLog_x"`);
  await quiet(() => sendEmail({ kind: 'monthly-report', to: 'x@test.invalid', subject: 'Reporte', html: '<p>x</p>' }));
  memory.exec(`ALTER TABLE "EmailLog_x" RENAME TO "EmailLog"`);

  // 4) Borra lo de más de 90 días al registrar; lo más reciente se queda.
  const day = 86_400_000, insert = (id, ago) => memory.prepare(`INSERT INTO "EmailLog" (id, kind, recipients, subject, status, provider, "createdAt") VALUES (?, 'other', '[]', ?, 'sent', 'resend', ?)`).run(id, id, new Date(Date.now() - ago * day).toISOString());
  insert('viejo', EMAIL_LOG_DAYS + 1); insert('reciente', EMAIL_LOG_DAYS - 10);
  assert.equal(EMAIL_LOG_DAYS, 90);
  await sendEmail({ kind: 'booking-guest', to: 'g@test.invalid', subject: 'Reserva', html: '<p>x</p>' });
  const ids = rows().map(r => r.id);
  assert.ok(!ids.includes('viejo') && ids.includes('reciente'), 'borrado a los 90 días');

  // 5) /panel/correos: solo ADMIN (404 para colaborador, cliente o sin sesión).
  const render = async (query = {}) => renderToStaticMarkup(await page({ params: Promise.resolve({ locale: 'es' }), searchParams: Promise.resolve(query) }));
  for (const id of [null, 'a', 'client']) {
    setSession(id ? { user: { id } } : null);
    await assert.rejects(render(), error => error.status === 404, `rol ${id}: 404`);
  }
  setSession({ user: { id: 'admin' } });
  let html = await render();
  assert.ok(html.includes('Correos enviados') && html.includes('90 días'));
  assert.ok(html.includes('ana@test.invalid') && html.includes('Recuperar contraseña') && html.includes('Falló') && html.includes('por Resend'));
  assert.ok(html.includes('You can only send testing emails'), 'se ve el motivo del fallo');
  assert.ok(html.indexOf('Reserva') < html.indexOf('Recupera tu contraseña'), 'lo más reciente primero');
  html = await render({ status: 'failed' });
  assert.equal((html.match(/data-email-status="/g) || []).length, 1);
  assert.ok(html.includes('data-email-status="failed"') && !html.includes('data-email-status="sent"'));
  html = await render({ q: 'ANA@' });
  assert.ok(html.includes('ana@test.invalid') && !html.includes('g@test.invalid'), 'búsqueda por destinatario');
  html = await render({ kind: 'booking-guest' });
  assert.ok(html.includes('g@test.invalid') && !html.includes('ana@test.invalid'), 'filtro por tipo');
  html = await render({ status: 'raro', kind: '<script>', q: 'nadie@x' });
  assert.ok(html.includes('No hay correos con esos filtros.') && !html.includes('<script>'));

  // 6) Menú: enlace solo para ADMIN; textos con las mismas llaves en es/en/fr y una etiqueta por tipo.
  const layout = fs.readFileSync('apps/web/src/app/[locale]/panel/layout.tsx', 'utf8');
  assert.match(layout, /manager\.role === 'ADMIN' && <Link href="\/panel\/correos"/);
  const keys = (obj, prefix = '') => Object.entries(obj).flatMap(([k, v]) => typeof v === 'object' ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}`]).sort();
  const messages = locale => JSON.parse(fs.readFileSync(`apps/web/messages/${locale}.json`, 'utf8')).emailLog;
  assert.deepEqual(keys(messages('en')), keys(messages('es')));
  assert.deepEqual(keys(messages('fr')), keys(messages('es')));
  assert.deepEqual(Object.keys(messages('es').kinds).sort(), [...portal.emailKinds].sort());

  // 7) Cada plantilla declara su tipo; el SQL coincide con la lista de tipos.
  for (const [file, kind] of [['apps/web/src/app/[locale]/olvide-password/actions.ts', 'password-reset'], ['apps/web/src/lib/account-emails.ts', 'password-changed'],
    ['apps/web/src/lib/booking-emails.ts', 'booking-guest'], ['apps/web/src/lib/booking-emails.ts', 'booking-owner'],
    ['apps/web/src/lib/inquiry-notice.ts', 'inquiry'], ['apps/web/src/lib/monthly-report-service.ts', 'monthly-report']]) {
    assert.ok(fs.readFileSync(file, 'utf8').includes(`kind: '${kind}'`), `${file}: ${kind}`);
  }
  const sqlText = fs.readFileSync('scripts/sql/email-log.sql', 'utf8');
  for (const kind of portal.emailKinds) assert.ok(sqlText.includes(`'${kind}'`), `SQL: ${kind}`);
  console.log('test-email-log OK');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
