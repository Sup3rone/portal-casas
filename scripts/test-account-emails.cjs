// T-4772: correo de confirmación de reserva (huésped + copia al dueño) y contraseña (cambiar en Mi cuenta,
// aviso al cambiarla o restablecerla). Offline: correo simulado, SQLite en memoria; sin Resend ni Neon.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { load, req, memory, mockModule, setSession } = require('./test-property-access.cjs');

const sent = [];
let ip = 0, failMail = false;
globalThis.__testMailer = async message => { if (failMail) throw new Error('Resend caído'); sent.push(message); };
mockModule('next/headers', { headers: async () => new Headers({ 'x-forwarded-for': `203.0.113.${ip}` }) });
mockModule('next/navigation', { redirect: url => { const error = new Error('NEXT_REDIRECT'); error.url = url; throw error; }, notFound: () => { throw new Error('notFound'); } });
const json = body => new Request('http://localhost/test', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
const bcrypt = req('bcryptjs');

(async () => {
  const errors = console.error, logs = console.log; console.error = () => {}; console.log = () => {};
  try {
    // 1. Plantilla: datos completos, fechas sin desfase, escapado.
    const mail = load('apps/web/src/lib/booking-emails.ts');
    assert.equal(mail.civilDate('2027-08-01'), '1 de agosto de 2027', 'Fecha civil sin desfase de zona horaria');
    assert.equal(mail.nightsBetween('2027-08-01', '2027-08-04'), 3);
    assert.equal(mail.bookingFolio('0a1b2c3d-4e5f-6789-abcd-ef0123456789'), '0A1B2C3D');
    assert.equal(mail.escapeHtml(`<b>"x"&'y'</b>`), '&lt;b&gt;&quot;x&quot;&amp;&#39;y&#39;&lt;/b&gt;');
    const data = { bookingId: '0a1b2c3d-0000', startDate: '2027-08-01', endDate: '2027-08-04', rentAmount: '3000.00', cleaningCost: '500.00', taxes: '560.00',
      property: { title: 'Casa <Azul>', address: 'Calle 1', location: 'Puerto Vallarta, Jalisco' }, guest: { name: '<script>x</script>', email: 'g@test.invalid', phone: '+52 1' } };
    const guestMail = mail.guestConfirmationEmail(data);
    for (const text of ['Casa &lt;Azul&gt;', 'Calle 1, Puerto Vallarta, Jalisco', '1 de agosto de 2027', '4 de agosto de 2027', '<strong>Noches:</strong> 3', '0A1B2C3D', '4,060', 'Su reserva está confirmada']) assert.ok(guestMail.html.includes(text), text);
    assert.ok(!guestMail.html.includes('<script>') && guestMail.html.includes('&lt;script&gt;'), 'Nombre escapado');
    assert.match(guestMail.subject, /Casa <Azul> \(folio 0A1B2C3D\)/);
    const ownerMail = mail.ownerCopyEmail(data);
    assert.ok(ownerMail.html.includes('g@test.invalid') && ownerMail.html.includes('+52 1') && ownerMail.subject.startsWith('Copia:'), 'Copia al dueño con contacto');
    const noMoney = mail.guestConfirmationEmail({ ...data, rentAmount: null, cleaningCost: null, taxes: null });
    assert.ok(!noMoney.html.includes('Total') && noMoney.html.includes('Noches'), 'Sin desglose: sin importes');

    // 2. Ruta real de confirmación: huésped + copia al dueño (a@test.invalid, dueño de pa).
    memory.prepare('UPDATE "Property" SET address = ? WHERE id = ?').run('Av. del Mar 10', 'pa');
    memory.prepare('UPDATE "Message" SET name = ?, email = ?, phone = ? WHERE id = ?').run('Gina Huésped', 'gina@test.invalid', '3220000000', 'ma');
    const booking = load('apps/web/src/app/api/bookings/create/route.ts');
    setSession({ user: { id: 'a' } });
    let res = await booking.POST(json({ propertyId: 'pa', startDate: '2029-02-10', endDate: '2029-02-12', guestName: 'Gina Huésped', guestEmail: 'gina@test.invalid', messageId: 'ma' }));
    assert.equal(res.status, 200);
    assert.deepEqual(sent.map(m => m.to), ['gina@test.invalid', 'a@test.invalid'], 'Huésped y copia al dueño');
    assert.ok(sent[0].html.includes('Av. del Mar 10') && sent[0].html.includes('10 de febrero de 2029') && sent[0].html.includes('<strong>Noches:</strong> 2'));
    assert.ok(sent[1].html.includes('3220000000'), 'La copia lleva el teléfono de la consulta');
    // Consulta de otra casa: no presta su contacto. Sin correo de huésped: solo la copia al dueño.
    sent.length = 0;
    res = await booking.POST(json({ propertyId: 'pa', startDate: '2029-03-10', endDate: '2029-03-12', messageId: 'mb' }));
    assert.equal(res.status, 200);
    assert.deepEqual(sent.map(m => m.to), ['a@test.invalid'], 'Sin destinatario de huésped: solo el dueño');
    assert.ok(!sent[0].html.includes('viewer@test.invalid'));
    // Si el correo falla, la reserva sigue (200).
    sent.length = 0;
    failMail = true;
    res = await booking.POST(json({ propertyId: 'pa', startDate: '2029-04-10', endDate: '2029-04-12', guestEmail: 'gina@test.invalid' }));
    assert.equal(res.status, 200, 'Un fallo de correo no rompe la reserva');
    failMail = false; assert.equal(sent.length, 0);

    // 3. Cambiar contraseña en Mi cuenta.
    const { changePasswordAction } = load('apps/web/src/app/[locale]/mi-cuenta/actions.ts');
    const form = values => { const data = new FormData(); for (const [k, v] of Object.entries(values)) data.set(k, v); return data; };
    const change = values => { ip++; return changePasswordAction({ status: 'idle' }, form(values)); };
    memory.prepare('UPDATE "User" SET "passwordHash" = ? WHERE id = ?').run(bcrypt.hashSync('vieja-clave-1', 4), 'client');
    setSession(null);
    assert.deepEqual(await change({ current: 'vieja-clave-1', next: 'nueva-clave-1', confirm: 'nueva-clave-1' }), { status: 'error', error: 'session' });
    setSession({ user: { id: 'client' } });
    for (const [values, error] of [
      [{ current: 'otra', next: 'nueva-clave-1', confirm: 'nueva-clave-1' }, 'current'],
      [{ current: 'vieja-clave-1', next: 'corta', confirm: 'corta' }, 'length'],
      [{ current: 'vieja-clave-1', next: 'nueva-clave-1', confirm: 'nueva-clave-2' }, 'match'],
      [{ current: 'vieja-clave-1', next: 'vieja-clave-1', confirm: 'vieja-clave-1' }, 'same'],
    ]) assert.deepEqual(await change(values), { status: 'error', error }, error);
    assert.ok(bcrypt.compareSync('vieja-clave-1', memory.prepare('SELECT "passwordHash" h FROM "User" WHERE id = ?').get('client').h), 'Errores: no cambia');
    sent.length = 0;
    assert.deepEqual(await change({ current: 'vieja-clave-1', next: 'nueva-clave-1', confirm: 'nueva-clave-1' }), { status: 'ok' });
    assert.ok(bcrypt.compareSync('nueva-clave-1', memory.prepare('SELECT "passwordHash" h FROM "User" WHERE id = ?').get('client').h), 'Cambia el hash');
    assert.deepEqual(sent.map(m => m.to), ['client@test.invalid']); assert.match(sent[0].subject, /Tu contraseña cambió/);
    assert.ok(sent[0].html.includes('Mi cuenta') && !sent[0].html.includes('nueva-clave-1'), 'Aviso sin la contraseña');
    // Límite por IP: 5 intentos en 15 min.
    ip = 250; const limited = [];
    for (let i = 0; i < 6; i++) limited.push((await changePasswordAction({ status: 'idle' }, form({ current: 'x', next: 'nueva-clave-9', confirm: 'nueva-clave-9' }))).error);
    assert.deepEqual(limited, ['current', 'current', 'current', 'current', 'current', 'rate']);

    // 4. Restablecer con «olvidé mi contraseña» también avisa.
    memory.exec('CREATE TABLE IF NOT EXISTS "PasswordResetToken" (id text primary key, "userId" text not null, token text not null unique, "expiresAt" text not null, "usedAt" text, "createdAt" text)');
    memory.prepare('INSERT INTO "PasswordResetToken" (id, "userId", token, "expiresAt") VALUES (?,?,?,?)').run('t1', 'viewer', 'tok-1', '2999-01-01T00:00:00.000Z');
    const { resetPassword } = load('apps/web/src/app/[locale]/reset-password/actions.ts');
    sent.length = 0;
    const reset = new FormData(); reset.set('token', 'tok-1'); reset.set('password', 'restablecida-1'); reset.set('locale', 'es');
    await assert.rejects(() => resetPassword(reset), e => e.url === '/es/login?reset=1');
    assert.deepEqual(sent.map(m => m.to), ['viewer@test.invalid']); assert.ok(sent[0].html.includes('olvidé mi contraseña'));

    // 5. Mi cuenta muestra el botón.
    assert.match(fs.readFileSync('apps/web/src/app/[locale]/mi-cuenta/page.tsx', 'utf8'), /<ChangePasswordForm \/>/);
    assert.match(fs.readFileSync('apps/web/src/components/ChangePasswordForm.tsx', 'utf8'), /'Cambiar contraseña'/);
    console.log = logs;
    console.log('OK correos: confirmación completa al huésped y copia al dueño, cambiar contraseña con aviso, aviso al restablecer.');
  } catch (error) { console.error = errors; console.log = logs; console.error(error); process.exitCode = 1; }
  finally { console.error = errors; console.log = logs; }
})();
