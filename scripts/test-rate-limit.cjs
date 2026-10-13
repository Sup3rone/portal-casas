const assert = require('node:assert/strict');
const { load, memory, queryLog, mockModule } = require('./test-property-access.cjs');
const { consumeRateLimit, rateLimitResponse, rateLimitLocale } = load('apps/web/src/lib/rate-limit.ts');
const headers = new Headers({ 'x-forwarded-for': '192.0.2.1, 10.0.0.1', referer: 'https://example.com/fr/login' });
const now = 10_000_000;
for (let i = 0; i < 10; i++) assert.equal(consumeRateLimit('login', headers, now), 0);
assert.equal(consumeRateLimit('login', headers, now + 1000), 899);
assert.equal(consumeRateLimit('login', new Headers({ 'x-forwarded-for': '192.0.2.2' }), now), 0);
assert.equal(consumeRateLimit('register', headers, now), 0);
assert.equal(consumeRateLimit('login', headers, now + 900_000), 0);
assert.equal(rateLimitLocale(headers), 'fr');
(async () => {
  const response = rateLimitResponse(899, 'fr');
  assert.equal(response.status, 429);
  assert.equal(response.headers.get('Retry-After'), '899');
  const body = await response.json();
  assert.equal(body.code, 'RATE_LIMITED'); assert.match(body.message, /tentatives/);
  for (const [flow, limit] of [['register', 5], ['recovery', 3], ['inquiry', 5]]) {
    const h = new Headers({ 'x-forwarded-for': '198.51.100.5' });
    for (let i = 0; i < limit; i++) assert.equal(consumeRateLimit(flow, h, now), 0);
    assert.ok(consumeRateLimit(flow, h, now) > 0);
  }
  const messages = load('apps/web/src/app/api/messages/route.ts');
  const before = queryLog.length;
  for (let i = 0; i < 6; i++) {
    const request = new Request('http://localhost/api/messages', { method: 'POST', headers: { 'x-forwarded-for': '203.0.113.8', referer: 'http://localhost/en/casas/house', 'Content-Type': 'application/json' }, body: '{}' });
    const result = await messages.POST(request);
    assert.equal(result.status, i < 5 ? 400 : 429);
    if (i === 5) { assert.ok(result.headers.get('Retry-After')); assert.match((await result.json()).message, /Too many/); }
  }
  assert.equal(queryLog.length, before, 'Rechazo antes de cualquier acceso a BD');
  let currentHeaders;
  class AuthError extends Error {}
  mockModule('next/headers', { headers: async () => currentHeaders });
  mockModule('next-auth', { AuthError });
  mockModule('@/lib/auth', { signIn: async () => { throw new AuthError(); } });
  mockModule('next/dist/client/components/redirect-error', { isRedirectError: error => error.message.startsWith('redirect: ') });
  mockModule('next/dist/client/components/redirect', { getURLFromRedirectError: error => error.message.slice(10) });
  const transport = load('apps/web/src/app/api/public-auth/[flow]/route.ts');
  for (const [flow, limit] of [['login',10], ['register',5], ['recovery',3]]) {
    for (let i = 0; i <= limit; i++) {
      const data = new FormData(); data.set('locale','fr');
      currentHeaders = new Headers({ origin:'http://localhost', 'x-forwarded-for':`203.0.113.${limit}` });
      const result = await transport.POST(new Request(`http://localhost/api/public-auth/${flow}`, { method:'POST', headers:currentHeaders, body:data }), {params:Promise.resolve({flow})});
      assert.equal(result.status, i < limit ? 200 : 429);
      if (i === limit) { assert.ok(result.headers.get('Retry-After')); assert.match((await result.json()).message,/tentatives/); }
    }
  }
  assert.equal(queryLog.length,before,'Login fallido, registro inválido y recuperación vacía no acceden a BD; el exceso tampoco');
  console.log('OK limitador: IP, flujo, umbral, expiración, locale y 429/Retry-After.');
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => memory.close());
