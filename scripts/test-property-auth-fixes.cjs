// Componentes, acciones y rutas reales; transporte/sesión simulados y SQL en memoria.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { load, req, memory, portal, mockModule, setLocale, setSession } = require('./test-property-access.cjs');
const React = req('react');
const { renderToStaticMarkup } = req('react-dom/server');
let locale = 'es', authFailure = false;
const signedIn = [];
class AuthError extends Error {}
// SQLite no admite DEFAULT en VALUES como PostgreSQL: adaptar únicamente el INSERT de User.
mockModule('@portal/db', { ...portal, db: new Proxy(portal.db, { get(target, key) {
  if (key === 'insert') return table => table === portal.users ? { values: async values => {
    memory.prepare('INSERT INTO "User" (id,email,name,phone,passwordHash,role) VALUES (?,?,?,?,?,?)')
      .run(crypto.randomUUID(), values.email, values.name, values.phone, values.passwordHash, values.role);
  } } : target.insert(table);
  return Reflect.get(target, key);
} }) });
mockModule('next-auth', { AuthError });
mockModule('@/lib/auth', {
  auth: async () => ({ user: { id: 'a' } }),
  signIn: async (provider, options) => { if (authFailure) throw new AuthError(); signedIn.push(options); }
});
mockModule('react', { ...React, useState: value => [value, () => {}] });
const messages = code => JSON.parse(fs.readFileSync(path.join(__dirname, '../apps/web/messages', code + '.json'), 'utf8'));
mockModule('next-intl', { ...req('next-intl'), useTranslations: namespace => req('next-intl').createTranslator({ locale, messages: messages(locale), namespace, onError(error) { throw error; } }) });
const PropertyForm = load('apps/web/src/components/panel/PropertyForm.tsx').default;
const AuthForm = load('apps/web/src/components/AuthForm.tsx').default;
const Login = load('apps/web/src/app/[locale]/login/page.tsx').default;
const Register = load('apps/web/src/app/[locale]/registro/page.tsx').default;
const loginAction = load('apps/web/src/app/[locale]/login/actions.ts').loginAction;
const registerAction = load('apps/web/src/app/[locale]/registro/actions.ts').registerAction;
const collection = load('apps/web/src/app/api/properties/route.ts');
const propertyRoute = load('apps/web/src/app/api/properties/[id]/route.ts');
const { managedProperty } = load('apps/web/src/lib/panel-server.ts');
function find(node, predicate) {
  if (!node || typeof node !== 'object') return;
  if (predicate(node)) return node;
  for (const child of [node.props?.children].flat(Infinity)) { const found = find(child, predicate); if (found) return found; }
}
const nativeFormData = global.FormData, nativeFetch = global.fetch, nativeInput = global.HTMLInputElement;
global.FormData = class extends nativeFormData {
  constructor(form) { super(); if (form) for (const [key, value] of Object.entries(form)) this.set(key, value); }
};
const requests = [];
global.fetch = async (url, options) => {
  requests.push({ url, body: JSON.parse(options.body) });
  const request = new Request('http://localhost' + url, options);
  return url === '/api/properties' ? collection.POST(request) : propertyRoute.PATCH(request, { params: Promise.resolve({ id: url.split('/').at(-1) }) });
};
async function main() {
  setSession({ user: { id: 'a' } });
  const values = { titleEs: 'Prueba', titleEn: 'Test', titleFr: 'Test', descEs: 'Texto', descEn: 'Text', descFr: 'Texte', address: 'Address', city: 'City', maxGuests: '7', bedrooms: '3', bathrooms: '2.5', lat: '', lng: '', baseWeekdayPrice: '100', baseWeekendPrice: '200', rentalType: 'anual', contactName: 'Emma', whatsapp: '5215512345678' };
  await PropertyForm({}).props.onSubmit({ preventDefault() {}, currentTarget: values });
  const created = memory.prepare('SELECT * FROM "Property" WHERE titleEs = ?').get('Prueba');
  assert.ok(created);
  assert.deepEqual([created.maxGuests, created.bathrooms, created.bedrooms], [7, 2.5, 3]);
  assert.deepEqual([created.rentalType, created.contactName, created.whatsapp], ['anual', 'Emma', '5215512345678']);
  const before = PropertyForm({ property: created });
  await before.props.onSubmit({ preventDefault() {}, currentTarget: { ...values, maxGuests: '9', bathrooms: '4.5', bedrooms: '4' } });
  const refreshed = await managedProperty(created.id, { id: 'a', role: 'COLLABORATOR' });
  assert.deepEqual([refreshed.maxGuests, refreshed.bathrooms, refreshed.bedrooms], [9, 4.5, 4]);
  assert.deepEqual([refreshed.rentalType, refreshed.contactName, refreshed.whatsapp], ['anual', 'Emma', '5215512345678']);
  const after = PropertyForm({ property: refreshed });
  for (const name of ['maxGuests', 'bathrooms', 'bedrooms']) {
    const oldInput = find(before, node => node.props?.name === name);
    const newInput = find(after, node => node.props?.name === name);
    assert.notEqual(oldInput.key, newInput.key, 'El valor refrescado debe reemplazar el input anterior.');
    assert.equal(newInput.props.defaultValue, refreshed[name]);
    assert.equal(requests[1].body[name], refreshed[name]);
  }
  assert.equal(requests[0].url, '/api/properties');
  assert.equal(requests[1].url, '/api/properties/' + created.id);
  for (locale of ['es', 'en', 'fr']) {
    setLocale(locale);
    const t = req('next-intl').createTranslator({ locale, messages: messages(locale), namespace: 'auth' });
    const params = Promise.resolve({ locale });
    const login = renderToStaticMarkup(await Login({ params, searchParams: Promise.resolve({ error: '1' }) }));
    const registration = await Register({ params, searchParams: Promise.resolve({ error: 'duplicado' }) });
    const html = renderToStaticMarkup(registration);
    for (const key of ['loginTitle', 'invalidCredentials', 'password']) assert.ok(login.includes(t(key)));
    for (const key of ['registerTitle', 'duplicateEmail']) assert.ok(html.includes(t(key)));
    assert.ok(html.includes(`name="locale" value="${locale}"`));
    const invalid = renderToStaticMarkup(await Register({ params, searchParams: Promise.resolve({ error: 'campos' }) }));
    assert.ok(invalid.includes(t('invalidRegistration')));
    const form = new FormData({ locale, name: 'Test', email: `${locale}@test.invalid`, password: 'short' });
    await assert.rejects(() => registerAction(form), error => error.message === `redirect: /${locale}/registro?error=campos`);
    form.set('email', 'a@test.invalid'); form.set('password', 'long-enough');
    await assert.rejects(() => registerAction(form), error => error.message === `redirect: /${locale}/registro?error=duplicado`);
    form.set('email', `${locale}@test.invalid`);
    await registerAction(form);
    assert.equal(signedIn.at(-1).redirectTo, `/${locale}/mi-cuenta`);
    authFailure = true;
    await assert.rejects(() => loginAction(form), error => error.message === `redirect: /${locale}/login?error=1`);
    authFailure = false;
    await loginAction(form);
    assert.equal(signedIn.at(-1).redirectTo, `/${locale}/mi-cuenta`);
    class Input { constructor(validity) { this.validity = validity; } setCustomValidity(text) { this.message = text; } }
    global.HTMLInputElement = Input;
    const handlers = AuthForm({ action: loginAction, children: null }).props;
    for (const [flag, key] of [['valueMissing', 'requiredField'], ['typeMismatch', 'invalidEmail'], ['tooShort', 'invalidRegistration']]) {
      const input = new Input({ [flag]: true });
      handlers.onInvalidCapture({ target: input }); assert.equal(input.message, t(key));
      handlers.onInput({ target: input }); assert.equal(input.message, '');
    }
  }
  console.log('OK: payload POST/PATCH, persistencia/relectura numérica y auth/validación es/en/fr sin Neon.');
}
main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => {
  global.FormData = nativeFormData; global.fetch = nativeFetch; global.HTMLInputElement = nativeInput; memory.close();
});
