// T-5322: rol DESIGNER (diseñador). Edita Panel → Contenido como el ADMIN y no entra a nada más:
// ni usuarios/contraseñas, ni casas, reservas, referidores, reportes, gastos, correos ni /admin.
// SQL real en memoria y SSR; sin Neon. El valor del enum en PostgreSQL se ensaya en Respaldo.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { load, portal, memory, req, setSession, setLocale } = require('./test-property-access.cjs');
const React = req('react'), { renderToStaticMarkup } = req('react-dom/server'), { NextIntlClientProvider } = req('next-intl');
const { PgDialect } = req('drizzle-orm/pg-core');
const { NextRequest } = req('next/server');

memory.prepare('INSERT INTO "User" (id,email,role,name) VALUES (?,?,?,?)').run('designer', 'designer@test.invalid', 'DESIGNER', 'designer');

const access = load('apps/web/src/lib/property-access.ts');
const panelServer = load('apps/web/src/lib/panel-server.ts');
const siteApi = load('apps/web/src/app/api/panel/site-content/route.ts');
const pageApi = load('apps/web/src/app/api/panel/page-content/route.ts');
const uploadApi = load('apps/web/src/app/api/panel/site-content/upload/route.ts');
const usersApi = load('apps/web/src/app/api/panel/users/route.ts');
const userApi = load('apps/web/src/app/api/panel/users/[id]/route.ts');
const ContentPage = load('apps/web/src/app/[locale]/panel/contenido/page.tsx').default;
const UsersPage = load('apps/web/src/app/[locale]/panel/usuarios/page.tsx').default;
const UserPage = load('apps/web/src/app/[locale]/panel/usuarios/[id]/page.tsx').default;
const PanelHome = load('apps/web/src/app/[locale]/panel/page.tsx').default;
const Layout = load('apps/web/src/app/[locale]/panel/layout.tsx').default;
const { adminRouteAllowed } = load('apps/web/src/lib/admin-route-access.ts');

const content = { about_title_es: 'Diseño', about_title_en: 'Design', about_title_fr: 'Design', about_image: '', about_es: 'Texto del diseñador', about_en: 'Designer text', about_fr: 'Texte', social_instagram: '', social_facebook: '', featured_property_id: '', contact_whatsapp: '' };
const json = (url, method, body) => new Request(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
const as = id => setSession(id ? { user: { id, role: 'ADMIN' } } : null); // JWT falsificado: manda el rol en BD.
const render = (locale, node) => renderToStaticMarkup(React.createElement(NextIntlClientProvider, { locale, messages: require(`../apps/web/messages/${locale}.json`), timeZone: 'America/Mexico_City' }, node));
const redirectsTo = url => error => error.message === 'redirect: ' + url;

async function main() {
  // 1. Guard: ADMIN y DESIGNER editan contenido; colaborador, cliente y lector no.
  for (const [id, ok] of [['admin', true], ['designer', true], ['a', false], ['client', false], ['viewer', false]]) {
    as(id);
    if (ok) assert.equal((await access.requireContentEditor()).id, id);
    else await assert.rejects(() => access.requireContentEditor(), e => e.status === 403);
    assert.equal((await siteApi.GET()).status, ok ? 200 : 403, `GET site-content ${id}`);
  }
  as(null); await assert.rejects(() => access.requireContentEditor(), e => e.status === 401);

  // 2. El diseñador guarda el contenido del home y entra al editor.
  as('designer');
  const saved = await siteApi.PUT(json('http://localhost/api/panel/site-content', 'PUT', content));
  assert.equal(saved.status, 200);
  assert.equal(memory.prepare('SELECT value FROM SiteContent WHERE key = ?').get('about_es').value, 'Texto del diseñador');
  for (const locale of ['es', 'en', 'fr']) {
    const editor = render(locale, await ContentPage({ params: Promise.resolve({ locale }) }));
    assert.ok(editor.includes('name="contact_whatsapp"'), `editor ${locale}`);
  }
  // Subida: pasa el guard (el formulario vacío responde 400 de validación, no 403).
  assert.equal((await uploadApi.POST(new Request('http://localhost/api/panel/site-content/upload', { method: 'POST', body: new FormData() }))).status, 400);
  // Páginas /nosotros y /unete: el SQL revalida ADMIN o DESIGNER dentro del statement.
  let statements = [];
  const execute = portal.db.execute;
  portal.db.execute = async statement => { statements.push(new PgDialect().sqlToQuery(statement)); return { rows: [{ key: 'page' }] }; };
  const pageSaved = await pageApi.PUT(json('http://localhost/api/panel/page-content', 'PUT', { page: 'about', texts: { es: {}, en: {}, fr: {} }, images: {} }));
  portal.db.execute = execute;
  assert.equal(pageSaved.status, 200, await pageSaved.clone().text());
  assert.ok(statements.some(s => s.sql.includes("actor.role::text in ('ADMIN', 'DESIGNER')")));
  for (const file of ['apps/web/src/lib/site-content.ts', 'apps/web/src/lib/page-content-store.ts']) {
    const source = fs.readFileSync(file, 'utf8');
    assert.ok(!source.includes("actor.role::text = 'ADMIN'"), `${file} sigue exigiendo solo ADMIN`);
    assert.ok(!source.includes('requireAdmin'), `${file} sigue con requireAdmin`);
  }

  // 3. Nada de usuarios ni contraseñas.
  assert.equal((await usersApi.GET(new NextRequest('http://localhost/api/panel/users'))).status, 403);
  assert.equal((await userApi.GET(new NextRequest('http://localhost/x'), { params: Promise.resolve({ id: 'client' }) })).status, 403);
  for (const body of [{ action: 'password', confirmed: true }, { action: 'role', role: 'DESIGNER', confirmed: true }]) {
    assert.equal((await userApi.PATCH(json('http://localhost/x', 'PATCH', body), { params: Promise.resolve({ id: 'client' }) })).status, 403);
  }
  await assert.rejects(() => UsersPage({ params: Promise.resolve({ locale: 'es' }), searchParams: Promise.resolve({}) }), e => e.status === 404);
  await assert.rejects(() => UserPage({ params: Promise.resolve({ locale: 'es', id: 'client' }) }), e => e.status === 404);

  // 4. El resto del panel lo devuelve a Contenido; /admin/* sigue cerrado.
  await assert.rejects(() => PanelHome({ params: Promise.resolve({ locale: 'es' }) }), redirectsTo('/es/panel/contenido'));
  await assert.rejects(() => panelServer.panelManager('fr'), redirectsTo('/fr/panel/contenido'));
  for (const path of ['/admin', '/admin/calendario', '/admin/mensajes', '/admin/tarifas']) assert.equal(adminRouteAllowed('/es' + path, 'DESIGNER'), false, path);
  // Un cliente sigue yendo al inicio, no a Contenido.
  as('client'); await assert.rejects(() => panelServer.panelManager('es'), redirectsTo('/es'));
  await assert.rejects(() => Layout({ params: Promise.resolve({ locale: 'es' }), children: 'x' }), redirectsTo('/es'));

  // 5. Menú del diseñador: solo Contenido (escritorio y barra móvil).
  as('designer');
  for (const locale of ['es', 'en', 'fr']) {
    setLocale(locale);
    const menu = render(locale, await Layout({ params: Promise.resolve({ locale }), children: 'panel' }));
    const hrefs = [...new Set([...menu.matchAll(/href="([^"]+)"/g)].map(m => m[1]))];
    assert.deepEqual(hrefs, [`/${locale}/panel/contenido`], `menú ${locale}: ${hrefs}`);
  }
  // El menú del ADMIN no cambia: sigue teniendo Usuarios y Vender.
  as('admin');
  setLocale('es');
  const adminMenu = render('es', await Layout({ params: Promise.resolve({ locale: 'es' }), children: 'panel' }));
  for (const href of ['/es/panel/usuarios', '/es/panel/contenido', '/es/panel/vender']) assert.ok(adminMenu.includes(`href="${href}"`), href);

  // 6. El ADMIN asigna y retira el rol; nunca a otro ADMIN ni a sí mismo.
  statements = [];
  portal.db.execute = async statement => { statements.push(new PgDialect().sqlToQuery(statement)); return { rows: [{ id: 'audit' }] }; };
  const patch = (id, body) => userApi.PATCH(json('http://localhost/x', 'PATCH', { confirmed: true, ...body }), { params: Promise.resolve({ id }) });
  assert.equal((await patch('client', { action: 'role', role: 'DESIGNER' })).status, 200);
  assert.ok(statements[0].params.includes('DESIGNER') && statements[0].params.includes('ROLE_CHANGE'));
  assert.ok(statements[0].sql.includes("target.\"role\"::text in ('CLIENT', 'COLLABORATOR', 'DESIGNER', 'VIEWER')"));
  assert.equal((await patch('designer', { action: 'role', role: 'CLIENT' })).status, 200);
  assert.equal((await patch('designer', { action: 'password' })).status, 200); // el ADMIN sí puede resetear a un diseñador
  assert.equal((await patch('designer', { action: 'role', role: 'DESIGNER' })).status, 400); // mismo rol
  assert.equal((await patch('designer', { action: 'role', role: 'ADMIN' })).status, 400);
  assert.equal((await patch('designer', { action: 'publication', allowed: true })).status, 400);
  assert.equal((await patch('admin', { action: 'role', role: 'DESIGNER' })).status, 403);
  portal.db.execute = execute;

  // 7. Textos en los 3 idiomas.
  for (const locale of ['es', 'en', 'fr']) {
    const messages = require(`../apps/web/messages/${locale}.json`);
    for (const value of [messages.nav.panelDesigner, messages.adminUsers.makeDesigner, messages.adminUsers.confirmDesigner, messages.adminUsers.roles.DESIGNER]) assert.ok(value, locale);
  }
  console.log('OK: diseñador edita home y páginas (guard + SQL), sube archivos, ve solo Contenido; 403/404 en usuarios y contraseñas; panel → Contenido; /admin cerrado; ADMIN asigna/retira el rol; es/en/fr. Enum PostgreSQL pendiente en Respaldo.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
