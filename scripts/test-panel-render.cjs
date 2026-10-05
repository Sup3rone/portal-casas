// Render SSR de las páginas reales en los tres idiomas y sus controles de acceso.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { load, memory, req, setSession, setLocale } = require('./test-property-access.cjs');
const React = req('react');
const { renderToStaticMarkup } = req('react-dom/server');
const { NextIntlClientProvider, createTranslator } = req('next-intl');
const layout = load('apps/web/src/app/[locale]/panel/layout.tsx').default;
const list = load('apps/web/src/app/[locale]/panel/page.tsx').default;
const create = load('apps/web/src/app/[locale]/panel/nueva/page.tsx').default;
const edit = load('apps/web/src/app/[locale]/panel/propiedades/[id]/page.tsx').default;
const inquiries = load('apps/web/src/app/[locale]/panel/consultas/page.tsx').default;
memory.prepare('UPDATE "Property" SET titleEs = id, titleEn = id, titleFr = id').run();
memory.prepare('UPDATE "Message" SET "createdAt" = ?, name = ?, email = ?, body = ?').run('2026-10-05 12:00:00', 'Guest', 'guest@test.invalid', 'Inquiry');
async function main() {
  for (const locale of ['es', 'en', 'fr']) {
    setLocale(locale); setSession({ user: { id: 'a' } });
    const messages = JSON.parse(fs.readFileSync(path.join(__dirname, '../apps/web/messages/' + locale + '.json'), 'utf8'));
    const t = createTranslator({ locale, messages, namespace: 'panel', onError(error) { throw error; } });
    const params = Promise.resolve({ locale });
    const render = value => renderToStaticMarkup(React.createElement(NextIntlClientProvider, { locale, messages, timeZone: 'America/Mexico_City', onError(error) { throw error; } }, value));
    const listed = render(await layout({ params, children: await list({ params }) }));
    assert.ok(listed.includes(t('properties'))); assert.ok(listed.includes('pa')); assert.ok(!listed.includes('/propiedades/pb'));
    const newForm = render(await create({ params }));
    for (const name of ['titleEs', 'titleEn', 'titleFr', 'descEs', 'descEn', 'descFr', 'address', 'city', 'maxGuests', 'bedrooms', 'bathrooms', 'lat', 'lng', 'baseWeekdayPrice', 'baseWeekendPrice']) assert.ok(newForm.includes(`name="${name}"`));
    assert.ok(newForm.includes(t('approvalHint')));
    const edited = render(await edit({ params: Promise.resolve({ locale, id: 'pa' }) }));
    for (const key of ['rates', 'availability', 'photos', 'blockHint', 'save']) assert.ok(edited.includes(t(key)));
    await assert.rejects(() => edit({ params: Promise.resolve({ locale, id: 'pb' }) }), error => error.status === 404);
    const queries = render(await inquiries({ params }));
    assert.ok(queries.includes(t('messages'))); assert.ok(queries.includes('Inquiry')); assert.ok(!queries.includes('pb'));
    setSession({ user: { id: 'client' } });
    await assert.rejects(() => layout({ params, children: null }), error => error.message === `redirect: /${locale}`);
    setSession(null);
    await assert.rejects(() => create({ params }), error => error.message === `redirect: /${locale}`);
    setSession({ user: { id: 'admin' } });
    const admin = render(await list({ params }));
    assert.ok(admin.includes(t('approve'))); assert.ok(admin.includes('/propiedades/pb'));
    console.log(locale + ': listado/formulario/calendario/consultas, acceso propio/ajeno, redirecciones y aprobación admin OK');
  }
  memory.close();
}
main().catch(error => { console.error(error); process.exitCode = 1; });
