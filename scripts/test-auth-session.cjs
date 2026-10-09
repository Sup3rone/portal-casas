// Login, cookie JWT y sesión reales de Auth.js; BD en memoria, sin red.
process.env.AUTH_SECRET = 'test-only-secret-for-local-auth-regression';
process.env.AUTH_TRUST_HOST = 'true';
const assert = require('node:assert/strict');
const { load, req, memory, setSession } = require('./test-property-access.cjs');
const { registerHooks } = require('node:module');
const { pathToFileURL } = require('node:url');
// Next resuelve estos imports con el bundler; Node ESM necesita la extensión.
const nextImports = new Map(['next/server', 'next/headers', 'next/navigation']
  .map(name => [name, pathToFileURL(req.resolve(name)).href]));
registerHooks({ resolve(specifier, context, nextResolve) {
  if (nextImports.has(specifier)) {
    return { url: nextImports.get(specifier), shortCircuit: true };
  }
  return nextResolve(specifier, context);
} });
const { NextRequest } = req('next/server');
const bcrypt = req('bcryptjs');
const { handlers } = load('apps/web/src/lib/auth.ts');
const properties = load('apps/web/src/app/api/properties/[id]/route.ts');

function cookies(response, jar) {
  for (const cookie of response.headers.getSetCookie()) {
    const pair = cookie.split(';')[0];
    const separator = pair.indexOf('=');
    const name = pair.slice(0, separator);
    if (/max-age=0/i.test(cookie)) jar.delete(name);
    else jar.set(name, pair.slice(separator + 1));
  }
}
const header = jar => [...jar].map(([name, value]) => `${name}=${value}`).join('; ');
async function login(id) {
  const jar = new Map();
  const csrf = await handlers.GET(new NextRequest('http://localhost/api/auth/csrf'));
  assert.equal(csrf.status, 200);
  cookies(csrf, jar);
  const { csrfToken } = await csrf.json();
  const response = await handlers.POST(new NextRequest('http://localhost/api/auth/callback/credentials', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', cookie: header(jar) },
    body: new URLSearchParams({ email: `${id}@test.invalid`, password: 'test-password', csrfToken }),
  }));
  cookies(response, jar);
  assert.ok([...jar.keys()].some(name => name.startsWith('authjs.session-token')), `Cookie de sesión ausente para ${id}`);
  return jar;
}
async function readSession(jar) {
  const response = await handlers.GET(new NextRequest('http://localhost/api/auth/session', {
    headers: { cookie: header(jar) },
  }));
  assert.equal(response.status, 200);
  const session = await response.json();
  setSession(session);
  return session;
}
async function patch(id) {
  return properties.PATCH(new NextRequest(`http://localhost/api/properties/${id}`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ titleEs: 'Prueba de sesión' }),
  }), { params: Promise.resolve({ id }) });
}
async function main() {
  for (const locale of ['es', 'en', 'fr']) {
    const response = await handlers.GET(new NextRequest(`http://localhost/api/auth/signin?callbackUrl=http://localhost/${locale}/mi-cuenta`));
    assert.ok(response.headers.get('location').includes(`/${locale}/login`));
    const cookieResponse = await handlers.GET(new NextRequest('http://localhost/api/auth/signin', { headers: { cookie: `NEXT_LOCALE=${locale}` } }));
    assert.ok(cookieResponse.headers.get('location').includes(`/${locale}/login`));
  }
  const hash = await bcrypt.hash('test-password', 4);
  memory.prepare('UPDATE "User" SET "passwordHash" = ?').run(hash);
  const host = await login('a');
  const session = await readSession(host);
  assert.equal(session.user.id, 'a');
  assert.equal(session.user.role, 'COLLABORATOR');
  assert.equal((await patch('pa')).status, 200);
  assert.equal((await patch('pb')).status, 404);
  console.log('COLLABORATOR: login → cookie Auth.js → sesión con id/rol → propia 200, ajena 404');
  const admin = await login('admin');
  assert.equal((await readSession(admin)).user.role, 'ADMIN');
  assert.equal((await patch('pa')).status, 200);
  assert.equal((await patch('pb')).status, 200);
  console.log('ADMIN: ambas propiedades 200');
  await readSession(await login('client'));
  const deniedRole = await patch('pa');
  assert.equal(deniedRole.status, 403);
  assert.equal((await deniedRole.json()).code, 'ROLE_NOT_ALLOWED');
  setSession({ user: { id: 'missing-user', role: 'COLLABORATOR' } });
  const missingUser = await patch('pa');
  assert.equal(missingUser.status, 403);
  assert.equal((await missingUser.json()).code, 'SESSION_USER_NOT_FOUND');
  await readSession(new Map([['admin_session', 'legacy-token']]));
  assert.equal((await patch('pa')).status, 401);
  memory.close();
  console.log('CLIENT: 403; cookie admin_session aislada: 401. Sin red ni BD real.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
