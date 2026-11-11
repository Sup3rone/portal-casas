// T-4739: reporte mensual del colaborador — agregados del mes, comisión total, cruces de mes, zona MX,
// contenido del Excel (ZIP/CRC y celdas), destinatarios, envío manual y cron con CRON_SECRET + bitácora.
// SQLite en memoria: no prueba los CHECK/jsonb de PostgreSQL (eso se ensaya con scripts/sql/monthly-commission-report.sql).
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { load, memory, mockModule, portal, setSession } = require('./test-property-access.cjs');

const sent = [];
let failNext = null;
mockModule('@/lib/mailer', { sendEmail: async message => { if (failNext) { const error = new Error(failNext); failNext = null; throw error; } sent.push(message); } });
// SQLite: jsonb_array_length → json_array_length (solo para este test).
const query = portal.db.$client.query;
portal.db.$client.query = (sql, values, options) => query(sql.replace(/jsonb_array_length/g, 'json_array_length'), values, options);
// Mismo índice único parcial que el SQL: una sola reserva de envío automático viva por colaborador y mes.
memory.exec(`CREATE UNIQUE INDEX "ReportDelivery_cron_once" ON "ReportDelivery" ("userId", "month") WHERE "trigger" = 'cron' AND "status" IN ('pending', 'sent')`);

const lib = load('apps/web/src/lib/monthly-report.ts');
const xlsx = load('apps/web/src/lib/xlsx.ts');
const service = load('apps/web/src/lib/monthly-report-service.ts');
const { inquiryToday } = load('apps/web/src/lib/inquiry-validation.ts');
const download = load('apps/web/src/app/api/panel/reports/monthly/route.ts');
const recipientsRoute = load('apps/web/src/app/api/panel/reports/recipients/route.ts');
const sendRoute = load('apps/web/src/app/api/panel/reports/send/route.ts');
const cron = load('apps/web/src/app/api/cron/monthly-report/route.ts');
const page = load('apps/web/src/app/[locale]/panel/reporte/page.tsx').default;

// ---------- lector ZIP/XLSX independiente del generador (solo para verificar) ----------
function unzip(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength), files = {};
  let eocd = bytes.length - 22;
  assert.equal(view.getUint32(eocd, true), 0x06054b50, 'Fin de directorio central');
  const count = view.getUint16(eocd + 10, true);
  let at = view.getUint32(eocd + 16, true);
  for (let i = 0; i < count; i++) {
    assert.equal(view.getUint32(at, true), 0x02014b50);
    const crc = view.getUint32(at + 16, true), size = view.getUint32(at + 20, true), nameLength = view.getUint16(at + 28, true), offset = view.getUint32(at + 42, true);
    const name = Buffer.from(bytes.subarray(at + 46, at + 46 + nameLength)).toString('utf8');
    assert.equal(view.getUint32(offset, true), 0x04034b50, `cabecera local ${name}`);
    const localName = view.getUint16(offset + 26, true), localExtra = view.getUint16(offset + 28, true);
    const data = bytes.subarray(offset + 30 + localName + localExtra, offset + 30 + localName + localExtra + size);
    assert.equal(xlsx.crc32(data), crc, `CRC ${name}`);
    files[name] = Buffer.from(data).toString('utf8');
    at += 46 + nameLength;
  }
  return files;
}
function sheetRows(files) {
  const sheet = files['xl/worksheets/sheet1.xml'];
  return [...sheet.matchAll(/<row r="(\d+)">(.*?)<\/row>/g)].map(([, , body]) => {
    const cells = {};
    for (const [, col, attrs, inner] of body.matchAll(/<c r="([A-Z]+)\d+"([^>]*)>(.*?)<\/c>/g)) {
      const text = /<t[^>]*>(.*?)<\/t>/.exec(inner), number = /<v>(.*?)<\/v>/.exec(inner);
      cells[col] = text ? text[1].replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&') : { number: number[1], style: /s="(\d)"/.exec(attrs)?.[1] };
    }
    return cells;
  });
}

const insert = (table, row) => memory.prepare(`INSERT INTO "${table}" (${Object.keys(row).map(k => `"${k}"`).join(',')}) VALUES (${Object.keys(row).map(() => '?').join(',')})`).run(...Object.values(row));
const json = (body, method = 'POST') => new Request('http://localhost/x', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
const findAll = (node, predicate, out = []) => {
  if (!node || typeof node !== 'object') return out;
  if (Array.isArray(node)) { node.forEach(n => findAll(n, predicate, out)); return out; }
  if (predicate(node)) out.push(node);
  findAll(node.props?.children, predicate, out); return out;
};
const text = node => !node || typeof node !== 'object' ? String(node ?? '') : Array.isArray(node) ? node.map(text).join('') : text(node.props?.children);

(async () => {
  try {
    // 1. Meses, noches y zona horaria (MX, UTC−6 sin horario de verano).
    assert.deepEqual(lib.monthRange('2026-11'), { start: '2026-11-01', end: '2026-12-01', next: '2026-12' });
    assert.deepEqual(lib.monthRange('2026-12'), { start: '2026-12-01', end: '2027-01-01', next: '2027-01' });
    assert.equal(lib.previousMonth('2027-01-01'), '2026-12'); assert.equal(lib.previousMonth('2026-11-15'), '2026-10');
    for (const bad of ['2026-13', '2026-1', '26-11', '', null, '2026-11-01']) assert.equal(lib.isMonth(bad), false, String(bad));
    assert.equal(lib.nightsInMonth('2026-11-30', '2026-12-03', '2026-11'), 1);
    assert.equal(lib.nightsInMonth('2026-11-30', '2026-12-03', '2026-12'), 2);
    assert.equal(lib.nightsInMonth('2026-11-28', '2026-12-01', '2026-12'), 0, 'Salida el día 1: ninguna noche en diciembre');
    // A las 23:30 del 30-nov en CDMX ya es 1-dic en UTC: el cron debe reportar OCTUBRE todavía, no noviembre.
    assert.equal(lib.previousMonth(inquiryToday(new Date('2026-12-01T05:30:00Z'))), '2026-10', 'Hora MX, no UTC');
    assert.equal(lib.previousMonth(inquiryToday(new Date('2026-12-01T13:00:00Z'))), '2026-11', 'Cron 13:00 UTC = 07:00 MX del día 1');
    assert.equal(fs.readFileSync('apps/web/vercel.json', 'utf8').includes('"schedule": "0 13 1 * *"'), true);
    assert.equal(JSON.parse(fs.readFileSync('apps/web/vercel.json', 'utf8')).crons[0].path, '/api/cron/monthly-report');

    // 2. Agregados del mes (calculados a mano).
    const base = { guestName: null, referredBy: null, cleaningCost: null, taxes: null, commissionPercent: null };
    const rows = [
      { ...base, id: 'n1', propertyId: 'p1', propertyTitle: 'Casa Azul', startDate: '2026-11-05', endDate: '2026-11-08', rentAmount: '3000.00', cleaningCost: '500.00', taxes: '560.00', commissionPercent: '10.00', referredBy: 'Ana' },
      { ...base, id: 'n2', propertyId: 'p1', propertyTitle: 'Casa Azul', startDate: '2026-11-29', endDate: '2026-12-02', rentAmount: '4500.00', taxes: '720.00', commissionPercent: '12.50', referredBy: 'Beto' },
      { ...base, id: 'o1', propertyId: 'p1', propertyTitle: 'Casa Azul', startDate: '2026-10-30', endDate: '2026-11-02', rentAmount: '9999.00', taxes: '1599.84', commissionPercent: '50.00' },
      { ...base, id: 'n3', propertyId: 'p2', propertyTitle: 'Brisa', startDate: '2026-11-10', endDate: '2026-11-11', rentAmount: '1234.55' },
      { ...base, id: 'x1', propertyId: 'p2', propertyTitle: 'Brisa', startDate: '2026-12-01', endDate: '2026-12-03', rentAmount: '777.00' },
      { ...base, id: 'x2', propertyId: 'p2', propertyTitle: 'Brisa', startDate: '2026-10-01', endDate: '2026-11-01', rentAmount: '888.00' },
    ];
    const nov = lib.buildMonthlyReport('2026-11', rows);
    assert.deepEqual(nov.groups.map(g => g.propertyTitle), ['Brisa', 'Casa Azul'], 'Agrupado por propiedad, orden alfabético');
    const lines = Object.fromEntries(nov.groups.flatMap(g => g.lines).map(l => [l.id, l]));
    assert.deepEqual(Object.keys(lines).sort(), ['n1', 'n2', 'n3', 'o1'], 'x1 (dic) y x2 (sale el 1-nov) fuera');
    assert.equal(lines.n1.commission, '300.00'); assert.equal(lines.n1.total, '4060.00');
    assert.equal(lines.n2.commission, '562.50'); assert.deepEqual([lines.n2.nightsThisMonth, lines.n2.nights, lines.n2.nightsOtherMonths], [2, 3, 1], 'Cruza a diciembre');
    assert.equal(lines.o1.kind, 'continuation'); assert.equal(lines.o1.countedIn, '2026-10');
    assert.deepEqual([lines.o1.rentAmount, lines.o1.taxes, lines.o1.total, lines.o1.commission], [null, null, null, null], 'Continuación con importes en 0');
    assert.equal(lines.n3.commission, null, 'Sin colaborador, sin comisión');
    const azul = nov.groups.find(g => g.propertyTitle === 'Casa Azul').totals;
    assert.deepEqual(azul, { rentAmount: '7500.00', cleaningCost: '500.00', taxes: '1280.00', total: '9280.00', commission: '862.50', bookings: 2 });
    assert.deepEqual(nov.totals, { rentAmount: '8734.55', cleaningCost: '500.00', taxes: '1280.00', total: '10514.55', commission: '862.50', bookings: 3 }, 'Comisión total del mes = 300 + 562.50');
    const dec = lib.buildMonthlyReport('2026-12', rows);
    const decLines = Object.fromEntries(dec.groups.flatMap(g => g.lines).map(l => [l.id, l]));
    assert.equal(decLines.n2.kind, 'continuation', 'n2 sigue en diciembre como continuación'); assert.equal(decLines.n2.nightsThisMonth, 1);
    assert.equal(dec.totals.commission, '0.00', 'Diciembre no vuelve a contar la comisión de n2');
    assert.equal(dec.totals.rentAmount, '777.00');

    // 3. XLSX: CRC estándar, estructura y celdas.
    assert.equal(xlsx.crc32(new TextEncoder().encode('123456789')), 0xcbf43926, 'CRC-32 de referencia');
    const tiny = unzip(xlsx.buildXlsx('Hoja/1:[x]', [{ bold: true, cells: ['A', 'B'] }, { cells: ['=1+1', { number: '1234.50' }, 7, null, 'x<y&"z"'] }]));
    assert.deepEqual(Object.keys(tiny).sort(), ['[Content_Types].xml', '_rels/.rels', 'xl/_rels/workbook.xml.rels', 'xl/styles.xml', 'xl/workbook.xml', 'xl/worksheets/sheet1.xml']);
    assert.match(tiny['xl/workbook.xml'], /<sheet name="Hoja 1  x " /, 'Nombre de hoja saneado');
    const tinyRows = sheetRows(tiny);
    assert.equal(tinyRows[1].A, "'=1+1", 'Sin inyección de fórmulas');
    assert.deepEqual(tinyRows[1].B, { number: '1234.50', style: '2' }, 'Decimal exacto con formato');
    assert.equal(tinyRows[1].E, 'x<y&"z"', 'Escapado XML');
    for (const content of Object.values(tiny)) assert.doesNotThrow(() => { if (!content.startsWith('<?xml')) throw new Error('XML'); });

    // 4. Datos reales del arnés: el colaborador «a» es dueño de pa y hidden; «b» de pb.
    insert('Partner', { id: 'pt-ana', name: 'Ana Promotora', commissionPercent: '10.00', active: 1, createdAt: '2026-11-01', updatedAt: '2026-11-01' });
    insert('Booking', { id: 'r1', propertyId: 'pa', startDate: '2026-11-05', endDate: '2026-11-08', source: 'manual', guestUserId: 'client',
      rentAmount: '3000.00', cleaningCost: '500.00', taxes: '560.00', commissionPercent: '10.00', referredByPartnerId: 'pt-ana' });
    insert('Booking', { id: 'r2', propertyId: 'pa', startDate: '2026-11-29', endDate: '2026-12-02', source: 'manual', rentAmount: '4500.00', taxes: '720.00' });
    insert('Booking', { id: 'r3', propertyId: 'pb', startDate: '2026-11-10', endDate: '2026-11-12', source: 'manual', rentAmount: '999.00' });
    insert('Booking', { id: 'r4', propertyId: 'pa', startDate: '2026-11-15', endDate: '2026-11-18', source: 'host-block' });
    const a = { id: 'a', role: 'COLLABORATOR', canPublishProperties: false };
    let report = await service.loadMonthlyReport(a, '2026-11', null);
    assert.deepEqual(report.groups.flatMap(g => g.lines).map(l => l.id).sort(), ['r1', 'r2'], 'Solo sus propiedades y sin bloqueos');
    assert.equal(report.totals.commission, '300.00'); assert.equal(report.totals.total, '9280.00');
    assert.equal(report.groups[0].lines.find(l => l.id === 'r1').guestName, 'client', 'Huésped: solo nombre');
    report = await service.loadMonthlyReport(a, '2026-11', 'pt-ana');
    assert.deepEqual(report.groups.flatMap(g => g.lines).map(l => l.id), ['r1'], 'Filtro por colaborador referidor');
    assert.deepEqual((await service.reportPartnerOptions(a)).map(p => p.name), ['Ana Promotora']);

    // 5. Excel del reporte: columnas y filas esperadas (es).
    const files = unzip(await service.reportXlsx(await service.loadMonthlyReport(a, '2026-11', null), 'es'));
    const sheet = sheetRows(files);
    assert.deepEqual(Object.values(sheet[0]), ['Propiedad', 'Fechas', 'Salida', 'Noches (mes/total)', 'Cruce de mes', 'Huésped', 'Referido por',
      'Renta', 'Aseo', 'Impuestos', 'Total', '% colaborador', 'Comisión']);
    assert.equal(sheet.length, 1 + 2 + 1 + 1, 'Encabezado + 2 reservas + subtotal + total');
    assert.deepEqual([sheet[1].A, sheet[1].B, sheet[1].C, sheet[1].D, sheet[1].F, sheet[1].G], ['pa', '2026-11-05', '2026-11-08', '3/3', 'client', 'Ana Promotora']);
    assert.deepEqual([sheet[1].H.number, sheet[1].K.number, sheet[1].L.number, sheet[1].M.number], ['3000.00', '4060.00', '10.00', '300.00']);
    assert.match(sheet[2].E, /Cruza de mes: 2 de 3 noches aquí · 1 en el siguiente/);
    assert.equal(sheet[2].M, undefined, 'Sin comisión: celda vacía');
    assert.equal(sheet[3].A, 'Subtotal pa'); assert.equal(sheet[3].M.style, '3', 'Subtotal en negrita');
    assert.deepEqual([sheet[4].A, sheet[4].K.number, sheet[4].M.number], ['Total del mes (2 reservas)', '9280.00', '300.00']);
    assert.ok(!files['xl/worksheets/sheet1.xml'].includes('@test.invalid'), 'Sin correos del huésped');

    // 6. Acceso: solo COLLABORATOR. El ADMIN administra funcionalidades.
    const get = (month = '2026-11', extra = '') => download.GET(new Request(`http://localhost/api/panel/reports/monthly?month=${month}${extra}`));
    for (const [id, status] of [[null, 401], ['admin', 403], ['client', 403]]) {
      setSession(id ? { user: { id } } : null);
      assert.equal((await get()).status, status, String(id));
      assert.equal((await recipientsRoute.PATCH(json({ emails: [] }, 'PATCH'))).status, status);
      assert.equal((await sendRoute.POST(json({ month: '2026-11' }))).status, status);
      await assert.rejects(() => page({ params: Promise.resolve({ locale: 'es' }), searchParams: Promise.resolve({}) }), e => e.status === 404);
    }
    setSession({ user: { id: 'a' } });
    assert.equal((await get('2026-13')).status, 400);
    const res = await get('2026-11', '&locale=en');
    assert.equal(res.status, 200); assert.match(res.headers.get('content-type'), /spreadsheetml/);
    assert.equal(res.headers.get('content-disposition'), 'attachment; filename="reporte-comisiones-2026-11.xlsx"');
    assert.equal(res.headers.get('cache-control'), 'no-store');
    assert.equal(Object.values(sheetRows(unzip(new Uint8Array(await res.arrayBuffer())))[0])[0], 'Property', 'Excel en el idioma del panel');

    // 7. Destinatarios (máx. 2, válidos, sin duplicados).
    for (const bad of [{ emails: ['a@x.mx', 'b@x.mx', 'c@x.mx'] }, { emails: ['no-correo'] }, { emails: 'a@x.mx' }, {}, { emails: [5] }]) {
      assert.equal((await recipientsRoute.PATCH(json(bad, 'PATCH'))).status, 400, JSON.stringify(bad));
    }
    assert.equal((await recipientsRoute.PATCH(json({ emails: [' Conta@Empresa.mx ', 'conta@empresa.mx'] }, 'PATCH'))).status, 200);
    assert.deepEqual(await service.getReportEmails('a'), ['conta@empresa.mx'], 'Minúsculas y sin duplicados');
    assert.equal((await recipientsRoute.PATCH(json({ emails: ['conta@empresa.mx', 'dueno@casa.mx'] }, 'PATCH'))).status, 200);

    // 8. Envío manual: Excel adjunto a SUS destinatarios y fila en la bitácora. El nombre (lo controla el usuario) se escapa.
    memory.prepare('UPDATE "User" SET "name" = ? WHERE id = ?').run('<a href=//phish>Pagar</a>', 'a');
    let out = await (await sendRoute.POST(json({ month: '2026-11' }))).json();
    assert.equal(out.status, 'sent');
    assert.deepEqual(sent[0].to, ['conta@empresa.mx', 'dueno@casa.mx']);
    assert.equal(sent[0].attachments[0].filename, 'reporte-comisiones-2026-11.xlsx');
    assert.equal(sheetRows(unzip(new Uint8Array(sent[0].attachments[0].content))).length, 5, 'Mismo contenido que la descarga');
    assert.match(sent[0].html, /Comisiones: \$300\.00 MXN/);
    assert.ok(sent[0].html.includes('&lt;a href=//phish&gt;Pagar&lt;/a&gt;') && !sent[0].html.includes('<a href'), 'HTML del nombre escapado');
    let log = memory.prepare('SELECT * FROM "ReportDelivery" ORDER BY "createdAt"').all();
    assert.deepEqual([log.length, log[0].status, log[0].trigger, log[0].month, log[0].userId, Number(log[0].bookingCount)], [1, 'sent', 'manual', '2026-11', 'a', 2]);
    assert.equal((await sendRoute.POST(json({ month: 'nov' }))).status, 400);
    // Anti-abuso: máx. 3 envíos manuales en 24 h por colaborador; el 4.º no manda correo.
    for (let i = 0; i < 2; i++) assert.equal((await (await sendRoute.POST(json({ month: '2026-11' }))).json()).status, 'sent');
    const before = sent.length;
    out = await (await sendRoute.POST(json({ month: '2026-11' }))).json();
    assert.deepEqual([out.status, out.error, sent.length], ['failed', 'RATE_LIMITED', before], 'Límite diario');

    // 9. Cron: CRON_SECRET obligatorio; destinatarios desde lo que cada colaborador guardó; idempotente; fallos visibles.
    const call = (auth, qs = '') => cron.GET(new Request(`http://localhost/api/cron/monthly-report${qs}`, { headers: auth ? { authorization: auth } : {} }));
    delete process.env.CRON_SECRET;
    assert.equal((await call('Bearer x')).status, 401, 'Sin CRON_SECRET: cerrado');
    process.env.CRON_SECRET = 'secreto-de-prueba-123456';
    assert.equal((await call()).status, 401);
    assert.equal((await call('Bearer otro-secreto-de-prueba-1')).status, 401);
    assert.equal((await call('Bearer secreto-de-prueba-123456', '?month=2026-13')).status, 400);
    sent.length = 0;
    let summary = await (await call('Bearer secreto-de-prueba-123456', '?month=2026-11')).json();
    assert.deepEqual([summary.month, summary.sent, summary.failed, summary.skipped], ['2026-11', 1, 0, 0], 'Solo «a» tiene correos');
    assert.deepEqual(sent.map(m => m.to), [['conta@empresa.mx', 'dueno@casa.mx']]);
    summary = await (await call('Bearer secreto-de-prueba-123456', '?month=2026-11')).json();
    assert.deepEqual([summary.sent, summary.skipped], [0, 1], 'Reintento de Vercel no duplica');
    // Dos ejecuciones simultáneas del mismo mes: una sola reserva gana, un solo correo.
    sent.length = 0;
    const [x, y] = await Promise.all([call('Bearer secreto-de-prueba-123456', '?month=2026-09'), call('Bearer secreto-de-prueba-123456', '?month=2026-09')]);
    const both = [await x.json(), await y.json()];
    assert.equal(both.reduce((n, s) => n + s.sent, 0), 1, 'Concurrencia: un solo envío'); assert.equal(sent.length, 1);
    assert.equal(memory.prepare(`SELECT count(*) n FROM "ReportDelivery" WHERE "month" = '2026-09' AND "trigger" = 'cron'`).get().n, 1);
    // Fallo de envío: queda registrado, el cron responde y el panel lo muestra.
    failNext = 'Resend 422: dominio no verificado';
    summary = await (await call('Bearer secreto-de-prueba-123456', '?month=2026-10')).json();
    assert.deepEqual([summary.sent, summary.failed], [0, 1]);
    log = memory.prepare('SELECT * FROM "ReportDelivery" WHERE "month" = ?').all('2026-10');
    assert.deepEqual([log[0].status, log[0].trigger, log[0].error], ['failed', 'cron', 'Resend 422: dominio no verificado']);
    summary = await (await call('Bearer secreto-de-prueba-123456', '?month=2026-10')).json();
    assert.equal(summary.sent, 1, 'Un fallo libera el hueco: el siguiente intento automático sí envía');
    // Sin ?month= usa el mes anterior según la fecha de hoy en CDMX.
    summary = await (await call('Bearer secreto-de-prueba-123456')).json();
    assert.equal(summary.month, lib.previousMonth(inquiryToday()));

    // 10. Página del colaborador: totales, cruce marcado, aviso del último fallo y bitácora.
    memory.prepare('UPDATE "ReportDelivery" SET "createdAt" = ? WHERE "month" = ?').run('2099-01-01T00:00:00Z', '2026-10'); // el fallo es el más reciente
    const tree = await page({ params: Promise.resolve({ locale: 'es' }), searchParams: Promise.resolve({ month: '2026-11' }) });
    const all = text(tree);
    assert.equal(text(findAll(tree, n => n.props?.['data-testid'] === 'total-commission')[0]), '$300.00 MXN');
    assert.equal(text(findAll(tree, n => n.props?.['data-testid'] === 'total-total')[0]), '$9,280.00 MXN');
    assert.ok(all.includes('Cruza de mes: 2 de 3 noches aquí · 1 en el siguiente'));
    assert.ok(all.includes('Resend 422'), 'Fallo visible en el panel');
    assert.ok(findAll(tree, n => n.type === 'a' && /\/api\/panel\/reports\/monthly\?month=2026-11&locale=es/.test(n.props.href)).length, 'Enlace de descarga');
    assert.match(fs.readFileSync('apps/web/src/app/[locale]/panel/layout.tsx', 'utf8'), /manager\.role === 'COLLABORATOR' && <Link href="\/panel\/reporte"/);
    const es = JSON.parse(fs.readFileSync('apps/web/messages/es.json', 'utf8')).monthlyReport;
    for (const lang of ['en', 'fr']) assert.deepEqual(Object.keys(JSON.parse(fs.readFileSync(`apps/web/messages/${lang}.json`, 'utf8')).monthlyReport).sort(), Object.keys(es).sort(), lang);
    console.log('OK reporte mensual: agregados, comisión total, cruces, zona MX, Excel, destinatarios, cron y bitácora.');
  } catch (error) { console.error(error); process.exit(1); }
})();
