const assert=require('node:assert/strict'),fs=require('node:fs');
const {load,req,memory,mockModule,setSession,setLocale,queryLog}=require('./test-property-access.cjs');
const {panelRequest,panelResponseError,PanelRequestError}=load('apps/web/src/components/panel/request.ts');
const nativeFetch=global.fetch;
let locale='es',hook=0,refreshes=0;const states=[];const React=req('react');
mockModule('react',{...React,useState:initial=>{const i=hook++;if(!(i in states))states[i]=initial;return[states[i],value=>{states[i]=value;}];}});
mockModule('next/navigation',{useRouter:()=>({refresh(){refreshes++;}}),redirect:url=>{throw new Error('redirect: '+url);}});
mockModule('next-intl',{...req('next-intl'),useTranslations:namespace=>req('next-intl').createTranslator({locale,messages:JSON.parse(fs.readFileSync(`apps/web/messages/${locale}.json`)),namespace})});
const Mark=load('apps/web/src/components/MarkAsReadButton.tsx').default;
const rates=load('apps/web/src/app/[locale]/admin/tarifas/actions.ts');
const RatePage=load('apps/web/src/app/[locale]/admin/tarifas/page.tsx').default;
memory.prepare('UPDATE "SeasonRate" SET weekdayPrice=100,weekendPrice=200').run();
function find(node,predicate){if(!node||typeof node!=='object')return null;if(Array.isArray(node)){for(const child of node){const result=find(child,predicate);if(result)return result;}return null;}if(predicate(node))return node;return find(node.props?.children,predicate);}
function render(){hook=0;return Mark({messageId:'qa',read:false});}
(async()=>{try{
  for(const [status,body,key] of [[401,{error:'No autorizado'},'sessionExpired'],[403,{error:'No autorizado'},'forbidden'],[403,{code:'SESSION_USER_NOT_FOUND'},'sessionExpired'],[400,{code:'INVALID_COVER_PHOTO'},'invalidCoverPhoto'],[400,{code:'INVALID_CONTACT_WHATSAPP'},'invalidContactWhatsapp'],[400,{message:'validation'},'validation'],[500,{message:'SQL secret',code:'UNKNOWN'},'error'],[404,{error:'unknown'},'notFound']]) {
    global.fetch=async()=>Response.json(body,{status});
    await assert.rejects(()=>panelRequest('/test','POST',{}),error=>error instanceof PanelRequestError&&error.message===key&&error.status===status);
  }
  global.fetch=async()=>{throw new TypeError('Failed to fetch');};await assert.rejects(()=>panelRequest('/test','POST'),error=>error.message==='networkError');
  assert.equal(panelResponseError(500,null).message,'error');
  for(locale of ['es','en','fr']) {
    const messages=JSON.parse(fs.readFileSync(`apps/web/messages/${locale}.json`));setLocale(locale);
    for(const key of ['sessionExpired','networkError','invalidCoverPhoto','tariffName','markReadError'])assert.ok(messages.panel[key]);
    for(const [kind,key] of [['session','sessionExpired'],['network','networkError'],['server','markReadError']]) {
      states.length=0;global.fetch=async()=>{if(kind==='network')throw new TypeError('Failed to fetch');return Response.json({error:'Error interno'},{status:kind==='session'?401:500});};
      const before=refreshes;let stopped=false;
      find(render(),node=>node.type==='button').props.onClick({stopPropagation(){stopped=true;}});
      await new Promise(resolve=>setImmediate(resolve));
      assert.equal(find(render(),node=>node.props?.role==='alert').props.children,messages.panel[key]);assert.equal(refreshes,before);assert.equal(stopped,true);
    }
    setSession({user:{id:'admin'}});
    for(const [field,value,key] of [['name','','tariffName'],['startDate','2026-02-30','tariffStart'],['endDate','2027-01-01','tariffRange'],['weekdayPrice','0','tariffWeekday'],['weekendPrice','abc','tariffWeekend']]) {
      const data=new FormData();for(const [k,v] of Object.entries({propertyId:'pa',name:'Season',startDate:'2027-01-01',endDate:'2027-01-03',weekdayPrice:'100',weekendPrice:'200'}))data.set(k,v);data.set(field,value);
      const before=queryLog.length;
      await assert.rejects(()=>rates.addTarifa(data),error=>error.message===`redirect: /${locale}/admin/tarifas?error=${key}`);
      assert.ok(queryLog.slice(before).every(query=>!query.toLowerCase().includes('insert')));
      const tree=await RatePage({searchParams:Promise.resolve({error:key})});
      assert.equal(find(tree,node=>node.props?.role==='alert').props.children,messages.panel[key]);
    }
  }
  console.log('OK errores panel: codes/status, sesión vs permisos, red, feedback Marcar leída y tarifas por campo es/en/fr.');
}finally{global.fetch=nativeFetch;memory.close();}})().catch(error=>{console.error(error);process.exitCode=1;});
