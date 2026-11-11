// T-4736: programa de referidos — utilidades, CRUD de colaboradores (solo ADMIN), código único,
// atribución cookie → consulta → reserva, y reserva/consulta sin ref intactas.
// SQLite en memoria: no prueba CHECK/FK/numeric de PostgreSQL (eso se ensaya en Respaldo con scripts/sql/referral-program.sql).
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { load, memory, setSession, portal, req } = require('./test-property-access.cjs');

const lib = load('apps/web/src/lib/referral.ts');
const partnersRoute = load('apps/web/src/app/api/panel/partners/route.ts');
const partnerRoute = load('apps/web/src/app/api/panel/partners/[id]/route.ts');
const linksRoute = load('apps/web/src/app/api/panel/partners/[id]/links/route.ts');
const inquiry = load('apps/web/src/app/api/messages/route.ts');
const booking = load('apps/web/src/app/api/bookings/create/route.ts');
const listPage = load('apps/web/src/app/[locale]/panel/referidos/page.tsx').default;
const detailPage = load('apps/web/src/app/[locale]/panel/referidos/[id]/page.tsx').default;

const json = (body, method = 'POST') => new Request('http://localhost/test', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
const ctx = id => ({ params: Promise.resolve({ id }) });
let ip = 0;
const sendInquiry = (cookie, propertyId = 'pa', startDate = '2027-08-01', endDate = '2027-08-03') => {
  const form = new FormData();
  for (const [key, value] of Object.entries({ propertyId, name: 'Guest', email: 'guest@test.invalid', startDate, endDate, guests: '1', body: 'Hola' })) form.set(key, value);
  const headers = { 'x-forwarded-for': `10.0.0.${++ip}` };
  if (cookie) headers.cookie = cookie;
  return inquiry.POST(new Request('http://localhost/api/messages', { method: 'POST', headers, body: form }));
};
const row = (table, id) => memory.prepare(`SELECT * FROM "${table}" WHERE id = ?`).get(id);

(async () => {
  try {
    // 1. Utilidades puras
    assert.equal(lib.normalizeReferralCode(' casa-azul '), 'CASA-AZUL');
    for (const bad of ['', 'abc', 'con espacio', 'X'.repeat(33), 'ñandu12', null, 42, '<script>']) assert.equal(lib.normalizeReferralCode(bad), null, String(bad));
    assert.equal(lib.referralCodeFromCookieHeader('a=1; alia_ref=casa-azul; b=2'), 'CASA-AZUL');
    assert.equal(lib.referralCodeFromCookieHeader('alia_ref=%E0%A4%A'), null, 'Cookie mal codificada no lanza');
    assert.equal(lib.referralCodeFromCookieHeader('otra=1'), null);
    assert.equal(lib.referralCodeFromCookieHeader(null), null);
    const options = lib.referralCookieOptions(true);
    assert.equal(options.maxAge, 30 * 24 * 60 * 60, 'Cookie de 30 días');
    assert.deepEqual([options.httpOnly, options.sameSite, options.secure, options.path], [true, 'lax', true, '/']);
    assert.equal(lib.referralCookieOptions(false).secure, false);
    for (let i = 0; i < 50; i++) assert.match(lib.generateReferralCode(), /^[A-HJKMNP-Z2-9]{8}$/);
    assert.equal(lib.referralUrl('https://alia.example', 'CASA-AZUL'), 'https://alia.example/?ref=CASA-AZUL');
    assert.equal(lib.referralUrl('https://alia.example', 'CASA-AZUL', 'casa azul'), 'https://alia.example/casas/casa%20azul?ref=CASA-AZUL');

    // El proxy escribe la cookie solo con un ?ref= válido y sin redirigir (lectura silenciosa).
    const proxy = fs.readFileSync('apps/web/src/proxy.ts', 'utf8');
    assert.match(proxy, /normalizeReferralCode\(req\.nextUrl\.searchParams\.get\('ref'\)\)/);
    assert.match(proxy, /if \(ref\) response\.cookies\.set\(REFERRAL_COOKIE, ref, referralCookieOptions\(\)\)/);

    // 2. Solo ADMIN gestiona colaboradores; no existe DELETE.
    for (const [id, status] of [[null, 401], ['a', 403], ['client', 403]]) {
      setSession(id ? { user: { id } } : null);
      assert.equal((await partnersRoute.GET()).status, status);
      assert.equal((await partnersRoute.POST(json({ name: 'X', commissionPercent: '10' }))).status, status);
      assert.equal((await partnerRoute.PATCH(json({ active: false }, 'PATCH'), ctx('x'))).status, status);
      assert.equal((await linksRoute.POST(json({}), ctx('x'))).status, status);
      await assert.rejects(() => listPage({ params: Promise.resolve({ locale: 'es' }) }), e => e.status === 404);
    }
    for (const route of [partnersRoute, partnerRoute, linksRoute]) assert.equal(route.DELETE, undefined, 'Nada se borra');

    // 3. Creación de partner
    setSession({ user: { id: 'admin' } });
    for (const bad of [{ commissionPercent: '10' }, { name: ' ', commissionPercent: '10' }, { name: 'X', commissionPercent: '101' },
      { name: 'X', commissionPercent: '-1' }, { name: 'X', commissionPercent: '10.123' }, { name: 'X', commissionPercent: 'diez' },
      { name: 'X', commissionPercent: '10', email: 'no-es-correo' }, { name: 'X', commissionPercent: '10', active: 'si' }]) {
      assert.equal((await partnersRoute.POST(json(bad))).status, 400, JSON.stringify(bad));
    }
    let res = await partnersRoute.POST(json({ name: '  Ana Promotora ', commissionPercent: '12.5', email: 'ana@test.invalid', phone: '' }));
    assert.equal(res.status, 201);
    const ana = (await res.json()).id;
    const anaRow = row('Partner', ana);
    assert.deepEqual([anaRow.name, anaRow.commissionPercent, anaRow.email, anaRow.phone, anaRow.active], ['Ana Promotora', '12.50', 'ana@test.invalid', null, 1]);
    const beto = (await (await partnersRoute.POST(json({ name: 'Beto', commissionPercent: 5 }))).json()).id;
    assert.equal(row('Partner', beto).commissionPercent, '5.00');

    // Editar y desactivar/activar (PATCH parcial)
    assert.equal((await partnerRoute.PATCH(json({}, 'PATCH'), ctx(ana))).status, 400, 'PATCH vacío');
    assert.equal((await partnerRoute.PATCH(json({ commissionPercent: '15' }, 'PATCH'), ctx(ana))).status, 200);
    assert.equal(row('Partner', ana).commissionPercent, '15.00'); assert.equal(row('Partner', ana).name, 'Ana Promotora', 'No toca lo que no viene');
    assert.equal((await partnerRoute.PATCH(json({ active: false }, 'PATCH'), ctx('missing'))).status, 404);

    // 4. Enlace único
    res = await linksRoute.POST(json({ code: 'casa-azul', propertyId: 'pa' }), ctx(ana));
    assert.equal(res.status, 201); const propertyLink = await res.json();
    assert.equal(propertyLink.code, 'CASA-AZUL');
    assert.equal((await linksRoute.POST(json({ code: 'CASA-AZUL' }), ctx(beto))).status, 409, 'Código repetido (aunque sea de otro colaborador)');
    assert.equal((await linksRoute.POST(json({ code: 'Casa-Azul' }), ctx(ana))).status, 409, 'Sin distinguir mayúsculas');
    assert.equal((await linksRoute.POST(json({ code: 'no válido' }), ctx(ana))).status, 400);
    assert.equal((await linksRoute.POST(json({ propertyId: 'no-existe' }), ctx(ana))).status, 400);
    assert.equal((await linksRoute.POST(json({ propertyId: 7 }), ctx(ana))).status, 400);
    assert.equal((await linksRoute.POST(json({}), ctx('missing'))).status, 404);
    res = await linksRoute.POST(json({}), ctx(beto));
    assert.equal(res.status, 201); const generalLink = await res.json();
    assert.match(generalLink.code, /^[A-HJKMNP-Z2-9]{8}$/);
    assert.equal(row('ReferralLink', generalLink.id).propertyId, null, 'Enlace general');
    const codes = memory.prepare('SELECT code FROM "ReferralLink"').all().map(r => r.code);
    assert.equal(new Set(codes).size, codes.length);

    // 5. Atribución: cookie → consulta → reserva
    res = await sendInquiry('alia_ref=casa-azul');
    assert.equal(res.status, 201); const attributed = (await res.json()).message;
    assert.equal(row('Message', attributed.id).referredByPartnerId, ana);
    assert.equal(row('Message', attributed.id).referralLinkId, propertyLink.id);
    res = await booking.POST(json({ propertyId: 'pa', messageId: attributed.id, startDate: '2027-08-01', endDate: '2027-08-03', guestName: 'Guest' }));
    assert.equal(res.status, 200);
    const attributedBooking = memory.prepare('SELECT * FROM "Booking" WHERE "propertyId" = ? AND "startDate" = ?').get('pa', '2027-08-01');
    assert.equal(attributedBooking.referredByPartnerId, ana); assert.equal(attributedBooking.referralLinkId, propertyLink.id);
    assert.equal(attributedBooking.referralMessageId, attributed.id);
    assert.equal(attributedBooking.commissionPercent, '15.00', 'Comisión congelada al confirmar');
    assert.ok(!('referredByPartnerId' in attributed) && !('referralLinkId' in attributed), 'La respuesta pública no revela la atribución');
    // Una consulta atribuye como mucho una reserva: la segunda se guarda, pero sin atribución.
    res = await booking.POST(json({ propertyId: 'pa', messageId: attributed.id, startDate: '2027-08-10', endDate: '2027-08-12' }));
    assert.equal(res.status, 200);
    const second = memory.prepare('SELECT * FROM "Booking" WHERE "propertyId" = ? AND "startDate" = ?').get('pa', '2027-08-10');
    assert.deepEqual([second.referredByPartnerId, second.referralLinkId, second.referralMessageId, second.commissionPercent], [null, null, null, null]);
    // Editar el % después no cambia lo ya atribuido.
    assert.equal((await partnerRoute.PATCH(json({ commissionPercent: '20' }, 'PATCH'), ctx(ana))).status, 200);
    assert.equal(row('Booking', attributedBooking.id).commissionPercent, '15.00');

    // Enlace general de Beto usado para otra casa: atribuye al colaborador igualmente.
    res = await sendInquiry(`x=1; alia_ref=${generalLink.code}`, 'pb', '2027-09-01', '2027-09-03');
    assert.equal(row('Message', (await res.json()).message.id).referredByPartnerId, beto);

    // La consulta de otra propiedad no presta su atribución a una reserva ajena.
    res = await booking.POST(json({ propertyId: 'pb', messageId: attributed.id, startDate: '2027-10-01', endDate: '2027-10-03' }));
    assert.equal(res.status, 200);
    assert.equal(memory.prepare('SELECT "referredByPartnerId" p FROM "Booking" WHERE "propertyId" = ? AND "startDate" = ?').get('pb', '2027-10-01').p, null);
    assert.equal((await booking.POST(json({ propertyId: 'pa', messageId: 9, startDate: '2027-10-01', endDate: '2027-10-03' }))).status, 400);

    // 6. Sin ref nada se rompe: consulta y reserva se guardan con null.
    for (const cookie of [null, 'alia_ref=NOEXISTE', 'alia_ref=%%%', 'otra=valor']) {
      res = await sendInquiry(cookie, 'pa', '2027-11-01', '2027-11-03');
      assert.equal(res.status, 201, String(cookie));
      const message = row('Message', (await res.json()).message.id);
      assert.equal(message.referredByPartnerId, null); assert.equal(message.referralLinkId, null);
    }
    res = await booking.POST(json({ propertyId: 'pa', startDate: '2027-12-01', endDate: '2027-12-04' }));
    assert.equal(res.status, 200, 'Reserva sin messageId ni ref');
    const plain = memory.prepare('SELECT * FROM "Booking" WHERE "propertyId" = ? AND "startDate" = ?').get('pa', '2027-12-01');
    assert.equal(plain.referredByPartnerId, null); assert.equal(plain.referralLinkId, null);

    // Colaborador desactivado: sus enlaces dejan de atribuir; lo registrado se conserva.
    assert.equal((await partnerRoute.PATCH(json({ active: false }, 'PATCH'), ctx(ana))).status, 200);
    assert.equal(row('Partner', ana).active, 0);
    res = await sendInquiry('alia_ref=CASA-AZUL', 'pa', '2028-01-01', '2028-01-03');
    assert.equal(res.status, 201); assert.equal(row('Message', (await res.json()).message.id).referredByPartnerId, null);
    assert.equal(row('Booking', attributedBooking.id).referredByPartnerId, ana, 'Historial intacto');

    // 7. Vistas del panel: lista y ficha con enlaces y reservas atribuidas.
    const listed = await (await partnersRoute.GET()).json();
    const anaListed = listed.partners.find(p => p.id === ana);
    assert.deepEqual([anaListed.linkCount, anaListed.bookingCount], [1, 1]);
    const detail = await (await partnerRoute.GET(new Request('http://localhost/test'), ctx(ana))).json();
    assert.equal(detail.links[0].code, 'CASA-AZUL'); assert.equal(detail.links[0].slug, 'pa'); assert.equal(detail.links[0].bookingCount, 1);
    assert.equal(detail.bookings.length, 1); assert.equal(detail.bookings[0].code, 'CASA-AZUL'); assert.equal(detail.bookings[0].commissionPercent, '15.00');
    // Resuelve server components asíncronos anidados (ReferralSections); los cliente se dejan como elemento.
    const expand = async node => {
      if (Array.isArray(node)) return Promise.all(node.map(expand));
      if (!node || typeof node !== 'object') return node;
      if (typeof node.type === 'function' && node.type.constructor.name === 'AsyncFunction') return expand(await node.type(node.props));
      return node.props?.children === undefined ? node : { ...node, props: { ...node.props, children: await expand(node.props.children) } };
    };
    const flat = node => !node || typeof node !== 'object' ? String(node ?? '') : [node.props?.children].flat(Infinity).map(flat).join('') + ' ' + Object.values(node.props ?? {}).filter(v => typeof v === 'string').join(' ');
    for (const locale of ['es', 'en', 'fr']) {
      const list = flat(await listPage({ params: Promise.resolve({ locale }) }));
      assert.ok(list.includes('Ana Promotora') && list.includes('20.00%'), locale);
      const page = flat(await expand(await detailPage({ params: Promise.resolve({ locale, id: ana }) })));
      assert.ok(page.includes('http://localhost:3000/casas/pa?ref=CASA-AZUL'), `URL copiable (${locale})`);
    }
    await assert.rejects(() => detailPage({ params: Promise.resolve({ locale: 'es', id: 'missing' }) }), e => e.status === 404);
    const layout = fs.readFileSync('apps/web/src/app/[locale]/panel/layout.tsx', 'utf8');
    assert.match(layout, /manager\.role === 'ADMIN' && <Link href="\/panel\/referidos"/, 'Menú solo para ADMIN');
    for (const locale of ['es', 'en', 'fr']) {
      const keys = Object.keys(JSON.parse(fs.readFileSync(`apps/web/messages/${locale}.json`, 'utf8')).referrals);
      assert.deepEqual(keys.sort(), Object.keys(JSON.parse(fs.readFileSync('apps/web/messages/es.json', 'utf8')).referrals).sort(), locale);
    }
    // 8. Nombre de quien refirió en las consultas (/panel/consultas y /admin/mensajes), también para el colaborador dueño.
    const findRows = node => {
      if (!node || typeof node !== 'object') return null;
      if (Array.isArray(node)) { for (const n of node) { const r = findRows(n); if (r) return r; } return null; }
      if (node.props?.rows) return node.props.rows;
      return findRows(node.props?.children);
    };
    memory.prepare('UPDATE "Message" SET "createdAt" = ? WHERE "createdAt" IS NULL').run('2026-11-10 12:00:00'); // DEFAULT now() de PostgreSQL
    const consultas = load('apps/web/src/app/[locale]/panel/consultas/page.tsx').default;
    const mensajes = load('apps/web/src/app/[locale]/admin/mensajes/page.tsx').default;
    for (const who of ['admin', 'a']) {
      setSession({ user: { id: who } });
      const rows = findRows(await consultas({ params: Promise.resolve({ locale: 'es' }) }));
      assert.equal(rows.find(r => r.id === attributed.id).referredBy, 'Ana Promotora', `consultas (${who})`);
      assert.equal(rows.find(r => r.id === 'ma').referredBy, null, 'Consulta sin referido');
      const adminRows = (await mensajes()).props.rows;
      assert.equal(adminRows.find(r => r.id === attributed.id).referredBy, 'Ana Promotora', `mensajes (${who})`);
    }
    for (const file of ['apps/web/src/components/panel/Inquiries.tsx', 'apps/web/src/components/MensajesList.tsx']) {
      assert.match(fs.readFileSync(file, 'utf8'), /referredBy && .*\(["']referredBy["'], \{ name: (row|m)\.referredBy \}\)/, file);
    }

    // 9. Permiso del colaborador para crear sus propios enlaces.
    const usersRoute = load('apps/web/src/app/api/panel/users/[id]/route.ts');
    const { PgDialect } = req('drizzle-orm/pg-core');
    setSession({ user: { id: 'admin' } });
    const execute = portal.db.execute, writes = [];
    portal.db.execute = async statement => { writes.push(new PgDialect().sqlToQuery(statement)); return { rows: [{ id: 'audit' }] }; };
    try {
      const patch = (id, body) => usersRoute.PATCH(json({ confirmed: true, ...body }, 'PATCH'), ctx(id));
      assert.equal((await patch('client', { action: 'referrals', allowed: true })).status, 400, 'Solo COLLABORATOR');
      assert.equal((await patch('a', { action: 'referrals', allowed: false })).status, 400, 'Ya está sin permiso');
      assert.equal((await patch('a', { action: 'referrals', allowed: 'si' })).status, 400);
      assert.equal(writes.length, 0);
      assert.equal((await patch('a', { action: 'referrals', allowed: true })).status, 200);
      assert.ok(writes[0].sql.includes('"canCreateReferralLinks" = $')); assert.ok(writes[0].params.includes('REFERRAL_PERMISSION'));
      assert.ok(writes[0].sql.includes('insert into "Partner"'), 'Conceder crea el Partner ligado (si no existe)');
      assert.ok(writes[0].sql.includes('not exists (select 1 from "Partner" p where p."userId" = changed."id")'));
      memory.prepare('UPDATE "User" SET "canCreateReferralLinks" = 1 WHERE id = ?').run('a');
      assert.equal((await patch('a', { action: 'referrals', allowed: false })).status, 200);
      assert.ok(!writes[1].sql.includes('insert into "Partner"'), 'Revocar no toca el Partner');
      assert.equal((await patch('a', { action: 'role', role: 'CLIENT' })).status, 200);
      assert.ok(writes[2].sql.includes('"canCreateReferralLinks" = false'), 'Cambiar de rol revoca el permiso');
    } finally { portal.db.execute = execute; }
    memory.prepare('UPDATE "User" SET "canCreateReferralLinks" = 0 WHERE id = ?').run('a');

    const myLinks = load('apps/web/src/app/api/panel/my-referrals/links/route.ts');
    const myPage = load('apps/web/src/app/[locale]/panel/mis-referidos/page.tsx').default;
    const myPost = body => myLinks.POST(json(body));
    // Sin permiso / sin partner / otros roles: no hay acceso.
    for (const id of ['a', 'b', 'admin', 'client']) {
      setSession({ user: { id } });
      assert.equal((await myPost({})).status, 403, id);
      await assert.rejects(() => myPage({ params: Promise.resolve({ locale: 'es' }) }), e => e.status === 404);
    }
    // Estado tras conceder (el CTE de PostgreSQL no corre en SQLite: se siembra igual que lo dejaría).
    memory.prepare('INSERT INTO "Partner" (id, name, email, commissionPercent, active, userId, createdAt, updatedAt) VALUES (?,?,?,?,?,?,?,?)')
      .run('partner-a', 'a', 'a@test.invalid', '0.00', 1, 'a', '2026-11-10', '2026-11-10');
    setSession({ user: { id: 'a' } });
    assert.equal((await myPost({})).status, 403, 'Partner ligado pero sin permiso');
    memory.prepare('UPDATE "User" SET "canCreateReferralLinks" = 1 WHERE id = ?').run('a');
    res = await myPost({}); assert.equal(res.status, 201, 'Enlace general');
    const ownGeneral = await res.json(); assert.equal(row('ReferralLink', ownGeneral.id).partnerId, 'partner-a');
    assert.equal((await myPost({ propertyId: 'pa', code: 'MI-CASA' })).status, 201, 'Su propiedad');
    assert.equal((await myPost({ propertyId: 'pb' })).status, 400, 'Propiedad ajena');
    assert.equal((await myPost({ code: 'CASA-AZUL' })).status, 409, 'Código ya usado');
    const mine = flat(await expand(await myPage({ params: Promise.resolve({ locale: 'es' }) })));
    assert.ok(mine.includes('/casas/pa?ref=MI-CASA') && mine.includes(`/?ref=${ownGeneral.code}`), 'Ve sus enlaces');
    assert.ok(!mine.includes('CASA-AZUL'), 'No ve enlaces de otros colaboradores');
    const ownOptions = await load('apps/web/src/lib/referrals.ts').ownReferralPropertyOptions({ id: 'a', role: 'COLLABORATOR' });
    assert.deepEqual(ownOptions.map(p => p.id).sort(), ['hidden', 'pa'], 'Solo sus propiedades');
    setSession({ user: { id: 'b' } });
    assert.equal((await myPost({})).status, 403, 'Otra colaboradora sin permiso');
    setSession({ user: { id: 'admin' } });
    assert.equal((await partnerRoute.PATCH(json({ active: false }, 'PATCH'), ctx('partner-a'))).status, 200);
    setSession({ user: { id: 'a' } });
    assert.equal((await myPost({})).status, 403, 'Partner desactivado no crea enlaces');
    const inactive = flat(await expand(await myPage({ params: Promise.resolve({ locale: 'es' }) })));
    assert.ok(inactive.includes('MI-CASA'), 'Pero sigue viendo lo suyo');
    assert.match(fs.readFileSync('apps/web/src/app/[locale]/panel/layout.tsx', 'utf8'), /\{ownReferrals && <Link href="\/panel\/mis-referidos"/);
    assert.match(fs.readFileSync('apps/web/src/components/panel/UserActions.tsx', 'utf8'), /role === 'COLLABORATOR' && <button type=\"button\" disabled=\{busy\} className=\{buttonClass\} onClick=\{\(\) => change\('referrals', !canCreateReferralLinks\)\}/);
    for (const locale of ['es', 'en', 'fr']) {
      const admin = JSON.parse(fs.readFileSync(`apps/web/messages/${locale}.json`, 'utf8')).adminUsers;
      for (const key of ['grantReferrals', 'revokeReferrals', 'confirmReferralsGrant', 'confirmReferralsRevoke']) assert.ok(admin[key], `${locale}.${key}`);
    }
    console.log('OK referidos: CRUD solo ADMIN, código único, cookie → consulta → reserva, sin ref intacto.');
  } catch (error) { console.error(error); process.exit(1); }
})();
