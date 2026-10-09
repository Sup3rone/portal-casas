// Handlers, filtros SQL y SSR reales; SQLite en memoria, sin Neon.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { load, memory, req, setSession, setLocale } = require('./test-property-access.cjs');
const { occupationCalendar } = load('apps/web/src/lib/occupation-calendar.ts');
const route = load('apps/web/src/app/api/properties/[id]/calendar-blocks/route.ts');
const blocks = load('apps/web/src/app/api/properties/[id]/[resource]/[resourceId]/route.ts');
const Page = load('apps/web/src/app/[locale]/panel/calendario/page.tsx').default;
const AdminPage = load('apps/web/src/app/[locale]/admin/calendario/page.tsx').default;
const React = req('react'), { renderToStaticMarkup } = req('react-dom/server'), { NextIntlClientProvider } = req('next-intl');
const body = { startDate:'2030-01-10',endDate:'2030-01-13' };
const request = data => new Request('http://localhost/test',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
const context = id => ({params:Promise.resolve({id})});
async function main() {
  memory.prepare('INSERT INTO Booking (id,propertyId,startDate,endDate,source,guestUserId) VALUES (?,?,?,?,?,?)')
    .run('calendar-own','pa','2031-02-01','2031-02-03','manual','client');
  memory.prepare('INSERT INTO Booking (id,propertyId,startDate,endDate,source) VALUES (?,?,?,?,?)')
    .run('calendar-foreign','pb','2031-02-01','2031-02-03','airbnb');
  setSession({user:{id:'a'}});
  const data = await occupationCalendar({id:'a',role:'COLLABORATOR'},'es');
  assert.deepEqual(data.propiedades.map(p=>p.id).sort(),['hidden','pa']);
  assert.ok(data.bookings.every(b=>b.propertyId!=='pb'));
  assert.ok(data.bookings.some(b=>b.guestName==='client'&&!b.manualBlock));
  assert.ok(data.bookings.some(b=>b.id==='calendar-own'));
  for(const [id,propertyId,source] of [['own-host','pa','host-block'],['foreign-host','pb','host-block'],['own-airbnb','pa','airbnb'],['own-google','pa','google']]) {
    memory.prepare('INSERT INTO Booking (id,propertyId,startDate,endDate,source) VALUES (?,?,?,?,?)').run(id,propertyId,'2032-01-01','2032-01-03',source);
  }
  const remove=(id,resourceId)=>blocks.DELETE(new Request('http://localhost/test',{method:'DELETE'}),{params:Promise.resolve({id,resource:'blocks',resourceId})});
  assert.equal((await remove('pb','foreign-host')).status,404);
  for(const id of ['calendar-own','own-airbnb','own-google'])assert.equal((await remove('pa',id)).status,404);
  assert.equal((await remove('pa','own-host')).status,200);
  assert.equal(memory.prepare('SELECT count(*) n FROM Booking WHERE id=?').get('own-host').n,0);
  for(const id of ['calendar-own','own-airbnb','own-google','foreign-host'])assert.equal(memory.prepare('SELECT count(*) n FROM Booking WHERE id=?').get(id).n,1);
  setSession({user:{id:'client'}});assert.equal((await remove('pb','foreign-host')).status,403);
  setSession({user:{id:'admin'}});assert.equal((await remove('pb','foreign-host')).status,200);
  setSession({user:{id:'a'}});
  assert.equal((await route.POST(request(body),context('pb'))).status,404);
  assert.equal(memory.prepare('SELECT count(*) n FROM BlockDate').get().n,0);
  assert.equal((await route.POST(request({...body,endDate:body.startDate}),context('pa'))).status,400);
  assert.equal((await route.POST(request(body),context('pa'))).status,201);
  assert.equal(memory.prepare('SELECT createdBy FROM BlockDate').get().createdBy,'a');
  assert.equal((await route.POST(request(body),context('pa'))).status,404); // No solapa.
  const updated=await occupationCalendar({id:'a',role:'COLLABORATOR'},'es');
  assert.ok(updated.bookings.some(b=>b.manualBlock&&b.ownBlock));
  for(const id of ['client','viewer']){
    setSession({user:{id}}); assert.equal((await route.POST(request(body),context('pa'))).status,403);
    await assert.rejects(()=>Page({params:Promise.resolve({locale:'es'})}),e=>e.message==='redirect: /es');
  }
  for(const locale of ['es','en','fr']){
    setLocale(locale);
    const messages=JSON.parse(fs.readFileSync('apps/web/messages/'+locale+'.json','utf8'));
    const render=tree=>renderToStaticMarkup(React.createElement(NextIntlClientProvider,{locale,messages,timeZone:'America/Mexico_City'},tree));
    setSession({user:{id:'a'}});
    const html=render(await Page({params:Promise.resolve({locale})}));
    assert.ok(!html.includes(messages.occupationCalendar.sync));
    assert.ok(!html.includes('>pb<')); assert.ok(html.includes(messages.occupationCalendar.directOrigin));
    await assert.rejects(()=>AdminPage({params:Promise.resolve({locale})}),e=>e.status===403);
    setSession({user:{id:'admin'}});
    const admin=render(await AdminPage({params:Promise.resolve({locale})}));
    assert.ok(admin.includes('>pb<')); assert.ok(admin.includes(messages.occupationCalendar.sync));
  }
  // Ocupación compartida con consulta pública y reserva directa.
  const { propertyBlocks }=load('apps/web/src/lib/occupation-calendar.ts');
  assert.deepEqual(await propertyBlocks('pa'),[body]);
  const booking=load('apps/web/src/app/api/bookings/create/route.ts');
  assert.equal((await booking.POST(request({propertyId:'pa',...body}))).status,404);
  const inquiry=load('apps/web/src/app/api/messages/route.ts');
  const form=new FormData();for(const [key,value]of Object.entries({propertyId:'pa',name:'Test Guest',email:'guest@example.com',phone:'',body:'Consulta',guests:'1',...body}))form.set(key,value);
  const response=await inquiry.POST(new Request('http://localhost/test',{method:'POST',body:form}));
  assert.equal(response.status,400);assert.equal((await response.json()).fields.endDate,'datesOccupied');
  memory.close();console.log('OK calendario: owner SQL, 404 ajena/solape, creación auditada, CLIENT/VIEWER 403, SSR roles es/en/fr y bloqueo de consultas/reservas. Sin Neon.');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
