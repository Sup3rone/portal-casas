// T-5248 (fase 3): reporte mensual de gastos y mantenimientos del COLABORADOR. Offline sobre SQLite en memoria:
// reglas del mes, corte por casa, solo COLLABORATOR (el ADMIN solo administra funcionalidades → 403), Excel (ZIP real),
// sección en /panel/reporte y segundo adjunto en el correo mensual (sin romper el de comisiones si falla).
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { load, memory, mockModule, portal, setSession } = require('./test-property-access.cjs');

const sent = [];
mockModule('@/lib/mailer', { sendEmail: async message => { sent.push(message); } });
const query = portal.db.$client.query; // SQLite: jsonb_array_length → json_array_length (como test-monthly-report)
portal.db.$client.query = (sql, values, options) => query(sql.replace(/jsonb_array_length/g, 'json_array_length'), values, options);

const lib = load('apps/web/src/lib/expense-report.ts');
const xlsx = load('apps/web/src/lib/xlsx.ts');
const service = load('apps/web/src/lib/expense-report-service.ts');
const monthly = load('apps/web/src/lib/monthly-report-service.ts');
const download = load('apps/web/src/app/api/panel/reports/expenses/route.ts');
const page = load('apps/web/src/app/[locale]/panel/reporte/page.tsx').default;

// T-5417: texto de un PDF del generador propio (cadenas hex de los Tj en cp1252), independiente de lib/pdf.ts.
const pdfText = buffer => {
  const raw = Buffer.from(buffer).toString('latin1');
  assert.ok(raw.startsWith('%PDF-1.4'), 'es un PDF');
  return [...raw.matchAll(/<([0-9A-F]*)> Tj/g)].map(([, hex]) => new TextDecoder('windows-1252').decode(Buffer.from(hex, 'hex'))).join(' | ');
};
// Lector ZIP independiente del generador (mismo que test-monthly-report).
function unzip(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength), files = {};
  const eocd = bytes.length - 22, count = view.getUint16(eocd + 10, true);
  let at = view.getUint32(eocd + 16, true);
  for (let i = 0; i < count; i++) {
    const crc = view.getUint32(at + 16, true), size = view.getUint32(at + 20, true), nameLength = view.getUint16(at + 28, true), offset = view.getUint32(at + 42, true);
    const name = Buffer.from(bytes.subarray(at + 46, at + 46 + nameLength)).toString('utf8');
    const data = bytes.subarray(offset + 30 + view.getUint16(offset + 26, true) + view.getUint16(offset + 28, true), offset + 30 + view.getUint16(offset + 26, true) + view.getUint16(offset + 28, true) + size);
    assert.equal(xlsx.crc32(data), crc, 'CRC ' + name);
    files[name] = Buffer.from(data).toString('utf8');
    at += 46 + nameLength;
  }
  return files;
}
const sheetText = bytes => unzip(bytes)['xl/worksheets/sheet1.xml'];
function findAll(node, test, out = []) {
  if (!node || typeof node !== 'object') return out;
  if (Array.isArray(node)) { for (const child of node) findAll(child, test, out); return out; }
  if (test(node)) out.push(node);
  findAll(node.props?.children, test, out);
  return out;
}
const text = node => typeof node === 'string' || typeof node === 'number' ? String(node) : Array.isArray(node) ? node.map(text).join('') : node?.props ? text(node.props.children) : '';

const insert = (table, row) => memory.prepare(`INSERT INTO "${table}" (${Object.keys(row).map(k => `"${k}"`).join(',')}) VALUES (${Object.keys(row).map(() => '?').join(',')})`).run(...Object.values(row));
const as = id => setSession(id ? { user: { id } } : null);
const collab = id => ({ id, role: 'COLLABORATOR', canPublishProperties: false });

insert('ExpenseType', { id: 'luz', name: 'Luz', fixed: 1, active: 1 });
insert('ExpenseType', { id: 'agua', name: 'Agua', fixed: 1, active: 1 });
// Casa pa (dueño a): dos pagos en nov (uno pagado), uno en oct. Casa pb (dueño b): uno en nov.
insert('ExpenseEntry', { id: 'e1', propertyId: 'pa', typeId: 'luz', date: '2026-11-05', amount: '980.40', paid: 1, paidAt: '2026-11-06', recurringExpenseId: 'r1', createdBy: 'a' });
insert('ExpenseEntry', { id: 'e2', propertyId: 'pa', typeId: 'agua', date: '2026-11-30', amount: '310.00', paid: 0, createdBy: 'a' });
insert('ExpenseEntry', { id: 'e3', propertyId: 'pa', typeId: 'luz', date: '2026-10-31', amount: '500.00', paid: 1, createdBy: 'a' });
insert('ExpenseEntry', { id: 'e4', propertyId: 'pb', typeId: 'luz', date: '2026-11-10', amount: '999.00', paid: 0, createdBy: 'b' });
// Mantenimientos de pa: m1 activo desde oct (sobre presupuesto), m2 terminado en oct, m3 sin fechas creado en nov.
insert('Maintenance', { id: 'm1', propertyId: 'pa', title: 'Impermeabilizar', kind: 'puntual', status: 'en_proceso', budget: '100.00', actualCost: '150.00', startDate: '2026-10-01', createdBy: 'a', createdAt: '2026-10-01T12:00:00Z' });
insert('Maintenance', { id: 'm2', propertyId: 'pa', title: 'Pintar', kind: 'puntual', status: 'terminado', startDate: '2026-10-01', endDate: '2026-10-15', createdBy: 'a', createdAt: '2026-10-01T12:00:00Z' });
insert('Maintenance', { id: 'm3', propertyId: 'pa', title: 'Jardín', kind: 'recurrente', status: 'pendiente', createdBy: 'a', createdAt: '2026-11-12T12:00:00Z' });
memory.prepare(`UPDATE "User" SET "reportEmails" = ? WHERE id = 'a'`).run(JSON.stringify(['conta@empresa.mx']));

(async () => {
  try {
    // 1) Reglas del mes.
    const m = (status, startDate, endDate, createdOn = '2026-01-01') => ({ status, startDate, endDate, createdOn });
    assert.equal(lib.maintenanceInMonth(m('en_proceso', '2026-10-01', null), '2026-11'), true, 'abierto desde antes');
    assert.equal(lib.maintenanceInMonth(m('terminado', '2026-10-01', '2026-10-31'), '2026-11'), false, 'terminó antes');
    assert.equal(lib.maintenanceInMonth(m('terminado', '2026-10-01', '2026-11-01'), '2026-11'), true, 'termina el día 1');
    assert.equal(lib.maintenanceInMonth(m('pendiente', '2026-12-01', null), '2026-11'), false, 'empieza después');
    assert.equal(lib.maintenanceInMonth(m('pendiente', null, null, '2026-11-12'), '2026-11'), true, 'sin fechas: desde que se creó');
    assert.equal(lib.maintenanceInMonth(m('cancelado', null, null, '2026-09-12'), '2026-11'), false, 'cancelado antes, sin fechas');
    assert.equal(lib.maintenanceInMonth(m('pendiente', null, null, '2026-12-01'), '2026-11'), false, 'creado después');
    console.log('reglas OK');

    // 2) Datos con el corte: a ve solo pa; b solo pb.
    const report = await service.loadExpenseReport(collab('a'), '2026-11');
    assert.deepEqual(report.groups.map(g => g.propertyId), ['pa']);
    const [group] = report.groups;
    assert.deepEqual(group.payments.map(p => p.id), ['e1', 'e2'], 'solo pagos de noviembre, por fecha');
    assert.deepEqual(group.maintenances.map(x => x.id).sort(), ['m1', 'm3'], 'm2 terminó en octubre');
    assert.deepEqual([report.totals.paid, report.totals.pending, report.totals.total, report.totals.budget, report.totals.actualCost, report.totals.overBudget],
      ['980.40', '310.00', '1290.40', '100.00', '150.00', 1]);
    assert.equal(group.payments[0].recurring, true);
    const other = await service.loadExpenseReport(collab('b'), '2026-11');
    assert.deepEqual([other.groups.map(g => g.propertyId), other.totals.pending], [['pb'], '999.00']);
    assert.equal((await service.loadExpenseReport(collab('a'), '2025-01')).groups.length, 0);
    console.log('datos y corte OK');

    // 3) Descarga: solo COLLABORATOR; mes válido; Excel con sus datos y sin los de otra casa.
    const get = qs => download.GET(new Request(`http://localhost/api/panel/reports/expenses?${qs}`));
    as(null); assert.equal((await get('month=2026-11')).status, 401);
    as('admin'); assert.equal((await get('month=2026-11')).status, 403, 'el ADMIN no recibe reportes de colaboradores');
    as('client'); assert.equal((await get('month=2026-11')).status, 403);
    as('a'); assert.equal((await get('month=nov')).status, 400);
    const res = await get('month=2026-11&locale=es');
    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-disposition'), /reporte-gastos-2026-11\.xlsx/);
    const sheet = sheetText(new Uint8Array(await res.arrayBuffer()));
    for (const expected of ['Pagos del mes', 'Mantenimientos activos en el mes', 'Luz', 'Agua', 'Impermeabilizar', 'Jardín', 'En proceso', '980.40', '310.00']) assert.ok(sheet.includes(expected), expected);
    assert.ok(!sheet.includes('Pintar') && !sheet.includes('999'), 'ni lo de otro mes ni lo de otra casa');
    const en = sheetText(new Uint8Array(await (await get('month=2026-11&locale=en')).arrayBuffer()));
    assert.ok(en.includes('Payments this month') && en.includes('In progress'), 'Excel en el idioma del panel');
    // T-5417: la misma descarga en PDF.
    const pdfRes = await get('month=2026-11&locale=es&format=pdf');
    assert.deepEqual([pdfRes.status, pdfRes.headers.get('content-type')], [200, 'application/pdf']);
    assert.match(pdfRes.headers.get('content-disposition'), /reporte-gastos-2026-11\.pdf/);
    const pdfBody = pdfText(await pdfRes.arrayBuffer());
    for (const expected of ['Gastos y mantenimientos — 2026-11', 'Pagos del mes', 'Impermeabilizar', 'Jardín', 'En proceso', '980.40', '310.00']) assert.ok(pdfBody.includes(expected), `PDF: ${expected}`);
    assert.ok(!pdfBody.includes('Pintar') && !pdfBody.includes('999'), 'PDF: ni lo de otro mes ni lo de otra casa');
    assert.equal((await get('month=2026-11&format=doc')).status, 400, 'formato desconocido');
    console.log('descarga OK');

    // 4) Página /panel/reporte: sección de gastos con totales y enlace de descarga.
    const tree = await page({ params: Promise.resolve({ locale: 'es' }), searchParams: Promise.resolve({ month: '2026-11' }) });
    const section = findAll(tree, n => n.props?.['data-expense-report'] !== undefined)[0];
    assert.ok(section, 'sección de gastos');
    assert.equal(text(findAll(section, n => n.props?.['data-testid'] === 'expense-paid')[0]), '$980.40 MXN');
    assert.equal(text(findAll(section, n => n.props?.['data-testid'] === 'expense-pending')[0]), '$310.00 MXN');
    assert.equal(text(findAll(section, n => n.props?.['data-testid'] === 'expense-overBudget')[0]), '1');
    assert.ok(findAll(section, n => n.type === 'a' && /\/api\/panel\/reports\/expenses\?month=2026-11&locale=es/.test(n.props.href)).length, 'enlace');
    assert.ok(findAll(section, n => n.type === 'a' && /\/api\/panel\/reports\/expenses\?month=2026-11&locale=es&format=pdf$/.test(n.props.href)).length, 'enlace PDF de gastos');
    assert.ok(findAll(tree, n => n.type === 'a' && /\/api\/panel\/reports\/monthly\?month=2026-11&locale=es&format=pdf$/.test(n.props.href)).length, 'enlace PDF de comisiones');
    console.log('página OK');

    // 5) Correo mensual: segundo adjunto con gastos; sin gastos en el mes, solo el de comisiones.
    let out = await monthly.deliverMonthlyReport({ id: 'a', name: 'Ana' }, '2026-11', 'manual');
    assert.equal(out.status, 'sent');
    assert.deepEqual(sent[0].attachments.map(a => a.filename),
      ['reporte-comisiones-2026-11.xlsx', 'reporte-comisiones-2026-11.pdf', 'reporte-gastos-2026-11.xlsx', 'reporte-gastos-2026-11.pdf']);
    assert.ok(sheetText(new Uint8Array(sent[0].attachments[2].content)).includes('Impermeabilizar'), 'mismo contenido que la descarga');
    assert.ok(pdfText(sent[0].attachments[3].content).includes('Impermeabilizar'), 'PDF de gastos con el mismo contenido');
    assert.match(sent[0].html, /Gastos del mes: pagado \$980\.40 MXN, por pagar \$310\.00 MXN; 2 mantenimientos activos/);
    out = await monthly.deliverMonthlyReport({ id: 'a', name: 'Ana' }, '2025-01', 'manual');
    assert.deepEqual([out.status, sent[1].attachments.length], ['sent', 2], 'mes sin gastos: solo comisiones (Excel y PDF)');
    // Si el reporte de gastos falla, el de comisiones sale igual.
    memory.exec('ALTER TABLE "Maintenance" RENAME TO "Maintenance_x"');
    out = await monthly.deliverMonthlyReport({ id: 'a', name: 'Ana' }, '2026-11', 'manual');
    memory.exec('ALTER TABLE "Maintenance_x" RENAME TO "Maintenance"');
    assert.deepEqual([out.status, sent[2].attachments.length], ['sent', 2], 'falla el secundario → se manda el principal (Excel y PDF)');
    console.log('correo OK');

    // 6) Textos iguales en es/en/fr.
    const keys = obj => Object.entries(obj).flatMap(([k, v]) => typeof v === 'object' ? keys(v).map(x => `${k}.${x}`) : [k]).sort();
    const es = keys(JSON.parse(fs.readFileSync(path.join(__dirname, '../apps/web/messages/es.json'), 'utf8')).expenseReport);
    for (const lang of ['en', 'fr']) assert.deepEqual(keys(JSON.parse(fs.readFileSync(path.join(__dirname, `../apps/web/messages/${lang}.json`), 'utf8')).expenseReport), es, lang);
    console.log('test-expense-report OK');
  } catch (error) { console.error(error); process.exit(1); }
})();
