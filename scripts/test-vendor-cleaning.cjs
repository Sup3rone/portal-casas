// T-5206 (app del vendedor, Task 2): precio de limpieza opcional por casa (MXN, entero >= 0; vacío = por confirmar).
// Offline: validación, API real de la casa, desglose inicial de la reserva y formulario del panel sobre SQLite en memoria.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { load, memory, req, mockModule, setSession } = require('./test-property-access.cjs');
const React = req('react');
mockModule('react', { ...React, useState: value => [value, () => {}], useContext: () => null });
const messages = JSON.parse(fs.readFileSync(path.join(__dirname, '../apps/web/messages/es.json'), 'utf8'));
mockModule('next-intl', { ...req('next-intl'), useTranslations: namespace => req('next-intl').createTranslator({ locale: 'es', messages, namespace, onError(error) { throw error; } }) });
const { propertyInput } = load('apps/web/src/lib/panel-validation.ts');
const { initialBreakdown } = load('apps/web/src/lib/booking-quote.ts');
const { suggestedTaxes } = load('apps/web/src/lib/booking-breakdown.ts');
const propertyRoute = load('apps/web/src/app/api/properties/[id]/route.ts');
const PropertyForm = load('apps/web/src/components/panel/PropertyForm.tsx').default;

const json = body => new Request('http://localhost/test', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
const ctx = id => ({ params: Promise.resolve({ id }) });
const stored = id => memory.prepare('SELECT "cleaningPrice" v FROM "Property" WHERE id = ?').get(id).v;
function find(node, predicate) {
  if (!node || typeof node !== 'object') return;
  if (predicate(node)) return node;
  for (const child of [node.props?.children].flat(Infinity)) { const found = find(child, predicate); if (found) return found; }
}

async function main() {
  // 1) Validación: entero >= 0 o null; nada de negativos, decimales ni texto.
  assert.deepEqual(propertyInput({ cleaningPrice: 800 }), { cleaningPrice: 800 });
  assert.deepEqual(propertyInput({ cleaningPrice: 0 }), { cleaningPrice: 0 });
  assert.deepEqual(propertyInput({ cleaningPrice: null }), { cleaningPrice: null });
  for (const bad of [-1, 1.5, '800', 3_000_000_000]) assert.throws(() => propertyInput({ cleaningPrice: bad }), undefined, String(bad));

  // 2) API de la casa: el dueño la guarda y la vacía; inválida → 400 y no cambia.
  setSession({ user: { id: 'a' } });
  assert.equal((await propertyRoute.PATCH(json({ cleaningPrice: 800 }), ctx('pa'))).status, 200);
  assert.equal(stored('pa'), 800);
  assert.equal((await propertyRoute.PATCH(json({ cleaningPrice: -1 }), ctx('pa'))).status, 400);
  assert.equal(stored('pa'), 800, 'un valor inválido no pisa el guardado');
  assert.equal((await propertyRoute.PATCH(json({ cleaningPrice: null }), ctx('pa'))).status, 200);
  assert.equal(stored('pa'), null);
  // Un COLLABORATOR no toca la limpieza de una casa ajena.
  assert.equal((await propertyRoute.PATCH(json({ cleaningPrice: 1 }), ctx('pb'))).status, 404);
  assert.equal(stored('pb'), null);

  // 3) Desglose inicial al confirmar: limpieza de la casa e IVA 16 % sobre renta + aseo (regla vigente, 10-11-2026).
  memory.prepare('DELETE FROM "SeasonRate"').run();
  memory.prepare('UPDATE "Property" SET "baseWeekdayPrice" = 1000, "baseWeekendPrice" = 1000, "cleaningPrice" = 800 WHERE id = ?').run('pa');
  const withCleaning = await initialBreakdown('pa', '2026-12-18', '2026-12-22');
  assert.deepEqual(withCleaning, { rentAmount: '4000.00', cleaningCost: '800.00', taxes: '768.00' });
  assert.equal(withCleaning.taxes, suggestedTaxes('4000.00', '800.00'), 'misma regla que el formulario de la reserva');
  memory.prepare('UPDATE "Property" SET "cleaningPrice" = NULL WHERE id = ?').run('pa');
  assert.deepEqual(await initialBreakdown('pa', '2026-12-18', '2026-12-22'), { rentAmount: '4000.00', cleaningCost: null, taxes: '640.00' });
  memory.prepare('UPDATE "Property" SET "cleaningPrice" = 0 WHERE id = ?').run('pa');
  assert.deepEqual(await initialBreakdown('pa', '2026-12-18', '2026-12-22'), { rentAmount: '4000.00', cleaningCost: '0.00', taxes: '640.00' }, 'limpieza 0 es «gratis», no «por confirmar»');

  // 4) Formulario del panel: campo opcional «Limpieza (MXN)», mínimo 0, entero; vacío → null.
  const property = { ...memory.prepare('SELECT * FROM "Property" WHERE id = ?').get('pa'), cleaningPrice: 650 };
  const form = PropertyForm({ property });
  const input = find(form, node => node.props?.name === 'cleaningPrice');
  assert.ok(input, 'el formulario tiene el campo de limpieza');
  assert.equal(input.props.type, 'number');
  assert.equal(input.props.min, 0);
  assert.equal(input.props.step, 1);
  assert.equal(input.props.required, false);
  assert.equal(input.props.defaultValue, 650);
  assert.ok(JSON.stringify(form).includes(messages.panel.fields.cleaningPrice));
  const sent = [];
  const nativeFetch = global.fetch, nativeFormData = global.FormData;
  global.FormData = class extends nativeFormData { constructor(values) { super(); if (values) for (const [key, value] of Object.entries(values)) this.set(key, value); } };
  global.fetch = async (url, options) => { sent.push(JSON.parse(options.body)); return new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } }); };
  const values = { titleEs: 'A', titleEn: 'A', titleFr: 'A', descEs: 'D', descEn: 'D', descFr: 'D', address: 'X', maxGuests: '4', bedrooms: '2', bathrooms: '1', lat: '', lng: '', baseWeekdayPrice: '1000', baseWeekendPrice: '1000', rentalType: 'nocturna' };
  try {
    await form.props.onSubmit({ preventDefault() {}, currentTarget: { ...values, cleaningPrice: '' } });
    await form.props.onSubmit({ preventDefault() {}, currentTarget: { ...values, cleaningPrice: '650' } });
  } finally { global.fetch = nativeFetch; global.FormData = nativeFormData; }
  assert.equal(sent[0].cleaningPrice, null, 'vacío = por confirmar');
  assert.equal(sent[1].cleaningPrice, 650);
  console.log('limpieza por casa: validación, API, desglose inicial (IVA renta + aseo) y formulario OK');
  memory.close();
}
main().catch(error => { console.error(error); process.exitCode = 1; });
