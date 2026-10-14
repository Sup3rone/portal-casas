const assert = require('node:assert/strict');
const fs = require('node:fs');
const { load, req, memory, setLocale, setSession, mockModule } = require('./test-property-access.cjs');
const React = req('react'), { renderToStaticMarkup } = req('react-dom/server');
const { NextIntlClientProvider } = req('next-intl');
const { default: Inquiries, inquiryEstimate } = load('apps/web/src/components/panel/Inquiries.tsx');
const row = { id:'qa', propertyId:'pa',slug:'qa-house',title:'Casa de prueba',name:'Cliente de prueba',email:'qa@example.invalid',phone:null,body:'Consulta de prueba',read:false,createdAt:'2026-10-13T12:00:00Z',startDate:'2026-10-17 00:00:00',endDate:'2026-10-19T00:00:00Z',rentalType:'nocturna',weekdayPrice:1500,weekendPrice:1500,seasonalPrice:false,photoUrl:'/og-default.jpg' };
assert.equal(inquiryEstimate(row).nights,2); assert.equal(inquiryEstimate(row).total,3000);
for(const changed of [{weekdayPrice:null},{weekendPrice:1800},{seasonalPrice:true},{rentalType:'anual'}]) {
  const estimate=inquiryEstimate({...row,...changed});assert.equal(estimate.nights,2);assert.equal(estimate.total,null);
}
for(const changed of [{startDate:'2026-02-30'},{startDate:null},{endDate:row.startDate},{endDate:'2026-10-16'}]) assert.equal(inquiryEstimate({...row,...changed}).nights,null);
assert.equal(inquiryEstimate({...row,startDate:'2026-03-07',endDate:'2026-03-10'}).nights,3,'Sin desfase DST');
let today='2026-10-19';
mockModule('@/lib/inquiry-validation',{inquiryToday:()=>today});
const Page=load('apps/web/src/app/[locale]/panel/consultas/page.tsx').default;
memory.prepare('UPDATE "Message" SET "createdAt"=?, "startDate"=?, "endDate"=?').run('2026-10-13 12:00:00','2026-10-17','2026-10-19');
memory.prepare('INSERT INTO "Media" (id,propertyId,type,url,"order",isCover,coverOrder) VALUES (?,?,?,?,?,?,?)').run('qa-cover','pa','PHOTO','/og-default.jpg',10,1,0);
memory.prepare('INSERT INTO "SeasonRate" (id,propertyId,name,startDate,endDate,weekdayPrice,weekendPrice,priority) VALUES (?,?,?,?,?,?,?,?)').run('qa-season','pa','QA','2026-10-16','2026-10-17',2000,2000,1);
(async()=>{try{
  for(const locale of ['es','en','fr']) {
    setLocale(locale);setSession({user:{id:'a'}});
    const messages=JSON.parse(fs.readFileSync('apps/web/messages/'+locale+'.json','utf8'));
    const render=children=>renderToStaticMarkup(React.createElement(NextIntlClientProvider,{locale,messages,timeZone:'UTC'},children));
    const html=render(React.createElement(Inquiries,{rows:[row,{...row,id:'no-price',weekdayPrice:null,weekendPrice:null,photoUrl:null}]}));
    assert.ok(html.includes(`/${locale}/casas/qa-house`));assert.ok(html.includes('target="_blank"'));assert.ok(html.includes('noopener noreferrer'));
    assert.equal((html.match(/MXN/g)||[]).length,1);assert.ok(html.includes(messages.panel.emptyPhotos));
    assert.ok(!html.includes('00:00:00Z</p>'));assert.ok(html.includes('Marcar')||html.includes('Mark')||html.includes('Marquer'));
    const grouped=render(React.createElement(Inquiries,{rows:[
      {...row,id:'older',name:'Pasada antigua',startDate:'2026-10-08',endDate:'2026-10-10',isPast:true},
      {...row,id:'recent',name:'Pasada reciente',startDate:'2026-10-10',endDate:'2026-10-12',isPast:true},
      {...row,id:'current',name:'Consulta activa',isPast:false},
    ]}));
    assert.ok(grouped.indexOf('Consulta activa')<grouped.indexOf(messages.panel.pastInquiries));
    assert.ok(grouped.indexOf('Pasada reciente')<grouped.indexOf('Pasada antigua'));
    assert.equal((grouped.match(/<article /g)||[]).length,3);
    assert.ok(!html.includes(messages.panel.pastInquiries),'Sin pasadas no aparece encabezado');
    if(process.env.PAST_INQUIRIES_QA_HTML&&locale==='es') fs.writeFileSync(process.env.PAST_INQUIRIES_QA_HTML,`<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="http://localhost:3000/_next/static/chunks/apps_web_src_app_globals_1wvyn-h.css"></head><body><main class="mx-auto max-w-4xl px-4 py-10"><p>QA OFFLINE — datos ficticios</p>${grouped}</main></body></html>`);
    // La query real incorpora portada y temporadas sin perder ownership.
    const tree=await Page({params:Promise.resolve({locale})});
    const data=tree.props.children[0].props.rows;
    assert.ok(data.every(item=>item.propertyId==='pa'));
    assert.ok(data.every(item=>item.isPast===false),'Checkout hoy no es pasado');
    today='2026-10-20';
    const nextDay=await Page({params:Promise.resolve({locale})});
    assert.ok(nextDay.props.children[0].props.rows.every(item=>item.isPast===true),'Checkout anterior a hoy es pasado');
    today='2026-10-19';
    assert.ok(data.every(item=>'photoUrl' in item && 'seasonalPrice' in item && 'weekdayPrice' in item));
    assert.ok(data.every(item=>item.photoUrl==='/og-default.jpg' && Boolean(item.seasonalPrice)),'Portada y fin inclusivo de temporada respetados');
    if(process.env.INQUIRIES_QA_HTML && locale==='es') fs.writeFileSync(process.env.INQUIRIES_QA_HTML,`<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>QA Mis consultas — datos ficticios</title><link rel="stylesheet" href="${process.env.INQUIRIES_QA_CSS}"></head><body><main class="mx-auto max-w-6xl px-4 py-10"><p>QA OFFLINE — datos ficticios: con precio uniforme y sin precio</p>${html}</main></body></html>`);
  }
  console.log('OK consultas: precio/no precio/temporada/anual/fechas, portada, locales, enlace y ownership.');
}finally{memory.close();}})().catch(error=>{console.error(error);process.exitCode=1;});
