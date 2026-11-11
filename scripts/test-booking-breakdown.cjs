// T-4738: desglose de precio por reserva — cálculo de comisión (centavos, mitad hacia arriba), validación de
// importes, API (permisos, snapshot no editable, bloqueos fuera) y reservas legacy sin desglose.
// SQLite en memoria: los CHECK >= 0 y numeric(12,2) de PostgreSQL se ensayan con scripts/sql/booking-price-breakdown.sql.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { load, memory, req, mockModule, setSession } = require('./test-property-access.cjs');

// Hooks mínimos para renderizar el formulario cliente sin DOM (mismo patrón que test-cleaning-notice).
const React = req('react');
let hooks = {}, index = 0, locale = 'es';
mockModule('react', { ...React, useState(initial) {
  const slot = index++;
  if (!(slot in hooks)) hooks[slot] = typeof initial === 'function' ? initial() : initial;
  return [hooks[slot], value => { hooks[slot] = typeof value === 'function' ? value(hooks[slot]) : value; }];
} });
mockModule('next-intl', { useLocale: () => locale, useTranslations: namespace => req('next-intl').createTranslator({ locale, namespace,
  messages: JSON.parse(fs.readFileSync('apps/web/messages/' + locale + '.json', 'utf8')), onError: error => { throw error; } }) });
mockModule('@/i18n/navigation', { useRouter: () => ({ refresh() {} }), Link: ({ href, children }) => React.createElement('a', { href }, children) });

const lib = load('apps/web/src/lib/booking-breakdown.ts');
const route = load('apps/web/src/app/api/panel/bookings/[id]/route.ts');
const page = load('apps/web/src/app/[locale]/panel/reservas/[id]/page.tsx').default;
const listPage = load('apps/web/src/app/[locale]/panel/reservas/page.tsx').default;
const { default: Form } = load('apps/web/src/components/panel/BookingBreakdownForm.tsx');

const insert = (row) => memory.prepare(`INSERT INTO "Booking" (${Object.keys(row).map(k => `"${k}"`).join(',')}) VALUES (${Object.keys(row).map(() => '?').join(',')})`).run(...Object.values(row));
insert({ id: 'bk-legacy', propertyId: 'pa', startDate: '2027-02-01', endDate: '2027-02-04', source: 'manual' });
insert({ id: 'bk-ref', propertyId: 'pa', startDate: '2027-03-01', endDate: '2027-03-04', source: 'manual', commissionPercent: '12.50' });
insert({ id: 'bk-b', propertyId: 'pb', startDate: '2027-03-01', endDate: '2027-03-04', source: 'manual' });
insert({ id: 'bk-block', propertyId: 'pa', startDate: '2027-04-01', endDate: '2027-04-04', source: 'host-block' });
const row = id => memory.prepare('SELECT * FROM "Booking" WHERE id = ?').get(id);
const json = body => new Request('http://localhost/api/panel/bookings/x', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
const ctx = id => ({ params: Promise.resolve({ id }) });
const text = node => !node || typeof node !== 'object' ? String(node ?? '') : Array.isArray(node) ? node.map(text).join('') : text(node.props?.children);
const findAll = (node, predicate, out = []) => {
  if (!node || typeof node !== 'object') return out;
  if (Array.isArray(node)) { node.forEach(n => findAll(n, predicate, out)); return out; }
  if (predicate(node)) out.push(node);
  findAll(node.props?.children, predicate, out); return out;
};

(async () => {
  try {
    // 1. Comisión: renta × %, centavos, mitad hacia arriba (calculado a mano).
    const cases = [
      ['1000.00', '10.00', '100.00'],
      ['1234.55', '12.50', '154.32'],   // 154.31875 → .32
      ['100.10', '2.50', '2.50'],       // 2.5025 → 2.50
      ['0.10', '5.00', '0.01'],         // 0.005 → 0.01 (mitad hacia arriba)
      ['0.10', '4.99', '0.00'],         // 0.00499 → 0.00
      ['1500', '0', '0.00'],
      ['8500.00', '100.00', '8500.00'],
      ['9999999999.99', '12.34', '1234000000.00'], // 1,233,999,999.998766 → sube a 1,234,000,000.00 (sin pérdida de precisión)
      ['9999999999.99', '100', '9999999999.99'],
    ];
    for (const [rent, percent, expected] of cases) assert.equal(lib.commissionAmount(rent, percent), expected, `${rent} × ${percent}%`);
    for (const [rent, percent] of [[null, '10'], ['100', null], [undefined, undefined], ['-5', '10'], ['abc', '10'], ['100', '1000']]) {
      assert.equal(lib.commissionAmount(rent, percent), null, `${rent} × ${percent}`);
    }

    // 2. Validación de importes.
    for (const [input, value] of [['0', '0.00'], ['1500', '1500.00'], ['1500.5', '1500.50'], [' 7 ', '7.00'], ['0.99', '0.99'], [250, '250.00'], [12.5, '12.50'],
      ['9999999999.99', '9999999999.99'], ['', null], ['   ', null], [null, null], [undefined, null]]) {
      assert.deepEqual(lib.parseAmount(input), { ok: true, value }, JSON.stringify(input));
    }
    for (const bad of ['-1', '-0.01', '1,500', '1.234', '1e3', 'abc', '12345678901', '.5', '5.', '1 000', '$100', NaN, Infinity, -3, {}, [], true]) {
      assert.deepEqual(lib.parseAmount(bad), { ok: false }, String(bad));
    }
    assert.deepEqual(lib.validateBreakdown({ rentAmount: '100', cleaningCost: '', taxes: '16' }), { ok: true, value: { rentAmount: '100.00', cleaningCost: null, taxes: '16.00' } });
    assert.deepEqual(lib.validateBreakdown({ rentAmount: '-1', taxes: 'x' }), { ok: false, fields: ['rentAmount', 'taxes'] });
    assert.equal(lib.validateBreakdown({ commissionPercent: '50' }).ok, false, 'El % no se edita');
    assert.equal(lib.validateBreakdown(null).ok, false);
    assert.deepEqual(lib.validateBreakdown({ taxes: '16' }), { ok: true, value: { taxes: '16.00' } }, 'Solo lo presente');
    assert.equal(lib.validateBreakdown({}).ok, false);
    assert.equal(lib.breakdownTotal(['1000.00', null, '160.50']), '1160.50');
    assert.equal(lib.breakdownTotal([null, null, null]), null);
    assert.equal(lib.formatMoney('1234567.50', 'es'), '$1,234,567.50 MXN');
    assert.equal(lib.formatMoney('1234567.50', 'en'), '$1,234,567.50 MXN');
    assert.match(lib.formatMoney('1234567.50', 'fr'), /^\$1\s234\s567,50 MXN$/);
    assert.equal(lib.formatMoney(null, 'es'), '—');
    assert.equal(lib.formatMoney('-0.50', 'es'), '-$0.50 MXN', 'Conserva el signo');
    assert.equal(lib.formatMoney('15', 'es'), '$15.00 MXN', 'Sin punto');
    assert.equal(lib.formatMoney('abc', 'es'), '—');

    // 3. API: permisos y alcance.
    for (const [id, status] of [[null, 401], ['client', 403], ['viewer', 403]]) {
      setSession(id ? { user: { id } } : null);
      assert.equal((await route.PATCH(json({ rentAmount: '1' }), ctx('bk-ref'))).status, status);
    }
    setSession({ user: { id: 'b' } });
    assert.equal((await route.PATCH(json({ rentAmount: '1' }), ctx('bk-ref'))).status, 404, 'Colaboradora ajena');
    setSession({ user: { id: 'admin' } });
    assert.equal((await route.PATCH(json({ rentAmount: '1' }), ctx('bk-block'))).status, 404, 'Un bloqueo no es reserva');
    assert.equal((await route.PATCH(json({ rentAmount: '1' }), ctx('missing'))).status, 404);
    for (const body of [{ rentAmount: '-1' }, { taxes: '1,5' }, { cleaningCost: 'abc' }, { commissionPercent: '99' }, { rentAmount: '10', extra: 1 }]) {
      assert.equal((await route.PATCH(json(body), ctx('bk-ref'))).status, 400, JSON.stringify(body));
    }
    assert.deepEqual([row('bk-ref').rentAmount, row('bk-ref').commissionPercent], [null, '12.50'], 'Nada se guardó con datos inválidos');
    let res = await route.PATCH(json({ rentAmount: '1234.55', cleaningCost: '350', taxes: '' }), ctx('bk-ref'));
    assert.equal(res.status, 200); assert.equal(res.headers.get('cache-control'), 'no-store');
    assert.deepEqual([row('bk-ref').rentAmount, row('bk-ref').cleaningCost, row('bk-ref').taxes, row('bk-ref').commissionPercent], ['1234.55', '350.00', null, '12.50']);
    setSession({ user: { id: 'a' } });
    assert.equal((await route.PATCH(json({ taxes: '197.53' }), ctx('bk-ref'))).status, 200, 'Dueña de la propiedad');
    assert.equal(row('bk-ref').taxes, '197.53');
    assert.equal(row('bk-ref').rentAmount, '1234.55', 'PATCH parcial no vacía lo omitido');
    assert.equal((await route.PATCH(json({}), ctx('bk-ref'))).status, 400, 'Cuerpo vacío');
    assert.equal((await route.PATCH(json({ cleaningCost: '' }), ctx('bk-ref'))).status, 200);
    assert.equal(row('bk-ref').cleaningCost, null, 'Vacío explícito borra el dato');
    setSession({ user: { id: 'admin' } });
    await route.PATCH(json({ rentAmount: '1234.55', cleaningCost: '350', taxes: '197.53' }), ctx('bk-ref'));

    // 4. Vista privada: comisión derivada visible, legacy vacío, 404 fuera de alcance.
    for (const lang of ['es', 'en', 'fr']) {
      const tree = await page({ params: Promise.resolve({ locale: lang, id: 'bk-ref' }) });
      const [form] = findAll(tree, node => node.type === Form);
      assert.deepEqual(form.props.initial, { rentAmount: '1234.55', cleaningCost: '350.00', taxes: '197.53' });
      assert.equal(form.props.commissionPercent, '12.50');
      locale = lang; hooks = {}; index = 0;
      const rendered = Form(form.props);
      const [commission] = findAll(rendered, node => node.props?.['data-testid'] === 'commission');
      assert.equal(text(commission), lib.formatMoney('154.32', lang), `Comisión mostrada (${lang})`);
      assert.ok(text(rendered).includes(lib.formatMoney('1782.08', lang)), `Total renta+aseo+impuestos (${lang})`);
      const inputs = findAll(rendered, node => node.type === 'input');
      assert.deepEqual(inputs.map(input => input.props.name), ['rentAmount', 'cleaningCost', 'taxes'], 'El % no es un input');
    }
    locale = 'es';
    const legacyTree = await page({ params: Promise.resolve({ locale: 'es', id: 'bk-legacy' }) });
    assert.ok(text(legacyTree).includes('aún no tiene desglose'), 'Aviso legacy');
    const [legacyForm] = findAll(legacyTree, node => node.type === Form);
    assert.deepEqual(legacyForm.props.initial, { rentAmount: null, cleaningCost: null, taxes: null });
    assert.equal(legacyForm.props.commissionPercent, null);
    hooks = {}; index = 0;
    const legacyRendered = Form(legacyForm.props);
    assert.deepEqual(findAll(legacyRendered, node => node.type === 'input').map(input => input.props.value), ['', '', ''], 'Legacy sin magia retroactiva');
    assert.deepEqual([row('bk-legacy').rentAmount, row('bk-legacy').cleaningCost, row('bk-legacy').taxes], [null, null, null]);
    for (const [user, id] of [['b', 'bk-ref'], ['admin', 'bk-block'], ['admin', 'missing']]) {
      setSession({ user: { id: user } });
      await assert.rejects(() => page({ params: Promise.resolve({ locale: 'es', id }) }), e => e.status === 404, `${user} ${id}`);
    }

    // 4b. Lista /panel/reservas (en el menú de ADMIN y colaborador): sin bloqueos, alcance por rol, comisión derivada.
    const rowIds = tree => findAll(tree, node => node.type === 'tr').map(tr => tr.key).filter(Boolean);
    setSession({ user: { id: 'admin' } });
    let list = await listPage({ params: Promise.resolve({ locale: 'es' }) });
    assert.ok(rowIds(list).includes('bk-ref') && rowIds(list).includes('bk-b') && !rowIds(list).includes('bk-block'), 'ADMIN: todas menos bloqueos');
    assert.ok(text(list).includes(lib.formatMoney('154.32', 'es')), 'Comisión en la lista');
    assert.ok(findAll(list, node => node.props?.href === '/panel/reservas/bk-ref').length, 'Enlace al desglose');
    setSession({ user: { id: 'a' } });
    list = await listPage({ params: Promise.resolve({ locale: 'es' }) });
    assert.ok(rowIds(list).includes('bk-ref') && !rowIds(list).includes('bk-b'), 'Colaboradora: solo sus propiedades');
    setSession({ user: { id: 'client' } });
    await assert.rejects(() => listPage({ params: Promise.resolve({ locale: 'es' }) }), e => /redirect: \/es/.test(e.message), 'Cliente: fuera');
    assert.match(fs.readFileSync('apps/web/src/app/[locale]/panel/layout.tsx', 'utf8'), /<Link href="\/panel\/reservas"/, 'En el menú');
    setSession({ user: { id: 'admin' } });

    // 6. Renta automática: misma regla que el formulario público (MessageForm) y IVA 16 % por defecto.
    const { quoteStay } = load('apps/web/src/lib/stay-quote.ts');
    // Regla ANTERIOR de MessageForm, copiada tal cual, para probar que la extracción no cambia ningún precio.
    function legacyQuote(startStr, endStr, pricing) {
      const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const addDays = (d, n) => { const c = new Date(d); c.setDate(c.getDate() + n); return c; };
      const start = new Date(startStr + 'T12:00:00'), end = new Date(endStr + 'T12:00:00');
      if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) return null;
      let total = 0, noches = 0, sinPrecio = false, choque = false;
      for (let d = new Date(start); d < end; d = addDays(d, 1)) {
        noches++; const day = d.getDay(), esFinde = day === 0 || day === 6, hoy = iso(d);
        if (pricing.booked.some(b => hoy >= b.start && hoy < b.end)) choque = true;
        const season = pricing.seasons.filter(s => hoy >= s.start && hoy <= s.end).sort((a, b) => b.priority - a.priority)[0];
        const precio = season ? (esFinde ? season.weekend : season.weekday) : (esFinde ? pricing.base.weekend : pricing.base.weekday);
        if (precio == null) sinPrecio = true; else total += precio;
      }
      return { total: sinPrecio ? null : total, noches, choque };
    }
    let seed = 7; const rand = n => (seed = (seed * 1103515245 + 12345) % 2147483648) % n;
    const dayAt = offset => new Date(Date.UTC(2027, 0, 1) + offset * 86_400_000).toISOString().slice(0, 10);
    for (let i = 0; i < 400; i++) {
      const pricing = { base: { weekday: rand(5) ? 800 + rand(500) : null, weekend: rand(5) ? 1200 + rand(500) : null },
        seasons: Array.from({ length: rand(4) }, () => { const s = rand(400); return { start: dayAt(s), end: dayAt(s + rand(30)), weekday: 900 + rand(900), weekend: 1300 + rand(900), priority: rand(3) }; }),
        booked: rand(2) ? [{ start: dayAt(rand(400)), end: dayAt(rand(400) + 3) }] : [] };
      const s = rand(420), e = s + rand(20) - 2;
      const a = quoteStay(dayAt(s), dayAt(e), pricing), b = legacyQuote(dayAt(s), dayAt(e), pricing);
      assert.deepEqual(a && { total: a.total, noches: a.nights, choque: a.overlap }, b, `cotización ${i}: ${dayAt(s)} → ${dayAt(e)}`);
    }
    const base = { base: { weekday: 1000, weekend: 1500 }, seasons: [] };
    // 2027-03-05 es viernes: noches vie (entre semana) + sáb + dom (fin de semana); el lunes de salida no se cobra.
    assert.deepEqual(quoteStay('2027-03-05', '2027-03-08', base), { total: 4000, nights: 3, overlap: false });
    const seasons = { base: { weekday: 1000, weekend: 1500 }, seasons: [
      { start: '2027-03-06', end: '2027-03-06', weekday: 2000, weekend: 2500, priority: 0 },
      { start: '2027-03-01', end: '2027-03-31', weekday: 1100, weekend: 1600, priority: 1 }] };
    assert.equal(quoteStay('2027-03-05', '2027-03-08', seasons).total, 1100 + 1600 + 1600, 'Gana la temporada de mayor prioridad');
    assert.equal(quoteStay('2027-03-05', '2027-03-08', { base: { weekday: 1000, weekend: null }, seasons: [] }).total, null, 'Sin precio no se inventa');
    assert.equal(quoteStay('2027-03-08', '2027-03-05', base), null);
    assert.equal(lib.rentFromQuote(4000), '4000.00'); assert.equal(lib.rentFromQuote(null), null); assert.equal(lib.rentFromQuote(-1), null); assert.equal(lib.rentFromQuote(1.5), null);
    assert.equal(lib.DEFAULT_TAX_PERCENT, '16.00');
    assert.equal(lib.suggestedTaxes('4000.00', null), '640.00');
    assert.equal(lib.suggestedTaxes('1234.55', '350.00'), '253.53', '16 % de 1,584.55 = 253.528 → 253.53');
    assert.equal(lib.suggestedTaxes(null, '100'), '16.00');
    assert.equal(lib.suggestedTaxes(null, null), null);
    assert.equal(lib.percentOf('0.03', '16'), '0.00'); assert.equal(lib.percentOf('0.04', '16'), '0.01', '0.0064 → 0.01 (mitad hacia arriba al centavo)');

    // Al confirmar desde la consulta se guardan renta cotizada + IVA 16 %; sin tarifas, vacío; nunca rompe la reserva.
    const create = load('apps/web/src/app/api/bookings/create/route.ts');
    memory.prepare('UPDATE "Property" SET "baseWeekdayPrice" = 1000, "baseWeekendPrice" = 1500 WHERE id = ?').run('pa');
    setSession({ user: { id: 'admin' } });
    const confirm = (propertyId, startDate, endDate) => create.POST(new Request('http://localhost/api/bookings/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ propertyId, startDate, endDate }) }));
    assert.equal((await confirm('pa', '2027-03-05', '2027-03-08')).status, 200);
    const auto = memory.prepare('SELECT * FROM "Booking" WHERE "propertyId" = ? AND "startDate" = ?').get('pa', '2027-03-05');
    assert.deepEqual([auto.rentAmount, auto.taxes, auto.cleaningCost], ['4000.00', '640.00', null], 'Renta de la tarifa + IVA 16 %');
    assert.equal((await confirm('pb', '2027-05-05', '2027-05-08')).status, 200, 'Sin tarifa la reserva se crea igual');
    const noRate = memory.prepare('SELECT * FROM "Booking" WHERE "propertyId" = ? AND "startDate" = ?').get('pb', '2027-05-05');
    assert.deepEqual([noRate.rentAmount, noRate.taxes], [null, null]);

    // Formulario: renta precargada (sin guardar) en una reserva sin desglose; IVA automático en vivo; ambos editables.
    const legacyPage = await page({ params: Promise.resolve({ locale: 'es', id: 'bk-legacy' }) });
    const [prefill] = findAll(legacyPage, node => node.type === Form);
    assert.equal(prefill.props.suggestedRent, '3000.00', '2027-02-01 (lun) → 02-04: lun+mar+mié a 1,000');
    hooks = {}; index = 0; locale = 'es';
    const render = () => { index = 0; return Form(prefill.props); };
    const input = (tree, name) => findAll(tree, node => node.type === 'input' && node.props.name === name)[0];
    let view = render();
    assert.equal(input(view, 'rentAmount').props.value, '3000.00', 'Renta precargada');
    assert.equal(input(view, 'taxes').props.value, '480.00', 'IVA 16 % automático');
    assert.ok(text(view).includes('Renta precargada'), 'Aviso de precarga');
    assert.equal(row('bk-legacy').rentAmount, null, 'La precarga no se guarda sola');
    input(view, 'cleaningCost').props.onChange({ target: { value: '500' } });
    view = render();
    assert.equal(input(view, 'taxes').props.value, '560.00', 'IVA recalculado: 16 % de 3,500');
    input(view, 'taxes').props.onChange({ target: { value: '700' } });
    view = render();
    assert.equal(input(view, 'taxes').props.value, '700', 'Impuesto editable (manual)');
    input(view, 'cleaningCost').props.onChange({ target: { value: '600' } });
    view = render();
    assert.equal(input(view, 'taxes').props.value, '700', 'En manual no se recalcula');
    const [recalc] = findAll(view, node => node.type === 'button' && text(node).includes('Calcular 16 %'));
    recalc.props.onClick();
    view = render();
    assert.equal(input(view, 'taxes').props.value, '576.00', 'De vuelta a automático: 16 % de 3,600');
    input(view, 'rentAmount').props.onChange({ target: { value: '4200' } });
    view = render();
    assert.equal(input(view, 'rentAmount').props.value, '4200', 'Renta editable');
    const [useRate] = findAll(view, node => node.type === 'button' && text(node).includes('Usar tarifa de la propiedad'));
    assert.ok(text(useRate).includes(lib.formatMoney('3000.00', 'es')));
    useRate.props.onClick();
    view = render();
    assert.equal(input(view, 'rentAmount').props.value, '3000.00', 'Volver a la tarifa');
    // Reserva con impuesto guardado distinto al 16 %: se respeta (manual).
    hooks = {}; index = 0;
    const manual = Form({ id: 'x', commissionPercent: null, suggestedRent: '4500.00', initial: { rentAmount: '1234.55', cleaningCost: '350.00', taxes: '197.53' } });
    assert.equal(input(manual, 'rentAmount').props.value, '1234.55', 'Lo guardado manda sobre la tarifa');
    assert.equal(input(manual, 'taxes').props.value, '197.53', 'Impuesto guardado se respeta');
    memory.prepare('UPDATE "Property" SET "baseWeekdayPrice" = NULL, "baseWeekendPrice" = NULL WHERE id = ?').run('pa');

    // 5. Nada público: las lecturas públicas de Booking siguen con columnas explícitas sin el desglose.
    for (const file of ['apps/web/src/app/[locale]/casas/[slug]/page.tsx', 'apps/web/src/app/[locale]/mi-cuenta/page.tsx', 'apps/web/src/app/api/messages/route.ts']) {
      const source = fs.readFileSync(file, 'utf8');
      assert.ok(!/rentAmount|cleaningCost|taxes|commissionPercent/.test(source), file);
      assert.ok(!/select\(\)\s*\.from\(bookings\)/.test(source), `${file}: sin select() de Booking`);
    }
    // Enlaces a la vista desde consultas y calendario, sin bloqueos.
    assert.match(fs.readFileSync('apps/web/src/app/[locale]/panel/consultas/page.tsx', 'utf8'), /reservation\.source !== 'host-block' && .*\/panel\/reservas\//);
    assert.match(fs.readFileSync('apps/web/src/components/CalendarBoard.tsx', 'utf8'), /isCleaningNoticeBooking\(b\)&&b\.id\)\.map\(b=>\s*<a key=\{'detail-'/);
    const es = Object.keys(JSON.parse(fs.readFileSync('apps/web/messages/es.json', 'utf8')).bookingDetail).sort();
    for (const lang of ['en', 'fr']) assert.deepEqual(Object.keys(JSON.parse(fs.readFileSync(`apps/web/messages/${lang}.json`, 'utf8')).bookingDetail).sort(), es, lang);
    console.log('OK desglose de reserva: comisión a centavos, validación ≥ 0, permisos, legacy vacío, nada público.');
  } catch (error) { console.error(error); process.exit(1); }
})();
