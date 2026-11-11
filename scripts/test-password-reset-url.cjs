// T-4771: el enlace del correo «olvidé mi contraseña» usa PUBLIC_SITE_URL (como el resto del sitio),
// NEXT_PUBLIC_SITE_URL solo como respaldo, y nunca localhost si hay URL pública. Offline: sin Resend ni Neon.
const assert = require('node:assert/strict');
const { load, mockModule, portal } = require('./test-property-access.cjs');

const sent = [];
mockModule('@/lib/mailer', { sendEmail: async message => { sent.push(message); } });
mockModule('next/headers', { headers: async () => new Headers({ 'x-forwarded-for': '198.51.100.7' }) });
mockModule('next/navigation', { redirect: url => { const error = new Error('NEXT_REDIRECT'); error.url = url; throw error; } });

const env = { PUBLIC_SITE_URL: process.env.PUBLIC_SITE_URL, NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL };
const setEnv = (pub, legacy) => {
  if (pub === undefined) delete process.env.PUBLIC_SITE_URL; else process.env.PUBLIC_SITE_URL = pub;
  if (legacy === undefined) delete process.env.NEXT_PUBLIC_SITE_URL; else process.env.NEXT_PUBLIC_SITE_URL = legacy;
};

(async () => {
  const errors = console.error; console.error = () => {};
  try {
    const { passwordResetUrl } = load('apps/web/src/lib/password-reset-url.ts');
    // 1. PUBLIC_SITE_URL manda (el caso de producción que fallaba: solo existía esa variable).
    setEnv('https://aliaforrent.example', undefined);
    assert.equal(passwordResetUrl('en', 'abc123'), 'https://aliaforrent.example/en/reset-password?token=abc123');
    setEnv('https://aliaforrent.example', 'https://viejo.example');
    assert.equal(passwordResetUrl('fr', 't'), 'https://aliaforrent.example/fr/reset-password?token=t', 'Gana PUBLIC_SITE_URL');
    // 2. Respaldo heredado y, sin nada, localhost (desarrollo).
    setEnv(undefined, 'https://viejo.example');
    assert.equal(passwordResetUrl('es', 't'), 'https://viejo.example/es/reset-password?token=t');
    setEnv('no es url', 'https://viejo.example');
    assert.equal(passwordResetUrl('es', 't'), 'https://viejo.example/es/reset-password?token=t', 'PUBLIC_SITE_URL inválida → respaldo');
    setEnv(undefined, undefined);
    assert.equal(passwordResetUrl('es', 't'), 'http://localhost:3000/es/reset-password?token=t');
    // 3. Idioma desconocido o manipulado → es; el token va codificado.
    setEnv('https://aliaforrent.example', undefined);
    for (const bad of ['de', '', '../admin', 'es/../../x']) assert.equal(passwordResetUrl(bad, 't'), 'https://aliaforrent.example/es/reset-password?token=t', bad);
    assert.equal(passwordResetUrl('es', 'a&b=c'), 'https://aliaforrent.example/es/reset-password?token=a%26b%3Dc');

    // 4. Flujo real: el correo lleva el enlace público; correo inexistente no envía y redirige igual.
    // SQLite no admite `default` en VALUES: se captura solo el INSERT del token (el SELECT del usuario es real).
    const tokens = [], insert = portal.db.insert.bind(portal.db);
    portal.db.insert = table => table === portal.passwordResetTokens ? { values: async value => { tokens.push(value); } } : insert(table);
    const { requestPasswordReset } = load('apps/web/src/app/[locale]/olvide-password/actions.ts');
    const form = (email, locale = 'en') => { const data = new FormData(); data.set('email', email); data.set('locale', locale); return data; };
    await assert.rejects(() => requestPasswordReset(form(' CLIENT@test.invalid ')), e => e.url === '/en/olvide-password?sent=1');
    assert.equal(sent.length, 1);
    assert.equal(sent[0].to, 'client@test.invalid');
    const link = sent[0].html.match(/href="([^"]+)"/)[1];
    assert.match(link, /^https:\/\/aliaforrent\.example\/en\/reset-password\?token=[0-9a-f]{64}$/, 'Enlace público, no localhost');
    assert.ok(!sent[0].html.includes('localhost'));
    assert.equal(tokens.length, 1); assert.equal(tokens[0].userId, 'client'); assert.ok(link.endsWith(tokens[0].token), 'El enlace lleva el token guardado');
    await assert.rejects(() => requestPasswordReset(form('nadie@test.invalid')), e => e.url === '/en/olvide-password?sent=1');
    assert.equal(sent.length, 1, 'Correo inexistente: no se envía nada (y no se revela)');
    assert.equal(tokens.length, 1);
    portal.db.insert = insert;
    console.log('OK enlace de recuperación: PUBLIC_SITE_URL, respaldo NEXT_PUBLIC_SITE_URL, idioma saneado y correo real sin localhost.');
  } catch (error) { console.error = errors; console.error(error); process.exitCode = 1; }
  finally { console.error = errors; setEnv(env.PUBLIC_SITE_URL, env.NEXT_PUBLIC_SITE_URL); }
})();
