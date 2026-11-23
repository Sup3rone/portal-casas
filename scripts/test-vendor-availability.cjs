// T-5200 (app del vendedor, Task 1): casas gestionadas libres en [start,end) con su total cotizado.
// Offline: SQL real de Drizzle sobre SQLite en memoria (arnés de test-property-access.cjs). Sin red ni Neon.
const assert = require('node:assert/strict');
const { load, memory, queryLog } = require('./test-property-access.cjs');
const { availableForVendor } = load('apps/web/src/lib/vendor-availability.ts');

const insert = (table, row) => memory.prepare(`INSERT INTO "${table}" (${Object.keys(row).map(k => `"${k}"`).join(',')}) VALUES (${Object.keys(row).map(() => '?').join(',')})`).run(...Object.values(row));
const admin = { id: 'admin', role: 'ADMIN', canPublishProperties: true };
const ownerA = { id: 'a', role: 'COLLABORATOR', canPublishProperties: false };
const ids = cards => cards.map(card => card.id).sort();
const window = { start: '2026-12-18', end: '2026-12-22' }; // vie, sáb, dom, lun

async function main() {
  for (const table of ['Booking', 'BlockDate', 'SeasonRate', 'Media', 'Message', 'IcalFeed', 'Property']) memory.prepare(`DELETE FROM "${table}"`).run();
  const property = (id, values = {}) => insert('Property', {
    id, slug: id, titleEs: `Casa ${id}`, titleEn: `House ${id}`, titleFr: `Maison ${id}`, ownerId: 'a', published: 1,
    rentalType: 'nocturna', maxGuests: 6, bedrooms: 3, bathrooms: 2.5, baseWeekdayPrice: 1000, baseWeekendPrice: 1500, ...values,
  });
  property('free');
  property('booked');
  property('blocked');
  property('draft', { published: 0 });
  property('foreign', { ownerId: 'b', state: 'Quintana Roo', destinationCity: 'Tulum' });
  property('annual', { rentalType: 'anual' });
  property('both', { rentalType: 'ambas' });
  property('small', { maxGuests: 2 });
  property('noprice', { baseWeekdayPrice: null, baseWeekendPrice: null });
  // Salida el mismo día que la otra llegada: la reserva de 'free' empieza el 22, el día que sale la búsqueda.
  insert('Booking', { id: 'b-free', propertyId: 'free', startDate: '2026-12-22', endDate: '2026-12-25' });
  // Y otra que termina justo el día que llega la búsqueda (su noche de salida no ocupa).
  insert('Booking', { id: 'b-free-before', propertyId: 'free', startDate: '2026-12-15', endDate: '2026-12-18' });
  insert('Booking', { id: 'b-booked', propertyId: 'booked', startDate: '2026-12-21', endDate: '2026-12-23' });
  insert('BlockDate', { id: 'k-blocked', propertyId: 'blocked', startDate: '2026-12-21', endDate: '2026-12-23' });
  // Temporada solo de 'foreign' (sáb 19 y dom 20): no debe filtrarse a otras casas.
  insert('SeasonRate', { id: 's-foreign', propertyId: 'foreign', name: 'Navidad', startDate: '2026-12-19', endDate: '2026-12-20', weekdayPrice: 2000, weekendPrice: 3000, priority: 1 });
  insert('Media', { id: 'm-free-2', propertyId: 'free', url: 'https://x.public.blob.vercel-storage.com/2.jpg', type: 'PHOTO', order: 2, isCover: 0 });
  insert('Media', { id: 'm-free-1', propertyId: 'free', url: 'https://x.public.blob.vercel-storage.com/1.jpg', type: 'PHOTO', order: 1, isCover: 0 });
  insert('Media', { id: 'm-free-cover', propertyId: 'free', url: 'https://x.public.blob.vercel-storage.com/cover.jpg', type: 'PHOTO', order: 5, isCover: 1, coverOrder: 0 });

  // ADMIN: todas las gestionables libres, incluida la no publicada; fuera traslapes, anuales.
  const before = queryLog.length;
  const all = await availableForVendor(window, admin);
  const queries = queryLog.length - before;
  assert.deepEqual(ids(all), ['both', 'draft', 'foreign', 'free', 'noprice', 'small']);
  // Sin N+1: casas+portada en una consulta y temporadas de todas en otra.
  assert.ok(queries <= 2, `se esperaban <= 2 consultas, hubo ${queries}`);

  const free = all.find(card => card.id === 'free');
  assert.deepEqual(free, {
    id: 'free', slug: 'free', title: 'Casa free', bedrooms: 3, bathrooms: 2.5, maxGuests: 6, published: true,
    cover: 'https://x.public.blob.vercel-storage.com/cover.jpg', nights: 4, total: 5000,
  });
  assert.equal(all.find(card => card.id === 'draft').published, false);
  // 1000 (vie) + 3000 + 3000 (temporada sáb/dom) + 1000 (lun).
  assert.equal(all.find(card => card.id === 'foreign').total, 8000);
  assert.equal(all.find(card => card.id === 'foreign').cover, null);
  // Una noche sin precio: total null, nunca 0.
  assert.deepEqual([all.find(card => card.id === 'noprice').nights, all.find(card => card.id === 'noprice').total], [4, null]);

  // COLLABORATOR: solo las suyas (también su borrador), nunca la de otro dueño.
  assert.deepEqual(ids(await availableForVendor(window, ownerA)), ['both', 'draft', 'free', 'noprice', 'small']);

  // Huéspedes por encima del cupo → fuera.
  assert.ok(!ids(await availableForVendor({ ...window, guests: 4 }, admin)).includes('small'));
  assert.ok(ids(await availableForVendor({ ...window, guests: 2 }, admin)).includes('small'));

  // Traslape de una sola noche con el BlockDate → fuera; fuera de él → libre.
  assert.ok(!ids(await availableForVendor({ start: '2026-12-22', end: '2026-12-23' }, admin)).includes('blocked'));
  assert.ok(ids(await availableForVendor({ start: '2026-12-23', end: '2026-12-24' }, admin)).includes('blocked'));

  // Destino.
  assert.deepEqual(ids(await availableForVendor({ ...window, state: 'Quintana Roo', destinationCity: 'Tulum' }, admin)), ['foreign']);

  // Título en el idioma del panel.
  assert.equal((await availableForVendor(window, admin, 'en')).find(card => card.id === 'free').title, 'House free');
  assert.equal((await availableForVendor(window, admin, 'fr')).find(card => card.id === 'free').title, 'Maison free');

  // Rango inválido → nada (no consulta).
  assert.deepEqual(await availableForVendor({ start: '2026-12-22', end: '2026-12-22' }, admin), []);
  assert.deepEqual(await availableForVendor({ start: 'x', end: '2026-12-22' }, admin), []);

  console.log('OK: disponibilidad del vendedor [start,end), por rol, cupo, tipo de renta, destino y total cotizado.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
