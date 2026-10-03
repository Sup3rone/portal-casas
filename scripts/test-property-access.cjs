// Pruebas sin red: ejecutan handlers y el SQL real de Drizzle en SQLite en memoria.
// No prueban DDL/PLpgSQL de la migración, que debe ensayarse en PostgreSQL local.
const { createRequire } = require('node:module');
const path = require('node:path');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const { DatabaseSync } = require('node:sqlite');
const root = path.resolve(__dirname, '..');
const req = createRequire(path.join(root, 'apps/web/package.json'));
const ts = req('typescript');
const { drizzle } = req('drizzle-orm/neon-http');
const { getTableConfig } = req('drizzle-orm/pg-core');
const memory = new DatabaseSync(':memory:');
let session = null;
let portal;
const cache = new Map();
const revalidated = [];
const readFeeds = [];
function load(file) {
  file = path.resolve(root, file);
  if (cache.has(file)) return cache.get(file).exports;
  const module = { exports: {} };
  cache.set(file, module);
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  function localRequire(name) {
    if (name === 'server-only') return {};
    if (name === '@portal/db') return portal;
    if (name === '@/lib/auth' || (name === './auth' && file.endsWith('property-access.ts'))) {
      return { auth: async () => session };
    }
    if (name === '@/lib/mailer') return { sendEmail: async () => {} };
    if (name === 'next/cache') return { revalidatePath: (...args) => revalidated.push(args) };
    if (name === 'next/navigation') return { redirect: url => { throw new Error('redirect: ' + url); } };
    if (name === 'node-ical') return { fromURL: async url => {
      readFeeds.push(url);
      return { test: { type: 'VEVENT', start: new Date('2027-02-01'), end: new Date('2027-02-03'), uid: 'test' } };
    } };
    if (name.startsWith('@/')) return load('apps/web/src/' + name.slice(2) + '.ts');
    return req(name);
  }
  new Function('require', 'exports', code)(localRequire, module.exports);
  return module.exports;
}
const schema = load('packages/db/src/schema.ts');
for (const name of ['users', 'properties', 'messages', 'bookings', 'seasonRates', 'icalFeeds']) {
  const config = getTableConfig(schema[name]);
  memory.exec(`CREATE TABLE "${config.name}" (${config.columns.map(column => {
    const numeric = /integer|boolean|double/.test(column.getSQLType());
    return `"${column.name}" ${numeric ? 'REAL' : 'TEXT'}${column.primary ? ' PRIMARY KEY' : ''}`;
  }).join(', ')})`);
}
const client = { query: async (query, values, options) => {
  const bindings = [];
  const translated = query.replace(/::(?:text|date)/g, '').replace(/\$(\d+)/g, (_, n) => {
    const value = values[Number(n) - 1];
    bindings.push(typeof value === 'boolean' ? Number(value) : value);
    return '?';
  });
  const statement = memory.prepare(translated);
  if (options?.arrayMode) statement.setReturnArrays(true);
  return { rows: statement.all(...bindings) };
} };
portal = { ...schema, db: drizzle(client, { schema }) };
const insert = (table, row) => memory.prepare(`INSERT INTO "${table}" (${Object.keys(row).map(k => `"${k}"`).join(',')}) VALUES (${Object.keys(row).map(() => '?').join(',')})`).run(...Object.values(row));
for (const [id, role] of [['admin', 'ADMIN'], ['a', 'COLLABORATOR'], ['b', 'COLLABORATOR'], ['client', 'CLIENT'], ['viewer', 'VIEWER']]) insert('User', { id, role, email: id + '@test.invalid', name: id });
for (const [id, ownerId, published] of [['pa', 'a', 1], ['pb', 'b', 1], ['hidden', 'a', 0]]) {
  insert('Property', { id, ownerId, published, slug: id, titleEs: id, titleEn: id, titleFr: id });
}
for (const [id, propertyId, userId] of [['ma', 'pa', 'client'], ['mb', 'pb', 'viewer']]) insert('Message', { id, propertyId, userId, read: 0 });
for (const [id, propertyId] of [['ra', 'pa'], ['rb', 'pb']]) insert('SeasonRate', { id, propertyId });
for (const [id, propertyId] of [['fa', 'pa'], ['fb', 'pb']]) insert('IcalFeed', { id, propertyId, url: id, source: 'airbnb' });
const as = id => { session = id ? { user: { id, role: 'ADMIN' } } : null; }; // JWT falsificado/obsoleto.
const json = (body, method = 'POST') => new Request('http://localhost/test', { method, headers: { 'Content-Type': 'application/json', Cookie: 'admin_session=legacy' }, body: JSON.stringify(body) });
const access = load('apps/web/src/lib/property-access.ts');
const inventory = load('apps/web/src/app/api/properties/route.ts');
const property = load('apps/web/src/app/api/properties/[id]/route.ts');
const mark = load('apps/web/src/app/api/messages/read/route.ts');
const remove = load('apps/web/src/app/api/messages/delete/route.ts');
const booking = load('apps/web/src/app/api/bookings/create/route.ts');
const sync = load('apps/web/src/app/api/ical/sync/route.ts');
const rates = load('apps/web/src/app/[locale]/admin/tarifas/actions.ts');
const inquiry = load('apps/web/src/app/api/messages/route.ts');
async function main() {
  for (const id of [null, 'client', 'viewer', 'deleted-user']) {
    as(id);
    const status = id ? 403 : 401;
    assert.equal((await inventory.GET()).status, status);
    assert.equal((await property.PATCH(json({ titleEs: 'No' }, 'PATCH'), { params: Promise.resolve({ id: 'pa' }) })).status, status);
    assert.equal((await mark.POST(json({ id: 'ma' }))).status, status);
    assert.equal((await booking.POST(json({ propertyId: 'pa', startDate: '2027-01-01', endDate: '2027-01-03' }))).status, status);
    await assert.rejects(() => rates.deleteTarifa(new FormData()), e => e.status === status);
  }
  as('a');
  assert.deepEqual((await (await inventory.GET()).json()).properties.map(p => p.id).sort(), ['hidden', 'pa']);
  assert.equal((await property.PATCH(json({ titleEs: 'Own' }, 'PATCH'), { params: Promise.resolve({ id: 'pa' }) })).status, 200);
  assert.equal((await property.PATCH(json({ titleEs: 'Foreign' }, 'PATCH'), { params: Promise.resolve({ id: 'pb' }) })).status, 404);
  assert.equal((await property.PATCH(json({ ownerId: 'a' }, 'PATCH'), { params: Promise.resolve({ id: 'pb' }) })).status, 400);
  assert.equal(memory.prepare('SELECT "titleEs" FROM "Property" WHERE id = ?').get('pb').titleEs, 'pb');
  assert.equal((await mark.POST(json({ id: 'ma' }))).status, 200);
  assert.equal((await mark.POST(json({ id: 'mb' }))).status, 404);
  assert.equal((await remove.POST(json({ id: 'mb' }))).status, 404);
  const addRate = id => { const form = new FormData(); for (const [key, value] of Object.entries({ propertyId: id, name: 'Test', startDate: '2027-01-01', endDate: '2027-01-03', weekdayPrice: '100', weekendPrice: '200' })) form.set(key, value); return rates.addTarifa(form); };
  await addRate('pa');
  await assert.rejects(() => addRate('pb'), e => e.status === 404);
  const foreignRate = new FormData(); foreignRate.set('id', 'rb');
  await assert.rejects(() => rates.deleteTarifa(foreignRate), e => e.status === 404);
  assert.equal((await booking.POST(json({ propertyId: 'pb', startDate: '2027-01-01', endDate: '2027-01-03' }))).status, 404);
  assert.equal((await booking.POST(json({ propertyId: 'pa', startDate: '2027-01-01', endDate: '2027-01-03', guestUserId: 'viewer' }))).status, 404);
  assert.equal((await booking.POST(json({ propertyId: 'pa', startDate: '2027-01-01', endDate: '2027-01-03', guestUserId: 'client' }))).status, 200);
  assert.equal((await sync.POST()).status, 200);
  assert.deepEqual(readFeeds, ['fa']);
  assert.equal(memory.prepare('SELECT count(*) AS count FROM "Booking" WHERE "propertyId" = ?').get('pb').count, 0);
  const manager = await access.requirePropertyManager();
  memory.prepare('UPDATE "User" SET role = ? WHERE id = ?').run('CLIENT', 'a');
  const lostAccess = await portal.db.update(schema.properties).set({ titleEs: 'Demoted' }).where(access.managedProperties(manager)).returning();
  assert.equal(lostAccess.length, 0);
  await assert.rejects(() => access.requirePropertyManager(), e => e.status === 403);
  memory.prepare('UPDATE "User" SET role = ? WHERE id = ?').run('COLLABORATOR', 'a');
  as('admin');
  assert.equal((await (await inventory.GET()).json()).properties.length, 3);
  assert.equal((await property.PATCH(json({ titleEs: 'Admin' }, 'PATCH'), { params: Promise.resolve({ id: 'pb' }) })).status, 200);
  assert.equal((await mark.POST(json({ id: 'mb' }))).status, 200);
  assert.equal((await remove.POST(json({ id: 'mb' }))).status, 200);
  as(null);
  for (const [id, status] of [['pa', 201], ['hidden', 404], ['missing', 404]]) {
    const form = new FormData(); for (const [key, value] of Object.entries({ propertyId: id, name: 'Guest', email: 'guest@test.invalid', startDate: '2027-01-01', endDate: '2027-01-03', body: 'Test' })) form.set(key, value);
    assert.equal((await inquiry.POST(new Request('http://localhost/test', { method: 'POST', body: form }))).status, status);
  }
  assert.ok(revalidated.length);
  memory.close();
  console.log('OK: acceso por rol/dueño, APIs directas, acciones, revocación y consulta pública. Sin red ni BD real.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
