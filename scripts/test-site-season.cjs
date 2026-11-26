// T-5324: tema por temporada. Guard ADMIN/DESIGNER, validación, SQL revalidado, layout con data-season,
// selector en Contenido y contraste AA de cada paleta (claro y oscuro). SQL real en memoria; sin Neon.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { load, portal, memory, req, setSession, setLocale } = require('./test-property-access.cjs');
const React = req('react'), { renderToStaticMarkup } = req('react-dom/server'), { NextIntlClientProvider } = req('next-intl');
const { PgDialect } = req('drizzle-orm/pg-core');
memory.prepare('INSERT INTO "User" (id,email,role,name) VALUES (?,?,?,?)').run('designer', 'designer@test.invalid', 'DESIGNER', 'designer');
const season = load('apps/web/src/lib/site-season.ts');
const api = load('apps/web/src/app/api/panel/site-season/route.ts');
const ContentPage = load('apps/web/src/app/[locale]/panel/contenido/page.tsx').default;
const put = body => api.PUT(new Request('http://localhost/api/panel/site-season', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }));
const as = id => setSession(id ? { user: { id, role: 'ADMIN' } } : null);
const render = (locale, node) => renderToStaticMarkup(React.createElement(NextIntlClientProvider, { locale, messages: require(`../apps/web/messages/${locale}.json`), timeZone: 'America/Mexico_City' }, node));

// Contraste WCAG.
const lum = hex => { const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(c => c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
const css = fs.readFileSync('apps/web/src/app/globals.css', 'utf8');
const block = selector => { const values = {}; let start = css.indexOf(selector + ' {'); assert.ok(start >= 0, selector); while (start >= 0) { const body = css.slice(start, css.indexOf('}', start)); for (const m of body.matchAll(/(--[\w-]+):\s*(#[0-9a-fA-F]{6})/g)) values[m[1]] = m[2]; start = css.indexOf(selector + ' {', start + 1); } return values; };

async function main() {
  // 1. Permisos: ADMIN y DESIGNER sí; colaborador, cliente, lector y sin sesión no.
  let writes = [];
  const execute = portal.db.execute;
  portal.db.execute = async statement => { writes.push(new PgDialect().sqlToQuery(statement)); return { rows: [{ key: 'site_season' }] }; };
  for (const [id, status] of [[null, 401], ['a', 403], ['client', 403], ['viewer', 403]]) { as(id); assert.equal((await put({ season: 'navidad' })).status, status, String(id)); }
  assert.equal(writes.length, 0);
  for (const id of ['admin', 'designer']) { as(id); const response = await put({ season: 'navidad' }); assert.equal(response.status, 200, id); assert.equal((await response.json()).season, 'navidad'); }
  assert.ok(writes[0].sql.includes("actor.role::text in ('ADMIN', 'DESIGNER')"));
  assert.ok(writes[0].params.includes('site_season') && writes[0].params.includes('navidad'));
  // 2. Validación.
  for (const body of [{ season: 'halloween' }, { season: '' }, {}, { season: 'navidad', extra: 1 }, ['navidad']]) assert.equal((await put(body)).status, 400, JSON.stringify(body));
  // 3. Sin el SQL (CHECK de claves) → 409 con código propio.
  portal.db.execute = async () => { const error = new Error('violates check constraint'); error.code = '23514'; throw error; };
  const missing = await put({ season: 'san-valentin' });
  assert.equal(missing.status, 409); assert.equal((await missing.json()).code, 'SITE_SEASON_NOT_READY');
  portal.db.execute = execute;
  // 4. Lectura: sin fila → normal; valor válido → ese; valor raro → normal.
  assert.equal(await season.readSiteSeason(), 'normal');
  memory.prepare('INSERT INTO SiteContent (key, value) VALUES (?, ?)').run('site_season', 'san-valentin');
  assert.equal(await load('apps/web/src/lib/site-season.ts').readSiteSeason(), 'san-valentin');
  memory.prepare('UPDATE SiteContent SET value = ? WHERE key = ?').run('<script>', 'site_season');
  assert.equal(await load('apps/web/src/lib/site-season.ts').readSiteSeason(), 'normal');
  memory.prepare('UPDATE SiteContent SET value = ? WHERE key = ?').run('navidad', 'site_season');
  // 5. Layout público: data-season en <html> (y nada cuando es normal).
  const layout = fs.readFileSync('apps/web/src/app/[locale]/layout.tsx', 'utf8');
  assert.match(layout, /data-season=\{season === 'normal' \? undefined : season\}/);
  // 6. Selector en Contenido, para el diseñador, en es/en/fr; marca el tema activo.
  as('designer');
  for (const locale of ['es', 'en', 'fr']) {
    setLocale(locale);
    const html = render(locale, await load('apps/web/src/app/[locale]/panel/contenido/page.tsx').default({ params: Promise.resolve({ locale }) }));
    assert.ok(html.includes('data-content-section="season"'), locale);
    assert.equal((html.match(/name="site_season"/g) || []).length, 3, locale);
    assert.match(html, /name="site_season" checked="" value="navidad"/, locale);
    const messages = require(`../apps/web/messages/${locale}.json`);
    for (const key of ['title', 'intro', 'current', 'apply', 'applied', 'notReady']) assert.ok(messages.siteSeason[key], `${locale}.${key}`);
    for (const key of ['normal', 'navidad', 'san-valentin']) assert.ok(messages.siteSeason.seasons[key], `${locale}.${key}`);
    assert.ok(messages.panelPages.pages.season && messages.panelPages.pageDescriptions.season);
  }
  void ContentPage;
  // 7. Paletas: solo sitio público y contraste AA.
  for (const name of ['navidad', 'san-valentin']) {
    const light = block(`html[data-season="${name}"]:not(:has(.panel-skin))`);
    const dark = { ...light, ...block(`html.dark[data-season="${name}"]:not(:has(.panel-skin))`) };
    for (const [fg, bg, min] of [['--brand-action-ink', '--brand-action', 4.5], ['--brand-action-ink', '--brand-action-hover', 4.5], ['--brand-action-ink', '--paper-bg', 4.5], ['--brand-action-ink', '--brand-action-surface', 4.5], ['--brand-brown', '--paper-bg', 4.5], ['--brand-action-border', '--paper-bg', 3], ['--brand-dark-accent-ink', '--brand-dark-accent', 4.5]]) {
      assert.ok(ratio(light[fg], light[bg]) >= min, `${name} claro ${fg}/${bg} = ${ratio(light[fg], light[bg]).toFixed(2)}`);
    }
    for (const fg of ['--brand-action', '--brand-dark-accent', '--brand-brown-light']) assert.ok(ratio(dark[fg], dark['--paper-bg']) >= 4.5, `${name} oscuro ${fg} = ${ratio(dark[fg], dark['--paper-bg']).toFixed(2)}`);
  }
  // Piezas públicas: encabezado, pie, títulos y botón principal.
  for (const name of ['navidad', 'san-valentin']) {
    const light = block(`html[data-season="${name}"]:not(:has(.panel-skin))`);
    const all = light; // block() ya junta todos los bloques del mismo selector.
    for (const [fg, bg, min] of [['#39342e', all['--header-bg'], 4.5], ['#625a50', all['--header-bg'], 4.5], [all['--season-footer-text'], all['--season-footer-bg'], 4.5], [all['--season-footer-muted'], all['--season-footer-bg'], 4.5], [all['--season-heading'], all['--paper-bg'], 4.5], [all['--season-heading-dark'], '#24211D', 4.5], [all['--season-button-ink'], all['--season-button'], 4.5], [all['--season-button-ink'], all['--season-button-hover'], 4.5]]) {
      assert.ok(fg && bg && ratio(fg, bg) >= min, `${name} ${fg}/${bg} = ${fg && bg ? ratio(fg, bg).toFixed(2) : 'falta'}`);
    }
  }
  for (const match of css.matchAll(/html(?:\.dark)?\[data-season="[^"]+"\][^{]*\{/g)) assert.ok(match[0].includes(':not(:has(.panel-skin))'), match[0]);
  console.log('OK: tema por temporada — ADMIN/DESIGNER guardan (SQL revalidado), 401/403/400, 409 sin SQL, lectura segura (normal por defecto), data-season en layout, selector es/en/fr, contraste AA claro/oscuro, panel excluido.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
