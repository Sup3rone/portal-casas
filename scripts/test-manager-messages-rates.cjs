const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {load,req,memory,setSession,mockModule}=require('./test-property-access.cjs');
const React=req('react'),{renderToStaticMarkup}=req('react-dom/server'),{NextIntlClientProvider}=req('next-intl');
mockModule('next/navigation',{useRouter:()=>({refresh(){}}),redirect:url=>{throw Error('redirect: '+url);},notFound:()=>{throw Error('notFound');}});
const Messages=load('apps/web/src/app/[locale]/admin/mensajes/page.tsx').default;
const Rates=load('apps/web/src/app/[locale]/admin/tarifas/page.tsx').default;
const actions=load('apps/web/src/app/[locale]/admin/tarifas/actions.ts');
const read=load('apps/web/src/app/api/messages/read/route.ts'),remove=load('apps/web/src/app/api/messages/delete/route.ts'),booking=load('apps/web/src/app/api/bookings/create/route.ts');
const messages=JSON.parse(fs.readFileSync('apps/web/messages/es.json'));
const request=body=>new Request('http://localhost/test',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
const rateForm=(propertyId,id)=>{const form=new FormData();for(const [key,value] of Object.entries({id,propertyId,name:'Temporada QA',startDate:'2030-11-01',endDate:'2030-11-04',weekdayPrice:'1500',weekendPrice:'1500',priority:'0'}))if(value)form.set(key,value);return form;};
(async()=>{try{
 memory.prepare('UPDATE "Property" SET "titleEs"=id, slug=id').run();
 memory.prepare('UPDATE "Message" SET name=\'Cliente QA\',email=\'qa@example.invalid\',body=\'Consulta QA\',lang=\'es\',read=0,"createdAt"=\'2026-10-14 12:00:00\',"startDate"=\'2030-10-01\',"endDate"=\'2030-10-03\'').run();
 memory.prepare('UPDATE "SeasonRate" SET name=id,"startDate"=\'2030-10-01\',"endDate"=\'2030-10-03\',"weekdayPrice"=1500,"weekendPrice"=1500,priority=0').run();
 for(const [id,status] of [[null,401],['client',403],['viewer',403]]){
 setSession(id?{user:{id}}:null);await assert.rejects(()=>Messages(),e=>e.status===status);await assert.rejects(()=>Rates({}),e=>e.status===status);
 }
 for(const [id,expected] of [['a',['ma']],['admin',['ma','mb']]]){
 setSession({user:{id}});const mt=await Messages();assert.deepEqual(mt.props.rows.map(r=>r.id).sort(),expected);
 const rt=await Rates({});const html=renderToStaticMarkup(rt);assert.ok(html.includes('ra'));assert.equal(html.includes('rb'),id==='admin');
 const choices=rt.props.children[2].props.propiedades.map(p=>p.id);assert.equal(choices.includes('pb'),id==='admin');
 if(process.env.MANAGER_QA_DIR&&id==='a')for(const [view,tree] of [['mensajes',mt],['tarifas',rt]]){
 const content=renderToStaticMarkup(React.createElement(NextIntlClientProvider,{locale:'es',messages,timeZone:'America/Mexico_City'},tree));
 fs.writeFileSync(path.join(process.env.MANAGER_QA_DIR,'manager-'+view+'.html'),`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="http://localhost:3000/_next/static/chunks/apps_web_src_app_globals_1wvyn-h.css"></head><body><p>QA OFFLINE — COLLABORATOR simulado: pa propia, pb ajena excluida</p>${content}</body></html>`);
 }
 }
 setSession({user:{id:'a'}});
 for(const endpoint of [read,remove])assert.equal((await endpoint.POST(request({id:'mb'}))).status,404);
 assert.equal((await read.POST(request({id:'ma'}))).status,200);
 await assert.rejects(()=>actions.addTarifa(rateForm('pb')),e=>e.status===404);
 await assert.rejects(()=>actions.deleteTarifa(rateForm(null,'rb')),e=>e.status===404);
 await actions.addTarifa(rateForm('pa'));await actions.deleteTarifa(rateForm(null,'ra'));
 const payload={propertyId:'pb',startDate:'2030-11-01',endDate:'2030-11-03'};
 assert.equal((await booking.POST(request(payload))).status,404);
 assert.equal((await booking.POST(request({...payload,propertyId:'pa'}))).status,200);
 assert.equal((await remove.POST(request({id:'ma'}))).status,200);
 assert.equal(memory.prepare('SELECT count(*) AS n FROM Message WHERE id=\'mb\'').get().n,1);
 assert.equal(memory.prepare('SELECT count(*) AS n FROM SeasonRate WHERE id=\'rb\'').get().n,1);
 setSession({user:{id:'admin'}});await actions.addTarifa(rateForm('pb'));await actions.deleteTarifa(rateForm(null,'rb'));
 assert.equal((await remove.POST(request({id:'mb'}))).status,200);
 console.log('OK vistas/acciones Mensajes y Tarifas: ADMIN todo, colaborador solo propias, ajenas404, sin sesión401, CLIENT/VIEWER403. Sin Neon.');
}finally{memory.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
