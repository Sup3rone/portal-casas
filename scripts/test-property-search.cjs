// Listado real y filtros SQL: sin red ni Neon.
const assert = require('node:assert/strict');
const { load, memory, req, setLocale } = require('./test-property-access.cjs');
const React = req('react'), { renderToStaticMarkup } = req('react-dom/server');
const { NextIntlClientProvider } = req('next-intl');
const Page = load('apps/web/src/app/[locale]/casas/page.tsx').default;
const { propertySearch } = load('apps/web/src/lib/property-search.ts');
memory.prepare('UPDATE Property SET titleEs=id,titleEn=id,titleFr=id,city=?,bedrooms=2,rentalType=?,createdAt=?,maxGuests=CASE WHEN id=? THEN 12 ELSE 6 END').run('City','nocturna','2026-01-01','pa');
memory.prepare('UPDATE Property SET state=?,destinationCity=? WHERE id=?').run('Nayarit','Nuevo Vallarta','pa');
memory.prepare('UPDATE Property SET state=?,destinationCity=? WHERE id=?').run('Jalisco','Guadalajara','pb');
memory.prepare('UPDATE Property SET state=?,destinationCity=? WHERE id=?').run('Nayarit','Nuevo Vallarta','hidden');
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
  const destination={state:'NAYARIT',destinationCity:'Nuevo Vallarta'};
  assert.deepEqual(cards(await search(destination)),['pa']);
  assert.deepEqual(cards(await search({state:'Jalisco'})),['pb']);
  assert.deepEqual(cards(await search({state:'',destinationCity:''})).sort(),['pa','pb']);
  assert.deepEqual(cards(await search({...destination,guests:'13'})),[]);
  for(const query of [{state:'Otro'},{state:['Nayarit','Jalisco']},{state:'Jalisco',destinationCity:'Nuevo Vallarta'},{destinationCity:'Nuevo Vallarta'},{state:'Nayarit',destinationCity:['Nuevo Vallarta']}]) {
    assert.ok(propertySearch(query).invalid);assert.deepEqual(cards(await search(query)),[]);
  }
  for (const query of [{guests:'0'},{guests:'1.5'},{guests:'abc'},{guests:['6','10']},{start:'2030-01-01'},{start:'2030-02-30',end:'2030-03-02'},{start:'2030-01-03',end:'2030-01-01'}]) {
    assert.ok(propertySearch(query).invalid); assert.deepEqual(cards(await search(query)),[]);
  }
  const dates={start:'2030-01-10',end:'2030-01-15'};
  memory.prepare('INSERT INTO Booking (id,propertyId,startDate,endDate,source) VALUES (?,?,?,?,?)').run('occupied-search','pa','2030-01-11','2030-01-12','airbnb');
  assert.deepEqual(cards(await search(dates)),['pb']);
  assert.deepEqual(cards(await search({...dates,guests:'10'})),[]);
  assert.deepEqual(cards(await search({...dates,...destination,guests:'4'})),[],'Combina ubicación, capacidad y ocupación');
  assert.deepEqual(cards(await search({state:'Jalisco',destinationCity:'Guadalajara',...dates,guests:'4'})),['pb']);
  memory.prepare('INSERT INTO BlockDate (id,propertyId,startDate,endDate,createdBy) VALUES (?,?,?,?,?)').run('block-search','pb','2030-01-13','2030-01-14','admin');
  assert.deepEqual(cards(await search(dates)),[]);
  memory.prepare('DELETE FROM Booking').run(); memory.prepare('DELETE FROM BlockDate').run();
  memory.prepare('INSERT INTO Booking (id,propertyId,startDate,endDate,source) VALUES (?,?,?,?,?)').run('end-search','pa','2030-01-15','2030-01-16','manual');
  assert.deepEqual(cards(await search(dates)),['pb'],'Salida ocupada se excluye igual que en reserva');
  memory.prepare('UPDATE Booking SET startDate=?,endDate=?').run('2030-01-08','2030-01-10');
  assert.deepEqual(cards(await search(dates)).sort(),['pa','pb'],'Llegada el día de checkout existente disponible');
  // Tres modalidades: sin fechas se conserva la anual, con fechas solo nocturna/ambas.
  memory.prepare('INSERT INTO Property (id,ownerId,published,slug,titleEs,titleEn,titleFr,city,state,destinationCity,maxGuests,bedrooms,bathrooms,rentalType,createdAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
    .run('annual-search','a',1,'annual-search','Casa anual','Annual house','Maison annuelle','Nuevo Vallarta','Nayarit','Nuevo Vallarta',10,2,1,'anual','2026-01-01');
  memory.prepare('UPDATE Property SET rentalType=? WHERE id=?').run('ambas','pb');
  assert.deepEqual(cards(await search({})).sort(),['annual-search','pa','pb']);
  assert.deepEqual(cards(await search({state:'',destinationCity:''})).sort(),['annual-search','pa','pb']);
  assert.deepEqual(cards(await search(destination)).sort(),['annual-search','pa'],'Ciudad sin fechas incluye anual');
  assert.deepEqual(cards(await search({guests:'10'})).sort(),['annual-search','pa'],'Capacidad se aplica a anual sin fechas');
  assert.deepEqual(cards(await search({...destination,guests:'11'})),['pa']);
  assert.deepEqual(cards(await search(dates)).sort(),['pa','pb'],'Nocturna/ambas disponibles; anual sin ocupación también excluida');
  assert.deepEqual(cards(await search({...destination,...dates,guests:'4'})),['pa']);
  memory.prepare('INSERT INTO Booking (id,propertyId,startDate,endDate,source) VALUES (?,?,?,?,?)').run('both-occupied','pb','2030-01-11','2030-01-12','manual');
  assert.deepEqual(cards(await search(dates)),['pa'],'Ambas sigue respetando ocupación');
  memory.prepare('DELETE FROM Booking WHERE id=?').run('both-occupied');
  memory.prepare('UPDATE Property SET published=0 WHERE id=?').run('annual-search');
  assert.deepEqual(cards(await search({})).sort(),['pa','pb'],'Anual no publicada nunca aparece');
  memory.prepare('UPDATE Property SET published=1 WHERE id=?').run('annual-search');
  for (const locale of ['es','en','fr']) {
    setLocale(locale);
    const messages=require('../apps/web/messages/'+locale+'.json');
    const page=await Page({params:Promise.resolve({locale}),searchParams:Promise.resolve({guests:'99'})});
    const html=renderToStaticMarkup(React.createElement(NextIntlClientProvider,{locale,messages,timeZone:'America/Mexico_City'},page));
    assert.ok(html.includes(messages.listingSearch.empty));assert.ok(html.includes(messages.listingSearch.clear));assert.ok(html.includes(`href="/${locale}/casas"`));
    const selected=await Page({params:Promise.resolve({locale}),searchParams:Promise.resolve({...destination,...dates,guests:'4'})});
    const selectedHtml=renderToStaticMarkup(React.createElement(NextIntlClientProvider,{locale,messages,timeZone:'America/Mexico_City'},selected));
    assert.match(selectedHtml,/<option value="Nayarit" selected="">/);
    assert.match(selectedHtml,/<option value="Nuevo Vallarta" selected="">/);
    assert.ok(selectedHtml.includes('value="2030-01-10"'));
    assert.match(selectedHtml,/<option value="4" selected="">/);
    for (const field of ['start','end','guests']) assert.match(selectedHtml,new RegExp(`<label for="[^"]+-${field}" class="[^"]*font-bold`));
    for (const field of ['state','city']) assert.doesNotMatch(selectedHtml,new RegExp(`<label for="[^"]+-${field}" class="[^"]*font-bold`));
    assert.ok(selectedHtml.includes(messages.home.allStates));
    assert.ok(selectedHtml.includes(messages.home.allCities));
    const oldDestination=await Page({params:Promise.resolve({locale}),searchParams:Promise.resolve({state:'Yucatán',destinationCity:'Mérida'})});
    const oldHtml=renderToStaticMarkup(React.createElement(NextIntlClientProvider,{locale,messages,timeZone:'UTC'},oldDestination));
    assert.match(oldHtml,/<option value="Yucatán" selected="">/);
    assert.match(oldHtml,/<option value="Mérida" selected="">/);
    assert.ok(oldHtml.includes(messages.listingSearch.empty),'Destino válido sin publicadas conserva filtro y muestra vacío');

    const annualPage=await Page({params:Promise.resolve({locale}),searchParams:Promise.resolve(destination)});
    const annualHtml=renderToStaticMarkup(React.createElement(NextIntlClientProvider,{locale,messages,timeZone:'America/Mexico_City'},annualPage));
    assert.ok(annualHtml.includes(messages.properties.annualRent),'Distintivo anual visible y localizado sin fechas');
    assert.ok(annualHtml.includes(`href="/${locale}/casas/annual-search"`));
  }
  memory.close(); console.log('OK búsqueda: capacidad/publicación, filtros combinados, Booking/BlockDate, checkout, parámetros inválidos, vacío y limpiar es/en/fr.');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
