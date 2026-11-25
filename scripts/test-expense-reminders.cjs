// T-5307 (T-5248 fase 4): aviso diario de pagos y mantenimientos por vencer. Offline: reglas puras (hoy / en 3 días /
// atrasado, «pagado» por periodo), servicio sobre SQLite en memoria (solo colaborador dueño, admin fuera, escape HTML,
// enlaces, idempotencia por día, fallo que libera el hueco), cron diario con CRON_SECRET y textos es/en/fr.
// Lo que SQLite no reproduce (CHECK, FK) queda en scripts/sql/expense-reminders.sql y se verifica al aplicarlo en Respaldo.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { load, memory, req, portal } = require('./test-property-access.cjs');
const { getTableConfig } = req('drizzle-orm/pg-core');

const root = path.join(__dirname, '..');
for (const name of ['expenseTypes', 'recurringExpenses', 'expenseEntries', 'maintenances', 'expenseReminderDeliveries']) {
  const config = getTableConfig(portal[name]);
  memory.exec(`CREATE TABLE IF NOT EXISTS "${config.name}" (${config.columns.map(column => `"${column.name}" ${/integer|boolean|double/.test(column.getSQLType()) ? 'REAL' : 'TEXT'}${column.primary ? ' PRIMARY KEY' : ''}`).join(', ')})`);
}
memory.exec(`CREATE UNIQUE INDEX "ExpenseReminderDelivery_once" ON "ExpenseReminderDelivery" ("userId", "day") WHERE "status" IN ('pending', 'sent')`);
memory.exec(`INSERT OR IGNORE INTO "ExpenseType" ("id", "name", "fixed", "active") VALUES ('luz', 'Luz', 1, 1), ('agua', 'Agua', 1, 1)`);

const { buildReminders, REMINDER_LEAD_DAYS } = load('apps/web/src/lib/expense-reminders.ts');
const { runExpenseReminders } = load('apps/web/src/lib/expense-reminder-service.ts');
const cron = load('apps/web/src/app/api/cron/daily/route.ts');
const insert = (table, row) => memory.prepare(`INSERT INTO "${table}" (${Object.keys(row).map(k => `"${k}"`).join(',')}) VALUES (${Object.keys(row).map(() => '?').join(',')})`).run(...Object.values(row));
const rec = (id, startDate, periodicity = 'mensual', propertyId = 'pa', typeId = 'luz', amount = '850.00') => ({ id, propertyId, typeId, periodicity, amount, startDate });

async function main() {
  // 1) Reglas puras.
  assert.equal(REMINDER_LEAD_DAYS, 3);
  const today = '2026-11-25';
  let plan = buildReminders(today, [rec('hoy', '2026-01-25'), rec('pronto', '2026-01-28'), rec('lejos', '2026-01-10')], [], []);
  const summary = p => p.items.map(i => `${i.when}:${i.recurringExpenseId ?? i.maintenanceId}:${i.date}`);
  // «lejos» (día 10) venció el 10-nov sin pagar → atrasado; «hoy» y «pronto» también arrastran su periodo anterior.
  assert.deepEqual(summary(plan), ['today:hoy:2026-11-25', 'soon:pronto:2026-11-28', 'overdue:hoy:2026-10-25', 'overdue:pronto:2026-10-28', 'overdue:lejos:2026-11-10']);
  assert.equal(plan.shouldSend, true);
  // Pagado = ExpenseEntry del mismo gasto con la fecha del periodo y paid; registrado sin pagar sigue contando.
  plan = buildReminders(today, [rec('hoy', '2026-01-25')], [
    { recurringExpenseId: 'hoy', date: '2026-11-25', paid: true }, { recurringExpenseId: 'hoy', date: '2026-10-25', paid: false }], []);
  assert.deepEqual(summary(plan), ['overdue:hoy:2026-10-25']);
  assert.equal(plan.shouldSend, false, 'lo atrasado solo acompaña: no dispara un correo diario por sí solo');
  // Ciclo que aún no empieza: nada atrasado; empieza en 3 días → «pronto».
  assert.deepEqual(summary(buildReminders(today, [rec('nuevo', '2026-11-28')], [], [])), ['soon:nuevo:2026-11-28']);
  assert.deepEqual(summary(buildReminders(today, [rec('futuro', '2027-01-01')], [], [])), []);
  // Semanal y día 31 en mes corto (cae en el último día).
  assert.deepEqual(summary(buildReminders('2026-11-25', [rec('sem', '2026-11-04', 'semanal')], [], [])), ['today:sem:2026-11-25', 'overdue:sem:2026-11-18']);
  assert.deepEqual(summary(buildReminders('2027-02-25', [rec('d31', '2026-01-31')], [{ recurringExpenseId: 'd31', date: '2027-01-31', paid: true }], [])), ['soon:d31:2027-02-28']);
  // Mantenimientos: solo «pendiente» con fecha.
  plan = buildReminders(today, [], [], [
    { id: 'm1', propertyId: 'pa', title: 'Pintura', status: 'pendiente', startDate: '2026-11-25' },
    { id: 'm2', propertyId: 'pa', title: 'Jardín', status: 'pendiente', startDate: '2026-11-28' },
    { id: 'm3', propertyId: 'pa', title: 'Bomba', status: 'pendiente', startDate: '2026-11-01' },
    { id: 'm4', propertyId: 'pa', title: 'En curso', status: 'en_proceso', startDate: '2026-11-25' },
    { id: 'm5', propertyId: 'pa', title: 'Sin fecha', status: 'pendiente', startDate: null },
    { id: 'm6', propertyId: 'pa', title: 'Luego', status: 'pendiente', startDate: '2026-11-27' }]);
  assert.deepEqual(summary(plan), ['today:m1:2026-11-25', 'soon:m2:2026-11-28', 'overdue:m3:2026-11-01']);

  // 2) Servicio sobre la BD en memoria. Casas del arnés: pa y hidden → a; pb → b. El admin no tiene casas propias
  //    pero tampoco debe recibir aunque se le asigne una.
  insert('Property', { id: 'padmin', ownerId: 'admin', published: 1, slug: 'padmin', titleEs: 'Casa admin', titleEn: 'x', titleFr: 'x', maxGuests: 2, rentalType: 'nocturna' });
  memory.prepare(`UPDATE "Property" SET "titleEs" = ? WHERE id = 'pa'`).run('Casa <b>Sol</b> & "mar"');
  const recurring = { id: 'r1', propertyId: 'pa', typeId: 'luz', periodicity: 'bimestral', amount: '1234.50', startDate: '2026-01-25', active: 1, createdAt: '2026-01-01' };
  insert('RecurringExpense', recurring);
  insert('RecurringExpense', { ...recurring, id: 'r-off', active: 0 });
  insert('RecurringExpense', { ...recurring, id: 'r-admin', propertyId: 'padmin' });
  insert('RecurringExpense', { ...recurring, id: 'r-b', propertyId: 'pb', typeId: 'agua', startDate: '2026-11-10', periodicity: 'mensual' }); // solo atrasado
  insert('Maintenance', { id: 'mh', propertyId: 'hidden', title: 'Impermeabilizar <script>', kind: 'puntual', status: 'pendiente', startDate: '2026-11-28', createdBy: 'a', createdAt: 'x', updatedAt: 'x' });
  const sent = [];
  globalThis.__testMailer = async message => { sent.push(message); };
  process.env.PUBLIC_SITE_URL = 'https://aliaforrent.vercel.app';
  let result = await runExpenseReminders(today);
  assert.deepEqual([result.sent, result.failed, result.skipped], [1, 0, 0], JSON.stringify(result));
  assert.equal(sent.length, 1);
  const mail = sent[0];
  assert.equal(mail.to, 'a@test.invalid', 'a la cuenta del colaborador dueño');
  assert.match(mail.subject, /^Pagos y mantenimientos por atender — 25 nov 2026$/);
  assert.ok(mail.html.includes('Casa &lt;b&gt;Sol&lt;/b&gt; &amp; &quot;mar&quot; · Luz · periodo del 25 nov 2026 · $1,234.50 MXN'), mail.html);
  assert.ok(mail.html.includes('Impermeabilizar &lt;script&gt;') && !mail.html.includes('<script>'), 'escapado');
  assert.ok(mail.html.includes('href="https://aliaforrent.vercel.app/es/panel/propiedades/pa/gastos"'));
  assert.ok(mail.html.includes('href="https://aliaforrent.vercel.app/es/panel/propiedades/hidden/gastos"'), 'también casas no publicadas');
  assert.ok(mail.html.includes('Vence hoy (25 nov 2026)') && mail.html.includes('Vence en 3 días (28 nov 2026)'));
  // r1 bimestral: el periodo anterior (25-sep) quedó sin pagar → va en «Atrasado» del mismo correo.
  assert.ok(mail.html.includes('Atrasado, sin pagar o sin empezar') && /Luz · periodo del 25 sept?.? 2026/.test(mail.html), mail.html);
  assert.ok(!mail.html.includes('Casa admin'), 'el admin no recibe ni se mezcla');
  assert.ok(!sent.some(m => m.to === 'b@test.invalid'), 'b solo tiene algo atrasado: sin correo');
  assert.deepEqual(memory.prepare(`SELECT "userId", "day", "status", "itemCount" FROM "ExpenseReminderDelivery"`).all().map(r => ({ ...r })),
    [{ userId: 'a', day: today, status: 'sent', itemCount: 3 }]);
  // Mismo día otra vez: no duplica.
  result = await runExpenseReminders(today);
  assert.deepEqual([result.sent, result.skipped, sent.length], [0, 1, 1]);
  // Pagar el periodo y pasar el mantenimiento a «en proceso» → al día siguiente nada que avisar.
  insert('ExpenseEntry', { id: 'e1', propertyId: 'pa', recurringExpenseId: 'r1', typeId: 'luz', date: today, amount: '1234.50', paid: 1, paidAt: today, createdBy: 'a', createdAt: 'x' });
  memory.prepare(`UPDATE "Maintenance" SET "status" = 'en_proceso'`).run();
  result = await runExpenseReminders('2026-11-26');
  assert.deepEqual([result.sent, result.failed, result.skipped], [0, 0, 0]);
  // Fallo de envío: queda 'failed', no lanza, y libera el hueco para reintentar el mismo día.
  memory.prepare(`UPDATE "Maintenance" SET "status" = 'pendiente', "startDate" = '2026-11-30'`).run();
  globalThis.__testMailer = async () => { throw new Error('Resend 422: dominio no verificado'); };
  result = await runExpenseReminders('2026-11-27');
  assert.deepEqual([result.sent, result.failed, result.results[0].error], [0, 1, 'Resend 422: dominio no verificado']);
  globalThis.__testMailer = async message => { sent.push(message); };
  result = await runExpenseReminders('2026-11-27');
  assert.equal(result.sent, 1, 'reintento tras fallo');
  assert.deepEqual(memory.prepare(`SELECT "status" FROM "ExpenseReminderDelivery" WHERE "day" = '2026-11-27' ORDER BY "status"`).all().map(r => r.status), ['failed', 'sent']);

  // 3) Cron diario: CRON_SECRET obligatorio y el resumen trae los avisos.
  process.env.CRON_SECRET = 'secreto-de-prueba-123456';
  const call = (auth, qs = '') => cron.GET(new Request(`http://localhost/api/cron/daily${qs}`, { headers: auth ? { authorization: auth } : {} }));
  assert.equal((await call('Bearer otro')).status, 401);
  memory.prepare(`UPDATE "Maintenance" SET "startDate" = '2026-12-05'`).run();
  const res = await call('Bearer secreto-de-prueba-123456', '?today=2026-12-02');
  const out = await res.json();
  assert.equal(out.expenseReminders.day, '2026-12-02');
  assert.equal(out.expenseReminders.sent, 1, JSON.stringify(out));
  // Si la tabla falta (deploy antes del SQL), solo falla este paso y el cron responde 500 con los demás datos.
  memory.exec(`ALTER TABLE "ExpenseReminderDelivery" RENAME TO "ExpenseReminderDelivery_x"`);
  const broken = await call('Bearer secreto-de-prueba-123456', '?today=2026-12-07');
  memory.exec(`ALTER TABLE "ExpenseReminderDelivery_x" RENAME TO "ExpenseReminderDelivery"`);
  memory.prepare(`UPDATE "Maintenance" SET "startDate" = '2026-12-10'`).run();
  assert.equal(broken.status, 500);
  const brokenBody = await broken.json();
  assert.deepEqual(brokenBody.expenseReminders, { error: 'error', day: '2026-12-07' });
  assert.ok(brokenBody.ical && !brokenBody.ical.error, 'el iCal corrió igual');

  // 4) Textos en los tres idiomas con las mismas llaves; SQL con el índice único parcial.
  const keys = locale => Object.keys(JSON.parse(fs.readFileSync(path.join(root, `apps/web/messages/${locale}.json`), 'utf8')).expenseReminders).sort();
  assert.deepEqual(keys('en'), keys('es'));
  assert.deepEqual(keys('fr'), keys('es'));
  const sqlText = fs.readFileSync(path.join(root, 'scripts/sql/expense-reminders.sql'), 'utf8');
  assert.match(sqlText, /CREATE UNIQUE INDEX IF NOT EXISTS "ExpenseReminderDelivery_once"\s+ON "ExpenseReminderDelivery" \("userId", "day"\) WHERE "status" IN \('pending', 'sent'\)/);
  console.log('test-expense-reminders OK');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
