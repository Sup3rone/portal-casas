// T-4783: confirmación de correo al registrarse y tokens con hash (también «olvidé mi contraseña»).
// Offline: SQLite en memoria y correo simulado; sin Resend ni Neon.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { load, req, memory, mockModule, setSession, portal } = require('./test-property-access.cjs');

const sent = [];
let ip = 0, failMail = false;
mockModule('@/lib/mailer', { sendEmail: async message => { if (failMail) throw new Error('Resend caído'); sent.push(message); } });
mockModule('next/headers', { headers: async () => new Headers({ 'x-forwarded-for': `203.0.113.${ip}` }) });
mockModule('next/navigation', { redirect: url => { const error = new Error('NEXT_REDIRECT'); error.url = url; throw error; }, notFound: () => { throw new Error('notFound'); } });
const signedIn = [];
mockModule('@/lib/auth', { auth: async () => currentSession, signIn: async (_provider, options) => { signedIn.push(options); } });
let currentSession = null;
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
const row = (table, where, id) => memory.prepare(`SELECT * FROM "${table}" WHERE ${where} = ?`).get(id);
const tokenFrom = html => new URL(html.match(/href="([^"]+)"/)[1].replaceAll('&amp;', '&')).searchParams.get('token');
const form = values => { const data = new FormData(); for (const [k, v] of Object.entries(values)) data.set(k, v); return data; };
for (const table of ['EmailVerificationToken', 'PasswordResetToken']) {
  memory.exec(`CREATE TABLE IF NOT EXISTS "${table}" (id text primary key, "userId" text not null, "${table === 'PasswordResetToken' ? 'token' : 'tokenHash'}" text not null unique, "expiresAt" text not null, "usedAt" text, "createdAt" text)`);
}

(async () => {
  const errors = console.error; console.error = () => {};
  try {
    process.env.PUBLIC_SITE_URL = 'https://aliaforrent.example';
    const tokens = load('apps/web/src/lib/auth-tokens.ts');
    // 1. Lógica pura: hash, estado (vencido, usado, válido) y token nuevo de 32 bytes.
    assert.equal(tokens.hashToken('abc'), sha('abc'));
    const { token, tokenHash } = tokens.newToken();
    assert.match(token, /^[0-9a-f]{64}$/); assert.equal(tokenHash, sha(token)); assert.notEqual(token, tokenHash);
    const now = new Date('2027-01-01T12:00:00Z');
    assert.equal(tokens.tokenStatus(undefined, now), 'invalid');
    assert.equal(tokens.tokenStatus({ usedAt: new Date('2027-01-01T11:00:00Z'), expiresAt: new Date('2027-01-02T00:00:00Z') }, now), 'used');
    assert.equal(tokens.tokenStatus({ usedAt: null, expiresAt: new Date('2027-01-01T12:00:00Z') }, now), 'expired', 'Vence justo a la hora');
    assert.equal(tokens.tokenStatus({ usedAt: null, expiresAt: '2027-01-01T13:00:00.000Z' }, now), 'valid');
    assert.equal(tokens.VERIFY_TTL_MS, 24 * 60 * 60 * 1000);

    // 2. Emitir: guarda solo el hash, vence a las 24 h e invalida los anteriores del mismo usuario (no los ajenos).
    const verify = tokens.verifyTokens;
    const first = await tokens.issueToken(verify, 'client', tokens.VERIFY_TTL_MS);
    const other = await tokens.issueToken(verify, 'viewer', tokens.VERIFY_TTL_MS);
    const stored = row('EmailVerificationToken', '"tokenHash"', sha(first));
    assert.ok(stored && stored.userId === 'client', 'Se guarda el hash');
    assert.equal(memory.prepare('SELECT count(*) n FROM "EmailVerificationToken" WHERE "tokenHash" = ?').get(first).n, 0, 'Nunca el token en claro');
    const ttl = new Date(stored.expiresAt) - new Date(stored.createdAt);
    assert.ok(Math.abs(ttl - 24 * 3600_000) < 5000, 'Vence a las 24 h');
    const second = await tokens.issueToken(verify, 'client', tokens.VERIFY_TTL_MS);
    assert.ok(row('EmailVerificationToken', '"tokenHash"', sha(first)).usedAt, 'El anterior queda invalidado');
    assert.equal(row('EmailVerificationToken', '"tokenHash"', sha(other)).usedAt, null, 'El de otro usuario no se toca');

    // 3. Consumir: un solo uso; usado, vencido e inválido se distinguen.
    assert.deepEqual(await tokens.consumeToken(verify, first), { status: 'used' });
    assert.deepEqual(await tokens.consumeToken(verify, second), { status: 'valid', userId: 'client' });
    assert.deepEqual(await tokens.consumeToken(verify, second), { status: 'used' }, 'Un solo uso');
    assert.deepEqual(await tokens.consumeToken(verify, 'no-existe'), { status: 'invalid' });
    assert.deepEqual(await tokens.consumeToken(verify, ''), { status: 'invalid' });
    assert.deepEqual(await tokens.consumeToken(verify, sha(other)), { status: 'invalid' }, 'El hash guardado no sirve como token');
    memory.prepare('UPDATE "EmailVerificationToken" SET "expiresAt" = ? WHERE "tokenHash" = ?').run('2000-01-01T00:00:00.000Z', sha(other));
    assert.deepEqual(await tokens.consumeToken(verify, other), { status: 'expired' });
    assert.equal(row('EmailVerificationToken', '"tokenHash"', sha(other)).usedAt, null, 'Vencido: no se marca');

    // 4. Registro: crea la cuenta, manda «Confirma tu correo» con enlace público y entra a Mi cuenta.
    // SQLite no admite `default` en VALUES: se completan los defaults del INSERT de User (el resto es real).
    const insert = portal.db.insert.bind(portal.db);
    portal.db.insert = table => table !== portal.users ? insert(table) : { values: value => insert(table).values({
      canPublishProperties: false, canCreateReferralLinks: false, reportEmails: [], emailVerifiedAt: null, createdAt: new Date(), id: crypto.randomUUID(), ...value }) };
    const { registerAction } = load('apps/web/src/app/[locale]/registro/actions.ts');
    ip = 1;
    await registerAction(form({ locale: 'en', name: 'Ana <b>', email: ' Ana@Test.invalid ', password: 'clave-larga-1' }));
    const ana = row('User', 'email', 'ana@test.invalid');
    assert.ok(ana && ana.emailVerifiedAt === null, 'Cuenta creada sin confirmar');
    assert.equal(sent.length, 1); assert.equal(sent[0].to, 'ana@test.invalid');
    assert.equal(sent[0].subject, 'Confirma tu correo — ALIA FOR RENT');
    assert.ok(sent[0].html.includes('Ana &lt;b&gt;') && !sent[0].html.includes('Ana <b>'), 'Nombre escapado');
    assert.ok(sent[0].html.includes('#654838') && sent[0].html.includes('24 horas'));
    const link = new URL(sent[0].html.match(/href="([^"]+)"/)[1].replaceAll('&amp;', '&'));
    assert.equal(`${link.origin}${link.pathname}`, 'https://aliaforrent.example/en/confirmar-correo', 'Enlace público con idioma');
    const anaToken = tokenFrom(sent[0].html);
    assert.equal(row('EmailVerificationToken', '"tokenHash"', sha(anaToken)).userId, ana.id);
    assert.equal(signedIn.at(-1).redirectTo, '/en/mi-cuenta');
    // Si el correo falla, el registro sigue y Mi cuenta ofrece reenviar.
    failMail = true; ip = 2;
    await registerAction(form({ locale: 'es', name: 'Beto', email: 'beto@test.invalid', password: 'clave-larga-1' }));
    failMail = false;
    assert.ok(row('User', 'email', 'beto@test.invalid'), 'Fallo de correo: la cuenta existe');
    assert.equal(signedIn.at(-1).redirectTo, '/es/mi-cuenta?correo=error');

    // 5. /confirmar-correo: confirma al dueño del token (aunque la sesión sea de otra cuenta) y lo consume.
    const { renderToStaticMarkup } = req('react-dom/server');
    const Confirm = load('apps/web/src/app/[locale]/confirmar-correo/page.tsx').default;
    const confirm = async (searchParams, locale = 'es') => renderToStaticMarkup(await Confirm({ params: Promise.resolve({ locale }), searchParams: Promise.resolve(searchParams) }));
    const es = require('../apps/web/messages/es.json').auth;
    currentSession = { user: { id: 'client' } };
    let html = await confirm({ token: anaToken });
    assert.ok(html.includes(es.verifyDone), 'Confirmado');
    assert.ok(row('User', 'id', ana.id).emailVerifiedAt, 'emailVerifiedAt lleno');
    assert.equal(row('User', 'id', 'client').emailVerifiedAt, null, 'Token ajeno: la sesión no se confirma');
    html = await confirm({ token: anaToken });
    assert.ok(html.includes(es.verifyUsed) && html.includes('name="email"'), 'Ya usado + reenviar');
    html = await confirm({ token: 'basura' });
    assert.ok(html.includes(es.verifyInvalid) && html.includes(es.verifyResend));
    html = await confirm({ token: other });
    assert.ok(html.includes(es.verifyExpired), 'Vencido');
    html = await confirm({});
    assert.ok(html.includes(es.verifyInvalid), 'Sin token');
    html = await confirm({ reenviado: '1' });
    assert.ok(html.includes(es.verifyResent));

    // 6. Reenviar: respuesta genérica, no revela si existe; límite por IP.
    const { resendVerification } = load('apps/web/src/app/[locale]/confirmar-correo/actions.ts');
    currentSession = null; sent.length = 0; ip = 10;
    const generic = '/es/confirmar-correo?reenviado=1';
    await assert.rejects(() => resendVerification(form({ locale: 'es', email: 'nadie@test.invalid' })), e => e.url === generic);
    await assert.rejects(() => resendVerification(form({ locale: 'es', email: 'ana@test.invalid' })), e => e.url === generic);
    assert.equal(sent.length, 0, 'Inexistente o ya confirmada: no se envía');
    await assert.rejects(() => resendVerification(form({ locale: 'es', email: ' BETO@test.invalid ' })), e => e.url === generic);
    assert.equal(sent.length, 1); assert.equal(sent[0].to, 'beto@test.invalid');
    const betoToken = tokenFrom(sent[0].html);
    // Con sesión: se reenvía a la cuenta de la sesión, no al correo del formulario, y vuelve a Mi cuenta.
    const beto = row('User', 'email', 'beto@test.invalid');
    currentSession = { user: { id: beto.id } }; ip = 11; sent.length = 0;
    await assert.rejects(() => resendVerification(form({ locale: 'fr', email: 'otro@test.invalid' })), e => e.url === '/fr/mi-cuenta?correo=reenviado');
    assert.deepEqual(sent.map(m => m.to), ['beto@test.invalid']);
    assert.deepEqual(await tokens.consumeToken(verify, betoToken), { status: 'used' }, 'El reenvío invalida el enlace anterior');
    currentSession = null; ip = 12;
    const limited = [];
    for (let i = 0; i < 4; i++) limited.push(await resendVerification(form({ locale: 'es', email: 'nadie@test.invalid' })).catch(e => e.url));
    assert.deepEqual(limited, [generic, generic, generic, '/es/confirmar-correo?limite=1'], '3 por hora y por IP');
    html = await confirm({ limite: '1' });
    assert.ok(html.includes(es.verifyLimited));

    // 7. «Olvidé mi contraseña»: hash en la tabla, invalida el anterior, se consume al usarlo.
    const { requestPasswordReset } = load('apps/web/src/app/[locale]/olvide-password/actions.ts');
    const { resetPassword } = load('apps/web/src/app/[locale]/reset-password/actions.ts');
    const Reset = load('apps/web/src/app/[locale]/reset-password/page.tsx').default;
    sent.length = 0; ip = 20;
    await assert.rejects(() => requestPasswordReset(form({ email: 'client@test.invalid', locale: 'es' })), e => e.url === '/es/olvide-password?sent=1');
    await assert.rejects(() => requestPasswordReset(form({ email: 'client@test.invalid', locale: 'es' })), e => e.url === '/es/olvide-password?sent=1');
    const [oldReset, newReset] = sent.map(m => tokenFrom(m.html));
    assert.ok(row('PasswordResetToken', 'token', sha(newReset)), 'Se guarda el hash');
    assert.equal(memory.prepare('SELECT count(*) n FROM "PasswordResetToken" WHERE token IN (?, ?)').get(oldReset, newReset).n, 0, 'Nunca en claro');
    assert.ok(row('PasswordResetToken', 'token', sha(oldReset)).usedAt, 'Pedir otro invalida el anterior');
    const resetHtml = async t => renderToStaticMarkup(await Reset({ params: Promise.resolve({ locale: 'es' }), searchParams: Promise.resolve({ token: t }) }));
    assert.ok((await resetHtml(newReset)).includes('name="password"'), 'El enlace nuevo abre el formulario');
    assert.ok(!(await resetHtml(oldReset)).includes('name="password"'), 'El anterior ya no');
    assert.ok(!(await resetHtml(sha(newReset))).includes('name="password"'), 'El hash no sirve como enlace');
    const bcrypt = req('bcryptjs');
    await assert.rejects(() => resetPassword(form({ token: oldReset, password: 'restablecida-1', locale: 'es' })), e => e.url === '/es/reset-password?error=invalido');
    await assert.rejects(() => resetPassword(form({ token: newReset, password: 'restablecida-1', locale: 'es' })), e => e.url === '/es/login?reset=1');
    assert.ok(bcrypt.compareSync('restablecida-1', row('User', 'id', 'client').passwordHash));
    await assert.rejects(() => resetPassword(form({ token: newReset, password: 'otra-clave-22', locale: 'es' })), e => e.url === '/es/reset-password?error=invalido', 'Un solo uso');
    assert.ok(bcrypt.compareSync('restablecida-1', row('User', 'id', 'client').passwordHash), 'El segundo uso no cambia nada');

    // 8. Mi cuenta: banner para cuentas sin confirmar.
    const fs = require('node:fs');
    const page = fs.readFileSync('apps/web/src/app/[locale]/mi-cuenta/page.tsx', 'utf8');
    assert.match(page, /emailVerifiedAt/); assert.match(page, /<VerifyEmailBanner/);
    console.log('OK confirmar correo: tokens con hash (24 h, un solo uso, invalida anteriores), registro con aviso, reenviar genérico con límite y recuperación endurecida.');
  } catch (error) { console.error = errors; console.error(error); process.exitCode = 1; }
  finally { console.error = errors; }
})();
