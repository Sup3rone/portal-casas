// Guards, lecturas y SSR reales en memoria; CTE PostgreSQL inspeccionado, no ejecutado.
// La atomicidad UPDATE+INSERT debe ensayarse tras aprobar la migración en Respaldo.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { load, portal, memory, req, setSession, setLocale } = require('./test-property-access.cjs');
const { PgDialect } = req('drizzle-orm/pg-core');
const bcrypt = req('bcryptjs');
const query = portal.db.$client.query;
portal.db.$client.query = (sql, values, options) => query(sql.replace(/::int\b/g, '').replace(/\bilike\b/gi, 'like'), values, options);
memory.prepare('UPDATE "User" SET "createdAt" = ?').run('2026-10-06 12:00:00');
memory.prepare('UPDATE "User" SET "passwordHash" = ? WHERE id = ?').run('never-return-this-hash', 'a');
const service = load('apps/web/src/lib/admin-users.ts');
const listRoute = load('apps/web/src/app/api/panel/users/route.ts');
const detailRoute = load('apps/web/src/app/api/panel/users/[id]/route.ts');
const page = load('apps/web/src/app/[locale]/panel/usuarios/page.tsx').default;
const detail = load('apps/web/src/app/[locale]/panel/usuarios/[id]/page.tsx').default;
const layout = load('apps/web/src/app/[locale]/panel/layout.tsx').default;
const request = body => new Request('http://localhost/api/panel/users/client', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
const getRequest = req('next/server').NextRequest;
const context = id => ({ params: Promise.resolve({ id }) });
const as = id => setSession(id ? { user: { id, role: 'ADMIN' } } : null);
async function main() {
  for (const [id, status] of [[null, 401], ['a', 403], ['b', 403], ['client', 403], ['viewer', 403]]) {
    as(id);
    assert.equal((await listRoute.GET(new getRequest('http://localhost/api/panel/users'))).status, status);
    assert.equal((await detailRoute.GET(new getRequest('http://localhost/test'), context('client'))).status, status);
    assert.equal((await detailRoute.PATCH(request({ action: 'password', confirmed: true }), context('client'))).status, status);
    await assert.rejects(() => page({ params: Promise.resolve({ locale: 'es' }), searchParams: Promise.resolve({}) }), e => e.status === 404);
    await assert.rejects(() => detail({ params: Promise.resolve({ locale: 'es', id: 'client' }) }), e => e.status === 404);
  }
  as('admin');
  const listed = await (await listRoute.GET(new getRequest('http://localhost/api/panel/users?email=a%40test&role=COLLABORATOR'))).json();
  assert.equal(listed.rows.length, 1); assert.equal(listed.rows[0].id, 'a'); assert.equal(listed.rows[0].propertyCount, 2);
  assert.ok(!JSON.stringify(listed).includes('never-return-this-hash'));
  const user = await (await detailRoute.GET(new getRequest('http://localhost/test'), context('a'))).json();
  assert.equal(user.properties.length, 2); assert.ok(!('passwordHash' in user.user));
  assert.equal((await detailRoute.GET(new getRequest('http://localhost/test'), context('missing'))).status, 404);
  let writes = [];
  const execute = portal.db.execute;
  portal.db.execute = async statement => { writes.push(new PgDialect().sqlToQuery(statement)); return { rows: [{ id: 'audit' }] }; };
  for (const body of [{ action: 'password' }, { action: 'password', confirmed: false }, { action: 'role', role: 'ADMIN', confirmed: true }, { action: 'role', role: 'COLLABORATOR', confirmed: true }]) {
    const id = body.role === 'COLLABORATOR' ? 'a' : 'client';
    assert.equal((await detailRoute.PATCH(request(body), context(id))).status, 400);
  }
  assert.equal((await detailRoute.PATCH(request({ action: 'role', role: 'CLIENT', confirmed: true }), context('admin'))).status, 403);
  memory.prepare('INSERT INTO "User" (id,email,role,createdAt) VALUES (?,?,?,?)').run('admin2','admin2@test.invalid','ADMIN','2026-10-06 12:00:00');
  assert.equal((await detailRoute.PATCH(request({ action: 'role', role: 'CLIENT', confirmed: true }), context('admin2'))).status, 403);
  assert.equal(writes.length, 0);
  assert.equal((await detailRoute.PATCH(request({ action: 'role', role: 'COLLABORATOR', confirmed: true }), context('client'))).status, 200);
  assert.ok(writes[0].sql.includes('with changed as')); assert.ok(writes[0].sql.includes('insert into "AdminUserAudit"'));
  assert.ok(writes[0].params.includes('ROLE_CHANGE')); assert.ok(writes[0].params.includes('admin'));
  const response = await detailRoute.PATCH(request({ action: 'password', confirmed: true }), context('client'));
  assert.equal(response.status, 200); assert.equal(response.headers.get('cache-control'), 'no-store');
  const result = await response.json(); assert.match(result.temporaryPassword, /^[A-Za-z0-9_-]{24}$/);
  const reset = writes[1], hash = reset.params.find(value => typeof value === 'string' && /^\$2[aby]\$10\$/.test(value));
  assert.ok(hash); assert.equal(await bcrypt.compare(result.temporaryPassword, hash), true);
  assert.ok(!reset.params.includes(result.temporaryPassword)); assert.ok(reset.params.includes('PASSWORD_RESET'));
  portal.db.execute = async () => ({ rows: [] });
  assert.equal((await detailRoute.PATCH(request({ action: 'role', role: 'COLLABORATOR', confirmed: true }), context('client'))).status, 403);
  portal.db.execute = execute;
  for (let i = 0; i < 51; i++) memory.prepare('INSERT INTO "User" (id,email,role,createdAt) VALUES (?,?,?,?)')
    .run(`paging-${i}`, `paging-${i}@test.invalid`, 'CLIENT', '2026-10-06 12:00:00');
  const first = await service.listAdminUsers('paging-', 'CLIENT', 1), second = await service.listAdminUsers('paging-', 'CLIENT', 2);
  assert.equal(first.rows.length, 50); assert.equal(first.hasNext, true);
  assert.equal(second.rows.length, 1); assert.equal(second.hasNext, false);
  assert.ok(!first.rows.some(row => row.id === second.rows[0].id));
  const React = req('react'), { renderToStaticMarkup } = req('react-dom/server'), { NextIntlClientProvider } = req('next-intl');
  for (const locale of ['es', 'en', 'fr']) {
    setLocale(locale); as('admin');
    const messages = JSON.parse(fs.readFileSync(path.join(__dirname, '../apps/web/messages/' + locale + '.json'), 'utf8'));
    const render = content => renderToStaticMarkup(React.createElement(NextIntlClientProvider, { locale, messages, timeZone: 'America/Mexico_City', onError(e) { throw e; } }, content));
    const html = render(await page({ params: Promise.resolve({ locale }), searchParams: Promise.resolve({}) }));
    assert.ok(html.includes(messages.adminUsers.title)); assert.ok(!html.includes('never-return-this-hash'));
    const details = render(await detail({ params: Promise.resolve({ locale, id: 'client' }) }));
    assert.ok(details.includes(messages.adminUsers.sessionWarning)); assert.ok(details.includes(messages.adminUsers.promote));
    assert.ok(render(await layout({ params: Promise.resolve({ locale }), children: null })).includes('/panel/usuarios'));
    as('a'); assert.ok(!render(await layout({ params: Promise.resolve({ locale }), children: null })).includes('/panel/usuarios'));
  }
  memory.close();
  console.log('OK: acceso ADMIN/denegaciones, filtros/ownership count, ausencia de hashes, confirmación, roles protegidos, bcrypt coste 10, no-store y SSR es/en/fr. CTE pendiente de PostgreSQL real. Sin red ni BD real.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
