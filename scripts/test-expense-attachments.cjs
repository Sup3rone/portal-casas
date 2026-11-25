// T-5248 (fase 2): facturas y recibos en el almacén PRIVADO de Vercel Blob. Offline: reglas puras, rutas reales sobre
// SQLite en memoria y un Blob simulado (put/get/del en un Map) que exige access 'private' y el token privado.
// Lo que no cubre: el almacén real (Vercel rechaza 'private' en un almacén público: por eso hay un segundo almacén).
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { load, memory, req, setSession, portal, mockModule } = require('./test-property-access.cjs');
const { getTableConfig } = req('drizzle-orm/pg-core');
const React = req('react');
const { renderToStaticMarkup } = req('react-dom/server');
const { NextIntlClientProvider } = req('next-intl');

// Blob simulado: solo acepta archivos privados con el token privado (el público no sirve para facturas).
const blobs = new Map(), calls = [];
const TOKEN = 'vercel_blob_rw_private_test';
mockModule('@vercel/blob', {
  put: async (pathname, file, options) => {
    calls.push(['put', pathname, options.access]);
    assert.equal(options.access, 'private', 'las facturas nunca van públicas');
    assert.equal(options.token, TOKEN, 'con el token del almacén privado');
    if (blobs.has(pathname)) throw new Error('ya existe');
    blobs.set(pathname, { bytes: Buffer.from(await file.arrayBuffer()), contentType: options.contentType });
    return { url: 'https://x.private.blob.vercel-storage.com/' + pathname, pathname };
  },
  get: async (pathname, options) => {
    calls.push(['get', pathname, options.access]);
    assert.equal(options.access, 'private');
    const blob = blobs.get(pathname);
    return blob ? { stream: new Blob([blob.bytes]).stream(), headers: new Headers(), blob: {} } : null;
  },
  del: async (pathnames, options) => {
    assert.equal(options.token, TOKEN);
    for (const pathname of [pathnames].flat()) { calls.push(['del', pathname]); blobs.delete(pathname); }
  },
});

for (const name of ['expenseTypes', 'recurringExpenses', 'expenseEntries', 'maintenances', 'expenseAttachments']) {
  const config = getTableConfig(portal[name]);
  memory.exec(`CREATE TABLE "${config.name}" (${config.columns.map(column => `"${column.name}" ${/integer|boolean|double/.test(column.getSQLType()) ? 'REAL' : 'TEXT'}${column.primary ? ' PRIMARY KEY' : ''}`).join(', ')})`);
}
memory.exec(`INSERT INTO "ExpenseType" ("id", "name", "fixed", "active") VALUES ('luz', 'Luz', 1, 1)`);
memory.exec(`INSERT INTO "Maintenance" ("id", "propertyId", "title", "kind", "status", "createdBy") VALUES ('m-a', 'pa', 'Pintar', 'puntual', 'pendiente', 'a'), ('m-b', 'pb', 'Ajeno', 'puntual', 'pendiente', 'b')`);
memory.exec(`INSERT INTO "ExpenseEntry" ("id", "propertyId", "typeId", "date", "amount", "paid", "createdBy") VALUES ('e-a', 'pa', 'luz', '2026-11-10', '980.40', 1, 'a')`);

const rules = load('apps/web/src/lib/expense-attachment-rules.ts');
const upload = load('apps/web/src/app/api/properties/[id]/expenses/[kind]/[itemId]/attachments/route.ts');
const one = load('apps/web/src/app/api/properties/[id]/expenses/attachments/[attachmentId]/route.ts');
const item = load('apps/web/src/app/api/properties/[id]/expenses/[kind]/[itemId]/route.ts');
const { loadPropertyExpenses } = load('apps/web/src/lib/property-expenses.ts');
const PropertyExpenses = load('apps/web/src/components/panel/PropertyExpenses.tsx').default;
const root = path.join(__dirname, '..');

const as = id => setSession(id ? { user: { id } } : null);
const pdf = (name = 'Recibo CFE noviembre.pdf', bytes = '%PDF-1.4 prueba', type = 'application/pdf') => new File([bytes], name, { type });
const send = async (property, kind, id, ...files) => {
  const form = new FormData(); for (const file of files) form.append('file', file);
  const res = await upload.POST(new Request('http://localhost/x', { method: 'POST', body: form }), { params: Promise.resolve({ id: property, kind, itemId: id }) });
  return { status: res.status, body: await res.json() };
};
const fetchOne = (property, id) => one.GET(new Request('http://localhost/x'), { params: Promise.resolve({ id: property, attachmentId: id }) });
const removeOne = async (property, id) => (await one.DELETE(new Request('http://localhost/x', { method: 'DELETE' }), { params: Promise.resolve({ id: property, attachmentId: id }) })).status;
const rows = () => memory.prepare('SELECT * FROM "ExpenseAttachment"').all();

async function main() {
  // 1) Reglas puras.
  assert.deepEqual([...rules.attachmentTypes], ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);
  const sqlText = fs.readFileSync(path.join(root, 'scripts/sql/expense-attachments.sql'), 'utf8');
  for (const type of rules.attachmentTypes) assert.ok(sqlText.includes(`'${type}'`), type + ' en el CHECK');
  assert.ok(sqlText.includes(`"size" <= ${rules.maxAttachmentBytes}`), 'mismo tope en el SQL');
  assert.deepEqual(rules.attachmentMetadata('application/pdf', 4_000_000), { contentType: 'application/pdf', size: 4_000_000 });
  for (const [type, size, code] of [['text/html', 10, 'INVALID_ATTACHMENT_TYPE'], ['image/svg+xml', 10, 'INVALID_ATTACHMENT_TYPE'], ['application/pdf', 4_000_001, 'INVALID_ATTACHMENT_SIZE'], ['application/pdf', 0, 'INVALID_ATTACHMENT_SIZE']]) {
    assert.throws(() => rules.attachmentMetadata(type, size), error => error.code === code, type);
  }
  assert.equal(rules.attachmentPath('pa', 'u1', 'application/pdf'), 'expenses/pa/u1.pdf');
  assert.equal(rules.safeFileName('C:\\Users\\x\\Recibo "CFE".pdf', 'application/pdf'), 'Recibo CFE.pdf', 'sin ruta ni comillas');
  assert.equal(rules.safeFileName('../../etc/passwd', 'image/png'), 'passwd.png');
  assert.equal(rules.safeFileName('', 'image/jpeg'), 'archivo.jpg');
  assert.equal(rules.safeFileName('foto.exe', 'image/jpeg'), 'foto.jpg', 'la extensión es la del tipo real');
  assert.match(rules.contentDisposition('Recibo de luz ñ.pdf'), /^inline; filename="Recibo de luz n\.pdf"; filename\*=UTF-8''Recibo%20de%20luz%20%C3%B1\.pdf$/);
  console.log('reglas OK');

  // 2) Sin token privado: desactivado (503), sin escribir nada.
  delete process.env.BLOB_PRIVATE_READ_WRITE_TOKEN;
  as('a');
  let res = await send('pa', 'entry', 'e-a', pdf());
  assert.deepEqual([res.status, res.body.code], [503, 'ATTACHMENTS_DISABLED']);
  assert.equal(blobs.size + rows().length, 0);
  process.env.BLOB_PRIVATE_READ_WRITE_TOKEN = TOKEN;

  // 3) Permisos: sin sesión 401; huésped 403; casa ajena, registro ajeno o de otra casa → 404; tipo de registro inválido → 404.
  as(null); assert.equal((await send('pa', 'entry', 'e-a', pdf())).status, 401);
  as('client'); assert.equal((await send('pa', 'entry', 'e-a', pdf())).status, 403);
  as('b');
  assert.equal((await send('pa', 'entry', 'e-a', pdf())).status, 404, 'casa ajena');
  assert.equal((await send('pb', 'entry', 'e-a', pdf())).status, 404, 'su casa, pago ajeno');
  as('a');
  assert.equal((await send('pa', 'maintenance', 'm-b', pdf())).status, 404, 'mantenimiento de otra casa');
  assert.equal((await send('pa', 'recurring', 'e-a', pdf())).status, 404, 'a un gasto recurrente no se adjunta');
  // Validación: tipo, tamaño, dos archivos, campo extra.
  assert.deepEqual([(res = await send('pa', 'entry', 'e-a', pdf('x.html', '<script>', 'text/html'))).status, res.body.code], [400, 'INVALID_ATTACHMENT_TYPE']);
  assert.equal((await send('pa', 'entry', 'e-a', pdf('a.pdf', Buffer.alloc(4_000_001)))).body.code, 'INVALID_ATTACHMENT_SIZE');
  assert.equal((await send('pa', 'entry', 'e-a', pdf(), pdf())).body.code, 'INVALID_ATTACHMENT_REQUEST');
  assert.equal(blobs.size + rows().length, 0, 'nada se escribió');
  console.log('permisos y validación OK');

  // 4) Subir, listar, descargar (flujo, cabeceras) y que otro dueño no pueda descargar.
  res = await send('pa', 'entry', 'e-a', pdf());
  assert.equal(res.status, 201);
  const fileId = res.body.id, [stored] = rows();
  assert.deepEqual([stored.entryId, stored.maintenanceId, stored.contentType, stored.fileName, stored.uploadedBy], ['e-a', null, 'application/pdf', 'Recibo CFE noviembre.pdf', 'a']);
  assert.equal(stored.pathname, `expenses/pa/${fileId}.pdf`, 'ruta con uuid, nunca el nombre original');
  assert.ok(blobs.has(stored.pathname));
  const photo = await send('pa', 'maintenance', 'm-a', pdf('obra.webp', 'RIFF....WEBP', 'image/webp'));
  assert.equal(photo.status, 201);
  const data = await loadPropertyExpenses('pa', { id: 'a', role: 'COLLABORATOR', canPublishProperties: false });
  assert.deepEqual(data.attachments.map(file => [file.entryId, file.maintenanceId]).sort(), [['e-a', null], [null, 'm-a']].sort());
  assert.ok(!('pathname' in data.attachments[0]), 'la pantalla no recibe la ruta del almacén');
  let download = await fetchOne('pa', fileId);
  assert.equal(download.status, 200);
  assert.equal(await download.text(), '%PDF-1.4 prueba');
  assert.equal(download.headers.get('content-type'), 'application/pdf');
  assert.equal(download.headers.get('cache-control'), 'private, no-store');
  assert.equal(download.headers.get('x-content-type-options'), 'nosniff');
  assert.match(download.headers.get('content-disposition'), /^inline; filename="Recibo CFE noviembre\.pdf"/);
  as('b');
  assert.equal((await fetchOne('pa', fileId)).status, 404, 'otro dueño no descarga');
  assert.equal((await fetchOne('pb', fileId)).status, 404, 'ni cambiando la casa de la URL');
  assert.equal(await removeOne('pb', fileId), 404);
  as('admin');
  assert.equal((await fetchOne('pa', fileId)).status, 200, 'el ADMIN sí');
  console.log('subir, listar y descargar OK');

  // 5) Borrar un archivo; borrar un mantenimiento borra también sus archivos del almacén.
  as('a');
  assert.equal(await removeOne('pa', fileId), 200);
  assert.ok(!blobs.has(stored.pathname) && !rows().some(row => row.id === fileId));
  const photoPath = rows().find(row => row.id === photo.body.id).pathname;
  const status = (await item.DELETE(new Request('http://localhost/x', { method: 'DELETE' }), { params: Promise.resolve({ id: 'pa', kind: 'maintenance', itemId: 'm-a' }) })).status;
  assert.equal(status, 200);
  assert.ok(!blobs.has(photoPath), 'el archivo del mantenimiento borrado no queda huérfano');
  assert.ok(calls.every(call => call[0] === 'del' || call[2] === 'private'), 'todo con acceso privado');
  console.log('borrado OK');

  // 6) Pantalla: con archivos → enlace por la API (nunca la URL del almacén); sin token → aviso y sin botón de subir.
  res = await send('pa', 'entry', 'e-a', pdf());
  const screen = await loadPropertyExpenses('pa', { id: 'a', role: 'COLLABORATOR', canPublishProperties: false });
  for (const locale of ['es', 'en', 'fr']) {
    const messages = JSON.parse(fs.readFileSync(path.join(root, 'apps/web/messages/' + locale + '.json'), 'utf8'));
    const render = (enabled, data = screen) => renderToStaticMarkup(React.createElement(NextIntlClientProvider, { locale, messages, timeZone: 'America/Mexico_City', onError(error) { throw error; } },
      React.createElement(PropertyExpenses, { propertyId: 'pa', data, today: '2026-11-24', isAdmin: false, attachmentsEnabled: enabled })));
    const on = render(true), off = render(false, { ...screen, attachments: [] });
    assert.ok(!render(false).includes('type="file"'), locale + ': con archivos y sin token, se ven pero no se sube');
    assert.ok(render(false).includes(`attachments/${res.body.id}`), locale + ': los ya subidos se siguen viendo');
    assert.ok(on.includes(`href="/api/properties/pa/expenses/attachments/${res.body.id}"`), locale + ': enlace por la API');
    assert.ok(!on.includes('blob.vercel-storage.com') && !on.includes('expenses/pa/'), locale + ': nunca la ruta ni la URL del almacén');
    assert.ok(on.includes('accept="image/jpeg,image/png,image/webp,application/pdf"') && on.includes(messages.expenses.attach));
    assert.ok(!off.includes('type="file"') && off.includes(messages.expenses.attachmentsOff), locale + ': sin token, sin subir');
    for (const key of ['invalidAttachmentType', 'invalidAttachmentSize', 'attachmentsDisabled']) assert.ok(messages.panel[key], `${locale}: panel.${key}`);
  }
  console.log('pantalla es/en/fr OK');
  console.log('test-expense-attachments OK');
}
main().catch(error => { console.error(error); process.exit(1); });
