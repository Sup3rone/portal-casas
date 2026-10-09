// Listado real y filtros SQL: sin red ni Neon.
const assert = require('node:assert/strict');
const { load, memory, req, setLocale } = require('./test-property-access.cjs');
const React = req('react'), { renderToStaticMarkup } = req('react-dom/server');
const { NextIntlClientProvider } = req('next-intl');
const Page = load('apps/web/src/app/[locale]/casas/page.tsx').default;
const { propertySearch } = load('apps/web/src/lib/property-search.ts');
memory.prepare('UPDATE Property SET titleEs=id,titleEn=id,titleFr=id,city=?,bedrooms=2,rentalType=?,createdAt=?,maxGuests=CASE WHEN id=? THEN 12 ELSE 6 END').run('City','nocturna','2026-01-01','pa');
const search = query => Page({params:Promise.resolve({locale:'es'}),searchParams:Promise.resolve(query)});
function cards(node) {
  if (!node || typeof node !== 'object') return [];
  if (node.props?.property) return [node.props.property.id];
  return [node.props?.children].flat(Infinity).flatMap(cards);
}
async function main() {
  assert.deepEqual(cards(await search({})).sort(),['pa','pb']);
  assert.deepEqual(cards(await search({guests:'10'})),['pa']);
  assert.deepEqual(cards(await search({guests:'6'})).sort(),['pa','pb']);
  assert.deepEqual(cards(await search({guests:'99'})),[]);
  for (const query of [{guests:'0'},{guests:'1.5'},{guests:'abc'},{guests:['6','10']},{start:'2030-01-01'},{start:'2030-02-30',end:'2030-03-02'},{start:'2030-01-03',end:'2030-01-01'}]) {
    assert.ok(propertySearch(query).invalid); assert.deepEqual(cards(await search(query)),[]);
  }
  const dates={start:'2030-01-10',end:'2030-01-15'};
  memory.prepare('INSERT INTO Booking (id,propertyId,startDate,endDate,source) VALUES (?,?,?,?,?)').run('occupied-search','pa','2030-01-11','2030-01-12','airbnb');
  assert.deepEqual(cards(await search(dates)),['pb']);
  assert.deepEqual(cards(await search({...dates,guests:'10'})),[]);
  memory.prepare('INSERT INTO BlockDate (id,propertyId,startDate,endDate,createdBy) VALUES (?,?,?,?,?)').run('block-search','pb','2030-01-13','2030-01-14','admin');
  assert.deepEqual(cards(await search(dates)),[]);
  memory.prepare('DELETE FROM Booking').run(); memory.prepare('DELETE FROM BlockDate').run();
  memory.prepare('INSERT INTO Booking (id,propertyId,startDate,endDate,source) VALUES (?,?,?,?,?)').run('end-search','pa','2030-01-15','2030-01-16','manual');
  assert.deepEqual(cards(await search(dates)),['pb'],'Salida ocupada se excluye igual que en reserva');
  memory.prepare('UPDATE Booking SET startDate=?,endDate=?').run('2030-01-08','2030-01-10');
  assert.deepEqual(cards(await search(dates)).sort(),['pa','pb'],'Llegada el día de checkout existente disponible');
  for (const locale of ['es','en','fr']) {
    setLocale(locale);
    const messages=require('../apps/web/messages/'+locale+'.json');
    const page=await Page({params:Promise.resolve({locale}),searchParams:Promise.resolve({guests:'99'})});
    const html=renderToStaticMarkup(React.createElement(NextIntlClientProvider,{locale,messages,timeZone:'America/Mexico_City'},page));
    assert.ok(html.includes(messages.listingSearch.empty));assert.ok(html.includes(messages.listingSearch.clear));assert.ok(html.includes(`href="/${locale}/casas"`));
  }
  memory.close(); console.log('OK búsqueda: capacidad/publicación, filtros combinados, Booking/BlockDate, checkout, parámetros inválidos, vacío y limpiar es/en/fr.');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
