// T-5211 (app del vendedor, Task 7): aviso por correo al ADMIN y al dueño cuando entra una consulta (web o «Apartar»).
// Offline: SQL real sobre SQLite en memoria y correo simulado con globalThis.__testMailer. El correo NUNCA rompe la consulta.
const assert = require('node:assert/strict');
const { load, memory, setSession } = require('./test-property-access.cjs');
const sent = [];
let failMail = false;
globalThis.__testMailer = async message => { if (failMail) throw new Error('Resend caído'); sent.push(message); };
const { sendInquiryNotice } = load('apps/web/src/lib/inquiry-notice.ts');
const { holdDates, holdInput } = load('apps/web/src/lib/vendor-hold.ts');
const { POST } = load('apps/web/src/app/api/messages/route.ts');
const { inquiryToday } = load('apps/web/src/lib/inquiry-validation.ts');

const insert = (table, row) => memory.prepare(`INSERT INTO "${table}" (${Object.keys(row).map(k => `"${k}"`).join(',')}) VALUES (${Object.keys(row).map(() => '?').join(',')})`).run(...Object.values(row));
const plus = days => new Date(Date.parse(inquiryToday() + 'T00:00:00Z') + days * 86_400_000).toISOString().slice(0, 10);
const ownerA = { id: 'a', role: 'COLLABORATOR', canPublishProperties: false };
const quiet = async fn => { const error = console.error; const logged = []; console.error = (...args) => logged.push(args.join(' ')); try { return [await fn(), logged]; } finally { console.error = error; } };

memory.prepare('UPDATE "Property" SET "titleEs" = ?, "maxGuests" = 6, "rentalType" = ? WHERE id = ?').run('Casa Azul', 'nocturna', 'pa');
memory.prepare('UPDATE "User" SET name = ? WHERE id = ?').run('Vendedora A', 'a');
insert('User', { id: 'admin2', role: 'ADMIN', email: 'ADMIN@test.invalid', name: 'Admin repetido' }); // mismo correo que admin, otra mayúscula
insert('Partner', { id: 'pt-a', name: 'Vendedor A', commissionPercent: '10.00', active: 1, userId: 'a', createdAt: 0, updatedAt: 0 });

async function main() {
  // 1) Consulta pública → ADMIN(s) + dueño, un correo por persona, sin duplicados; datos de la consulta escapados.
  insert('Message', { id: 'm-public', propertyId: 'pa', name: '<b>Ana</b> & Co', email: 'ana@example.invalid', phone: '5215511112222', lang: 'es', body: 'Hola <script>x</script>', startDate: '2026-12-18', endDate: '2026-12-22', read: 0, referredByPartnerId: 'pt-a' });
  const result = await sendInquiryNotice('m-public', 'public');
  assert.deepEqual(result.sent.sort(), ['a@test.invalid', 'admin@test.invalid'], 'admins sin repetir + dueño');
  assert.equal(sent.length, 2);
  for (const mail of sent) {
    assert.equal(typeof mail.to, 'string', 'un correo por persona: nadie ve los correos de los demás');
    assert.match(mail.subject, /Nueva consulta — Casa Azul/);
    assert.ok(mail.html.includes('Casa Azul') && mail.html.includes('18 de diciembre de 2026') && mail.html.includes('22 de diciembre de 2026'));
    assert.ok(mail.html.includes('&lt;b&gt;Ana&lt;/b&gt; &amp; Co') && !mail.html.includes('<b>Ana'), 'nombre escapado');
    assert.ok(mail.html.includes('&lt;script&gt;') && !mail.html.includes('<script>'), 'mensaje escapado');
    assert.ok(mail.html.includes('ana@example.invalid') && mail.html.includes('5215511112222'));
    assert.ok(mail.html.includes('/es/admin/mensajes'), 'enlace a las consultas del panel');
    assert.ok(!/comisi|commission|pt-a|10\.00/i.test(mail.html + mail.subject), 'sin comisión ni atribución interna');
  }
  // Si el dueño es el propio ADMIN, recibe uno solo.
  sent.length = 0;
  memory.prepare('UPDATE "Property" SET "ownerId" = ? WHERE id = ?').run('admin', 'pb');
  insert('Message', { id: 'm-admin-house', propertyId: 'pb', name: 'Beto', email: 'beto@example.invalid', lang: 'es', body: 'Info', read: 0 });
  assert.deepEqual((await sendInquiryNotice('m-admin-house', 'public')).sent, ['admin@test.invalid']);
  assert.ok(!sent[0].html.includes('Llegada'), 'consulta sin fechas: no inventa fechas');
  memory.prepare('UPDATE "Property" SET "ownerId" = ? WHERE id = ?').run('b', 'pb');
  // Consulta inexistente → no manda nada.
  sent.length = 0;
  assert.deepEqual(await sendInquiryNotice('no-existe', 'public'), { sent: [] });
  assert.equal(sent.length, 0);

  // 2) «Apartar» del vendedor → aviso con asunto «Apartado por <vendedor>» (y la consulta + bloqueo quedan).
  sent.length = 0;
  const held = await holdDates(holdInput({ propertyId: 'pa', start: plus(20), end: plus(22), guests: 2, name: 'Carla', phone: '', email: '', note: '' }), ownerA);
  assert.equal(sent.length, 2);
  assert.ok(sent.every(mail => /Apartado por Vendedora A — Casa Azul/.test(mail.subject)));
  assert.equal(memory.prepare('SELECT count(*) n FROM "BlockDate" WHERE id = ?').get(held.blockId).n, 1);

  // 3) Si el correo falla, la consulta y el apartado se guardan igual y queda registrado el error.
  failMail = true;
  const [failedHold, logged] = await quiet(() => holdDates(holdInput({ propertyId: 'pa', start: plus(30), end: plus(31), guests: 1, name: 'Dora', phone: '', email: '', note: '' }), ownerA));
  assert.equal(memory.prepare('SELECT count(*) n FROM "Message" WHERE id = ?').get(failedHold.messageId).n, 1, 'consulta guardada');
  assert.equal(memory.prepare('SELECT count(*) n FROM "BlockDate" WHERE id = ?').get(failedHold.blockId).n, 1, 'apartado guardado');
  assert.ok(logged.some(line => /aviso/i.test(line)), 'el fallo se registra');
  const [notice] = await quiet(() => sendInquiryNotice('m-public', 'public'));
  assert.deepEqual(notice, { sent: [] }, 'nadie lo recibió, sin lanzar');
  // Consulta pública por la API real con el correo caído → 201 igual.
  setSession(null);
  const form = new FormData();
  for (const [key, value] of Object.entries({ propertyId: 'pa', name: 'Eva', email: 'eva@example.invalid', phone: '', startDate: plus(40), endDate: plus(42), guests: '2', body: 'Hola', lang: 'es' })) form.set(key, value);
  const before = memory.prepare('SELECT count(*) n FROM "Message"').get().n;
  const [response] = await quiet(() => POST(new Request('http://localhost/api/messages', { method: 'POST', headers: { 'x-forwarded-for': '192.0.2.250' }, body: form })));
  assert.equal(response.status, 201);
  assert.equal(memory.prepare('SELECT count(*) n FROM "Message"').get().n, before + 1);
  // Y con el correo funcionando, la API avisa.
  failMail = false; sent.length = 0;
  form.set('startDate', plus(50)); form.set('endDate', plus(52));
  assert.equal((await POST(new Request('http://localhost/api/messages', { method: 'POST', headers: { 'x-forwarded-for': '192.0.2.251' }, body: form }))).status, 201);
  assert.ok(sent.length === 2 && sent.every(mail => /Nueva consulta — Casa Azul/.test(mail.subject)), 'la consulta pública avisa');
  console.log('aviso por correo: admins + dueño sin duplicar, escapado, sin comisión, apartado, fallo sin romper OK');
  memory.close();
}
main().catch(error => { console.error(error); process.exitCode = 1; });
