// T-5248: mantenimientos y gastos por casa (fase 1). Offline: reglas puras, permisos (corte por casa), API real sobre
// SQLite en memoria, página (404 ajena) y pantalla en es/en/fr. Lo que SQLite no reproduce (CHECK, índice único
// lower(name) → 409, FKs) queda en scripts/sql/property-expenses.sql y se verifica al aplicarlo en Respaldo.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { load, memory, req, setSession, portal } = require('./test-property-access.cjs');
const { getTableConfig } = req('drizzle-orm/pg-core');
const React = req('react');
const { renderToStaticMarkup } = req('react-dom/server');
const { NextIntlClientProvider } = req('next-intl');

const root = path.join(__dirname, '..');
// Tablas nuevas en la BD en memoria del arnés (mismo criterio: números REAL, resto TEXT).
for (const name of ['expenseTypes', 'recurringExpenses', 'expenseEntries', 'maintenances', 'expenseAttachments']) {
  const config = getTableConfig(portal[name]);
  memory.exec(`CREATE TABLE IF NOT EXISTS "${config.name}" (${config.columns.map(column => `"${column.name}" ${/integer|boolean|double/.test(column.getSQLType()) ? 'REAL' : 'TEXT'}${column.primary ? ' PRIMARY KEY' : ''}`).join(', ')})`);
}
memory.exec(`INSERT INTO "ExpenseType" ("id", "name", "fixed", "active") VALUES ('luz', 'Luz', 1, 1), ('agua', 'Agua', 1, 1), ('viejo', 'Viejo', 0, 0)`);

const rules = load('apps/web/src/lib/property-expenses-rules.ts');
const create = load('apps/web/src/app/api/properties/[id]/expenses/route.ts');
const item = load('apps/web/src/app/api/properties/[id]/expenses/[kind]/[itemId]/route.ts');
const types = load('apps/web/src/app/api/panel/expense-types/route.ts');
const page = load('apps/web/src/app/[locale]/panel/propiedades/[id]/gastos/page.tsx').default;
const { loadPropertyExpenses } = load('apps/web/src/lib/property-expenses.ts');
const PropertyExpenses = load('apps/web/src/components/panel/PropertyExpenses.tsx').default;

const as = id => setSession(id ? { user: { id } } : null);
const request = (body, method = 'POST') => new Request('http://localhost/test', { method, headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
const post = async (property, body) => { const res = await create.POST(request(body), { params: Promise.resolve({ id: property }) }); return { status: res.status, body: await res.json() }; };
const change = async (property, kind, id, body) => (await item.PATCH(request(body, 'PATCH'), { params: Promise.resolve({ id: property, kind, itemId: id }) })).status;
const drop = async (property, kind, id) => (await item.DELETE(request(undefined, 'DELETE'), { params: Promise.resolve({ id: property, kind, itemId: id }) })).status;
const row = (table, id) => memory.prepare(`SELECT * FROM "${table}" WHERE id = ?`).get(id);
const count = table => memory.prepare(`SELECT count(*) n FROM "${table}"`).get().n;
const manager = id => ({ id, role: id === 'admin' ? 'ADMIN' : 'COLLABORATOR', canPublishProperties: false });

async function main() {
  // 1) Listas idénticas en las reglas (las usa el cliente), el esquema y los CHECK del SQL.
  const sqlText = fs.readFileSync(path.join(root, 'scripts/sql/property-expenses.sql'), 'utf8');
  for (const name of ['expensePeriodicities', 'maintenanceKinds', 'maintenanceStatuses']) {
    assert.deepEqual([...rules[name]], [...portal[name]], name);
    for (const value of rules[name]) assert.ok(sqlText.includes(`'${value}'`), `${value} en el SQL`);
  }
  assert.ok(sqlText.includes(`('luz', 'Luz', true), ('agua', 'Agua', true)`), 'el SQL siembra luz y agua como fijos');
  assert.ok(!/from ['"]@portal\/db['"]/.test(fs.readFileSync(path.join(root, 'apps/web/src/lib/property-expenses-rules.ts'), 'utf8')), 'las reglas no arrastran la BD al cliente');

  // 2) Reglas puras.
  const { nextDueDate: next, overBudget, expenseTotals, maintenanceInput, recurringInput, entryInput } = rules;
  assert.equal(next('2026-01-15', 'mensual', '2026-01-10'), '2026-01-15', 'todavía no empieza');
  assert.equal(next('2026-01-15', 'mensual', '2026-01-15'), '2026-01-15', 'hoy toca');
  assert.equal(next('2026-01-15', 'mensual', '2026-03-16'), '2026-04-15');
  assert.equal(next('2026-01-31', 'mensual', '2026-02-01'), '2026-02-28', 'el 31 cae al último día de febrero');
  assert.equal(next('2026-01-31', 'mensual', '2026-03-01'), '2026-03-31', 'y vuelve al 31 (cada paso se cuenta desde el inicio)');
  assert.equal(next('2026-01-10', 'bimestral', '2026-02-01'), '2026-03-10');
  assert.equal(next('2026-01-10', 'trimestral', '2026-11-24'), '2027-01-10');
  assert.equal(next('2024-02-29', 'anual', '2025-01-01'), '2025-02-28', 'año no bisiesto');
  assert.equal(next('2026-11-02', 'semanal', '2026-11-24'), '2026-11-30');
  assert.equal(next('2026-11-02', 'semanal', '2026-11-23'), '2026-11-23');
  assert.equal(overBudget('1000.00', '1000.01'), true);
  assert.equal(overBudget('1000.00', '1000.00'), false, 'igual no es «sobre»');
  assert.equal(overBudget(null, '5.00'), false, 'sin presupuesto no hay alerta');
  assert.equal(overBudget('5.00', null), false);
  assert.deepEqual(expenseTotals([{ amount: '0.10', paid: true }, { amount: '0.20', paid: true }, { amount: '1234.55', paid: false }]),
    { paid: '0.30', pending: '1234.55', total: '1234.85' }, 'centavos exactos (0.1 + 0.2)');
  assert.deepEqual(maintenanceInput({ title: ' Pintar fachada ', kind: 'puntual', budget: '15000' }),
    { title: 'Pintar fachada', kind: 'puntual', status: 'pendiente', budget: '15000.00' });
  for (const bad of [{ kind: 'puntual' }, { title: 'x', kind: 'otro' }, { title: 'x', kind: 'puntual', budget: '-1' }, { title: 'x', kind: 'puntual', budget: '1,000' },
    { title: 'x', kind: 'puntual', startDate: '2026-05-02', endDate: '2026-05-01' }, { title: 'x', kind: 'puntual', startDate: '2026-02-30' }, { title: 'x', kind: 'puntual', extra: 1 }]) {
    assert.throws(() => maintenanceInput(bad), undefined, JSON.stringify(bad));
  }
  assert.throws(() => maintenanceInput({}, true), undefined, 'una edición vacía no es válida');
  assert.deepEqual(maintenanceInput({ actualCost: null }, true), { actualCost: null }, 'se puede borrar el costo');
  assert.deepEqual(recurringInput({ typeId: 'luz', periodicity: 'bimestral', startDate: '2026-01-10' }), { typeId: 'luz', periodicity: 'bimestral', startDate: '2026-01-10' });
  assert.throws(() => recurringInput({ typeId: 'luz', periodicity: 'quincenal', startDate: '2026-01-10' }));
  assert.deepEqual(entryInput({ typeId: 'luz', date: '2026-11-01', amount: '850.5', paid: true }, '2026-11-24'),
    { typeId: 'luz', date: '2026-11-01', amount: '850.50', paid: true, paidAt: '2026-11-24' }, 'pagado sin fecha → hoy');
  assert.equal(entryInput({ typeId: 'luz', date: '2026-11-01', amount: '1' }, '2026-11-24').paid, false, 'por omisión, sin pagar');
  assert.deepEqual(entryInput({ paid: false }, '2026-11-24', true), { paid: false, paidAt: null }, 'desmarcar borra la fecha');
  assert.throws(() => entryInput({ typeId: 'luz', date: '2026-11-01' }, '2026-11-24'), undefined, 'el cargo exige monto');
  assert.throws(() => entryInput({ typeId: 'luz', date: '2026-11-01', amount: '1', paidAt: '2026-11-02' }, '2026-11-24'), undefined, 'fecha de pago sin pagado');
  // Periodo que toca pagar hoy (botón «Registrar pago del …»): el último vencimiento ya pasado.
  const current = rules.currentDueDate;
  assert.equal(current('2026-01-10', 'bimestral', '2026-11-24'), '2026-11-10', 'el próximo sería 10-ene; el actual es 10-nov');
  assert.equal(current('2026-01-10', 'bimestral', '2026-11-10'), '2026-11-10', 'el día del vencimiento');
  assert.equal(current('2026-01-10', 'bimestral', '2026-11-09'), '2026-09-10');
  assert.equal(current('2026-12-01', 'mensual', '2026-11-24'), '2026-12-01', 'aún no empieza → el primero');
  assert.equal(current('2026-01-31', 'mensual', '2026-03-15'), '2026-02-28', 'fin de mes');
  assert.equal(current('2026-11-02', 'semanal', '2026-11-24'), '2026-11-23');
  assert.equal(current('2026-11-02', 'semanal', '2026-11-29'), '2026-11-23');
  assert.equal(current('2024-02-29', 'anual', '2026-03-01'), '2026-02-28');
  assert.equal(current('2026-01-10', 'trimestral', '2026-11-24'), '2026-10-10');
  // Revisión de seguridad/dinero: año 0000 (Postgres lo rechaza con 500), pago en el futuro, desmarcar con fecha.
  for (const bad of ['0000-01-01', '1899-12-31', '3000-01-01']) assert.equal(rules.isCivilDate(bad), false, bad);
  assert.equal(rules.isCivilDate('2026-02-28'), true);
  assert.throws(() => entryInput({ typeId: 'luz', date: '0000-01-01', amount: '1' }, '2026-11-24'), undefined, 'año 0000 → 400, no 500');
  assert.throws(() => entryInput({ typeId: 'luz', date: '2026-11-01', amount: '1', paid: true, paidAt: '2026-11-25' }, '2026-11-24'), undefined, 'pago en el futuro');
  assert.throws(() => entryInput({ paid: false, paidAt: '2026-11-02' }, '2026-11-24', true), undefined, 'sin pagar pero con fecha');
  console.log('reglas OK');

  // 3) Permisos: sin sesión 401; huésped/visor 403; dueño con casa ajena 404 sin escribir; registro desconocido 404.
  const job = { record: 'maintenance', title: 'Impermeabilizar', kind: 'puntual', budget: '20000' };
  as(null); assert.equal((await post('pa', job)).status, 401);
  for (const id of ['client', 'viewer']) { as(id); assert.equal((await post('pa', job)).status, 403, id); }
  as('b'); assert.equal((await post('pa', job)).status, 404, 'casa ajena');
  as('a'); assert.equal((await post('pa', { ...job, record: 'otro' })).status, 404, 'registro desconocido');
  assert.equal((await post('pa', { title: 'x', kind: 'puntual' })).status, 400, 'sin record');
  assert.equal((await post('pa', { ...job, kind: undefined })).status, 400, 'falta el tipo de trabajo');
  assert.equal(count('Maintenance'), 0, 'nada se escribió');
  console.log('permisos OK');

  // 4) Mantenimiento: alta, estado, costo real → sobre presupuesto; otro dueño no lo toca ni con el id.
  let res = await post('pa', job);
  assert.equal(res.status, 201);
  const jobId = res.body.id;
  assert.deepEqual([row('Maintenance', jobId).status, row('Maintenance', jobId).budget, row('Maintenance', jobId).createdBy], ['pendiente', '20000.00', 'a']);
  assert.equal(await change('pa', 'maintenance', jobId, { status: 'en_proceso', actualCost: '23500.50' }), 200);
  assert.deepEqual([row('Maintenance', jobId).status, row('Maintenance', jobId).actualCost], ['en_proceso', '23500.50']);
  assert.equal(await change('pa', 'maintenance', jobId, { status: 'pausado' }), 400);
  assert.equal(await change('pa', 'maintenance', jobId, { endDate: '2026-01-01', startDate: '2026-02-01' }), 400, 'fin antes del inicio');
  assert.equal(await change('pa', 'maintenance', jobId, { startDate: '2026-02-01' }), 200);
  assert.equal(await change('pa', 'maintenance', jobId, { endDate: '2026-01-31' }), 400, 'el fin nuevo se compara con el inicio guardado');
  as('b');
  assert.equal(await change('pa', 'maintenance', jobId, { status: 'cancelado' }), 404, 'otro dueño, casa ajena');
  assert.equal(await change('pb', 'maintenance', jobId, { status: 'cancelado' }), 404, 'otro dueño, su casa pero registro ajeno');
  assert.equal(await drop('pb', 'maintenance', jobId), 404);
  assert.equal(row('Maintenance', jobId).status, 'en_proceso', 'no cambió');
  as('admin');
  assert.equal(await change('pa', 'maintenance', jobId, { notes: 'Revisó el ADMIN' }), 200, 'el ADMIN ve todas');
  console.log('mantenimientos OK');

  // 5) Gasto recurrente: tipo activo obligatorio; desactivar y reactivar.
  as('a');
  assert.equal((await post('pa', { record: 'recurring', typeId: 'viejo', periodicity: 'mensual', startDate: '2026-01-01' })).status, 400, 'tipo desactivado');
  assert.equal((await post('pa', { record: 'recurring', typeId: 'no-existe', periodicity: 'mensual', startDate: '2026-01-01' })).status, 400);
  res = await post('pa', { record: 'recurring', typeId: 'luz', periodicity: 'bimestral', amount: '1200', startDate: '2026-01-10' });
  assert.equal(res.status, 201);
  const luzId = res.body.id;
  assert.equal(await change('pa', 'recurring', luzId, { active: false }), 200);
  assert.equal(row('RecurringExpense', luzId).active, 0);
  assert.equal(await change('pa', 'recurring', luzId, { active: true }), 200);
  const other = await (async () => { as('b'); const r = await post('pb', { record: 'recurring', typeId: 'agua', periodicity: 'mensual', startDate: '2026-01-01' }); as('a'); return r.body.id; })();
  console.log('gastos recurrentes OK');

  // 6) Cargos: casilla «pagado»; ligar a un recurrente de OTRA casa → 400.
  assert.equal((await post('pa', { record: 'entry', typeId: 'luz', recurringExpenseId: other, date: '2026-11-10', amount: '980' })).status, 400, 'recurrente de otra casa');
  res = await post('pa', { record: 'entry', typeId: 'luz', recurringExpenseId: luzId, date: '2026-11-10', amount: '980.40' });
  assert.equal(res.status, 201);
  const entryId = res.body.id;
  assert.deepEqual([row('ExpenseEntry', entryId).paid, row('ExpenseEntry', entryId).paidAt], [0, null]);
  assert.equal(await change('pa', 'entry', entryId, { paidAt: '2026-11-11' }), 400, 'fecha de pago sin estar pagado');
  assert.equal(await change('pa', 'entry', entryId, { paid: true }), 200);
  assert.equal(row('ExpenseEntry', entryId).paid, 1);
  assert.match(row('ExpenseEntry', entryId).paidAt, /^\d{4}-\d{2}-\d{2}$/, 'fecha de pago = hoy en México');
  assert.equal(await change('pa', 'entry', entryId, { paidAt: '2026-11-11' }), 200, 'corregir la fecha de un pagado');
  assert.equal(row('ExpenseEntry', entryId).paidAt, '2026-11-11');
  // Revisión: volver a marcar «pagado» conserva la fecha real; un pagado nunca queda sin fecha.
  assert.equal(await change('pa', 'entry', entryId, { paid: true }), 200);
  assert.equal(row('ExpenseEntry', entryId).paidAt, '2026-11-11', 'no se cambia por hoy');
  assert.equal(await change('pa', 'entry', entryId, { paidAt: null }), 400, 'pagado sin fecha');
  assert.equal(row('ExpenseEntry', entryId).paidAt, '2026-11-11');
  res = await post('pa', { record: 'entry', typeId: 'agua', date: '2026-11-05', amount: '310', paid: false });
  assert.equal(res.status, 201);
  assert.equal(await change('pa', 'entry', entryId, { paid: false }), 200);
  assert.deepEqual([row('ExpenseEntry', entryId).paid, row('ExpenseEntry', entryId).paidAt], [0, null], 'desmarcar borra la fecha');
  assert.equal(await change('pa', 'entry', entryId, { paid: true }), 200);
  console.log('cargos OK');

  // 7) Lectura con corte: el dueño ve lo suyo; el otro dueño no ve la casa; el ADMIN sí.
  const data = await loadPropertyExpenses('pa', manager('a'));
  assert.deepEqual([data.maintenances.length, data.recurring.length, data.entries.length], [1, 1, 2]);
  assert.deepEqual(data.types.map(type => type.id).slice(0, 2).sort(), ['agua', 'luz'], 'fijos primero');
  await assert.rejects(() => loadPropertyExpenses('pa', manager('b')), error => error.status === 404);
  assert.equal((await loadPropertyExpenses('pa', manager('admin'))).entries.length, 2);
  as('a');
  const own = await page({ params: Promise.resolve({ locale: 'es', id: 'pa' }) });
  assert.ok(own && own.props, 'el dueño abre la página de su casa');
  as('b');
  await assert.rejects(() => page({ params: Promise.resolve({ locale: 'es', id: 'pa' }) }), error => error.status === 404, 'página de casa ajena → 404');
  // Revisión: los totales cuentan TODOS los cargos, aunque la lista se recorte a 200.
  const insertEntry = memory.prepare(`INSERT INTO "ExpenseEntry" ("id", "propertyId", "typeId", "date", "amount", "paid", "createdBy", "createdAt") VALUES (?, 'hidden', 'agua', ?, ?, ?, 'a', '2026-11-24')`);
  insertEntry.run('old-pending', '2020-01-01', '5000.00', 0);
  for (let i = 0; i < 204; i++) insertEntry.run('bulk-' + i, '2026-10-' + String(1 + (i % 28)).padStart(2, '0'), '1.00', 1);
  const big = await loadPropertyExpenses('hidden', manager('a'));
  assert.equal(big.entries.length, 200, 'la lista se recorta');
  assert.equal(big.truncated, true);
  assert.ok(!big.entries.some(entry => entry.id === 'old-pending'), 'el pendiente viejo queda fuera de la lista…');
  assert.deepEqual(big.totals, { paid: '204.00', pending: '5000.00', total: '5204.00' }, '…pero dentro de los totales');
  assert.equal((await loadPropertyExpenses('pa', manager('a'))).truncated, false);
  console.log('lectura y página OK');

  // 8) Catálogo: solo el ADMIN agrega tipos.
  as('a');
  assert.equal((await types.POST(request({ name: 'Internet' }))).status, 403);
  as('admin');
  assert.equal((await types.POST(request({ name: '' }))).status, 400);
  assert.equal((await types.POST(request({ name: 'Internet' }))).status, 201);
  assert.ok(memory.prepare(`SELECT 1 FROM "ExpenseType" WHERE name = 'Internet'`).get());
  console.log('catálogo OK');

  // 9) Borrar: el dueño borra lo suyo.
  as('a');
  assert.equal(await drop('pa', 'entry', res.body.id), 200);
  assert.equal(row('ExpenseEntry', res.body.id), undefined);

  // 10) Pantalla en es/en/fr: totales, alerta «sobre presupuesto», próximo pago y casilla de pagado. Sin claves faltantes.
  const screen = await loadPropertyExpenses('pa', manager('a'));
  for (const locale of ['es', 'en', 'fr']) {
    const messages = JSON.parse(fs.readFileSync(path.join(root, 'apps/web/messages/' + locale + '.json'), 'utf8'));
    assert.ok(messages.panel.expenses, locale + ': enlace «Gastos»');
    const html = renderToStaticMarkup(React.createElement(NextIntlClientProvider, { locale, messages, timeZone: 'America/Mexico_City', onError(error) { throw error; } },
      React.createElement(PropertyExpenses, { propertyId: 'pa', data: screen, today: '2026-11-24', isAdmin: locale === 'es' })));
    for (const section of ['maintenance', 'recurring', 'entry']) assert.ok(html.includes(`data-expenses-section="${section}"`), locale + ' ' + section);
    assert.ok(html.includes('data-over-budget'), locale + ': 23,500.50 > 20,000 → alerta');
    assert.ok(html.includes(messages.expenses.overBudget));
    assert.ok(/data-total="paid"[^>]*>\$980/.test(html), locale + ': pagado = 980.40');
    assert.ok(html.includes(messages.expenses.periodicities.bimestral));
    assert.ok(/<input type="checkbox"[^>]*checked=""/.test(html), locale + ': cargo pagado marcado');
    assert.equal(html.includes('/api/panel/expense-types') || html.includes(messages.expenses.addType), locale === 'es', 'solo el ADMIN ve «agregar tipo»');
    assert.ok(!html.includes('Viejo'), 'un tipo desactivado no se ofrece');
    // «Pagos» (antes «Cargos») y el botón del periodo: la luz bimestral desde 10-ene ya tiene su pago del 10-nov.
    assert.ok(html.includes(`>${messages.expenses.entriesTitle}</h2>`), locale + ': sección «Pagos»');
    assert.ok(html.includes('data-period-registered'), locale + ': el pago del periodo ya está → sin botón');
    assert.ok(!html.includes('data-register-period'));
    const empty = renderToStaticMarkup(React.createElement(NextIntlClientProvider, { locale, messages, timeZone: 'America/Mexico_City', onError(error) { throw error; } },
      React.createElement(PropertyExpenses, { propertyId: 'pa', data: { ...screen, entries: [] }, today: '2026-11-24', isAdmin: false })));
    assert.ok(empty.includes('data-register-period="2026-11-10"'), locale + ': sin pago del periodo → botón con la fecha del periodo');
    assert.ok(empty.includes('id="registrar-pago"'), 'el formulario al que lleva el botón');
  }
  console.log('pantalla es/en/fr OK');
  console.log('test-property-expenses OK');
}
main().catch(error => { console.error(error); process.exit(1); });
