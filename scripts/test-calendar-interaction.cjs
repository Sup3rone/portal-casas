// Interacciones del componente y DELETE real con SQLite; sin red ni Neon.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { load, memory, req, mockModule, setSession } = require('./test-property-access.cjs');
const React = req('react'), { renderToStaticMarkup } = req('react-dom/server');
let hooks, index, locale = 'es', refreshes = 0;
mockModule('react', { ...React, useState(initial) {
  const slot=index++;
  if(!(slot in hooks))hooks[slot]=typeof initial==='function'?initial():initial;
  return [hooks[slot],value=>{hooks[slot]=typeof value==='function'?value(hooks[slot]):value;}];
} });
mockModule('next-intl', { useLocale:()=>locale, useTranslations:namespace=>req('next-intl').createTranslator({locale,namespace,messages:JSON.parse(fs.readFileSync('apps/web/messages/'+locale+'.json','utf8')),onError:error=>{throw error;}}) });
mockModule('@/i18n/navigation', { useRouter:()=>({refresh(){refreshes++;}}) });
const { default:Board, isUnlockableBlock }=load('apps/web/src/components/CalendarBoard.tsx');
const route=load('apps/web/src/app/api/properties/[id]/[resource]/[resourceId]/route.ts');
const now=new Date(), date=day=>`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
const booking=(id,source,start,end,manualBlock=false)=>({id,propertyId:'pa',source,start:date(start),end:date(end),manualBlock,ownBlock:false,guestName:'Guest'});
const bookings=[booking('direct','manual',1,3),booking('host','host-block',4,6,true),booking('external','airbnb',7,9),booking('google','google',10,12),booking(undefined,'manual',13,15,true),booking('unknown','other-feed',16,18)];
const render=()=>{index=0;return Board({propiedades:[{id:'pa',slug:'pa',title:'Casa'}],bookings});};
function find(node,predicate) {
  if(!node||typeof node!=='object')return;
  if(predicate(node))return node;
  for(const child of [node.props?.children].flat(Infinity)){const found=find(child,predicate);if(found)return found;}
}
const dayButton=(tree,day)=>find(tree,n=>n.type==='button'&&n.props['aria-label']?.startsWith(date(day)+' ·'));
const unlockButton=tree=>find(tree,n=>n.type==='button'&&n.props.onClick?.toString().includes('unlock(b)'));
const nativeFetch=global.fetch,nativeWindow=global.window;
let calls=[],confirmed=false;
global.window={confirm:()=>confirmed};
global.fetch=async(url,options)=>{
  calls.push([url,options.method]);
  const [,id,resourceId]=url.match(/^\/api\/properties\/([^/]+)\/blocks\/([^/]+)$/);
  return route.DELETE(new Request('http://localhost'+url,options),{params:Promise.resolve({id,resource:'blocks',resourceId})});
};
async function main() {
  setSession({user:{id:'a'}});
  assert.equal(isUnlockableBlock(bookings[1]),true);
  for(const b of bookings.filter(b=>b.source!=='host-block'))assert.equal(isUnlockableBlock(b),false);
  assert.equal(isUnlockableBlock({...bookings[1],id:undefined}),false);
  for(locale of ['es','en','fr']) {
    hooks=[];calls=[];confirmed=false;
    const t=JSON.parse(fs.readFileSync('apps/web/messages/'+locale+'.json','utf8')).occupationCalendar;
    for(const day of [1,7,10,13,16]) {
      dayButton(render(),day).props.onClick();
      const tree=render(),html=renderToStaticMarkup(tree);
      assert.ok(html.includes(t.readOnly));assert.equal(unlockButton(tree),undefined);
      assert.ok(html.includes(day===1?t.directOrigin:day===13?t.hostOrigin:t.externalOrigin));
      assert.equal(calls.length,0);
    }
    dayButton(render(),4).props.onMouseEnter();
    let tree=render();assert.ok(find(tree,n=>n.props?.role==='tooltip'));
    assert.equal(dayButton(tree,4).props['aria-describedby'],'calendar-info-pa');
    dayButton(tree,4).props.onKeyDown({key:'Escape'});assert.equal(find(render(),n=>n.props?.role==='tooltip'),undefined);
    dayButton(render(),4).props.onFocus();assert.ok(unlockButton(render()));
    await unlockButton(render()).props.onClick();assert.equal(calls.length,0); // Cancelar no elimina.
    memory.prepare('INSERT INTO Booking (id,propertyId,startDate,endDate,source) VALUES (?,?,?,?,?)').run('host','pa',date(4),date(6),'host-block');
    confirmed=true;await unlockButton(render()).props.onClick();tree=render();
    assert.deepEqual(calls,[['/api/properties/pa/blocks/host','DELETE']]);
    assert.equal(memory.prepare('SELECT count(*) n FROM Booking WHERE id=?').get('host').n,0);
    assert.ok(dayButton(tree,4).props['aria-label'].endsWith(t.free));
    assert.ok(renderToStaticMarkup(tree).includes(t.unlocked));
    assert.ok(dayButton(tree,1).props['aria-label'].includes(t.directOrigin));
  }
  assert.equal(refreshes,3);
  // Bloqueo obsoleto: no se libera localmente antes del éxito del servidor.
  locale='es';hooks=[];calls=[];
  dayButton(render(),4).props.onClick();await unlockButton(render()).props.onClick();
  const failedTree=render(),messages=JSON.parse(fs.readFileSync('apps/web/messages/es.json','utf8')).occupationCalendar;
  assert.ok(renderToStaticMarkup(failedTree).includes(messages.unlockError));
  assert.ok(dayButton(failedTree,4).props['aria-label'].includes(messages.hostOrigin));
  assert.equal(unlockButton(failedTree).props.disabled,false);assert.equal(refreshes,3);
  console.log('OK calendario: hover/foco/touch, fechas/origen es/en/fr, Escape, confirmación, solo host-block eliminable y grilla actualizada sin recarga.');
}
main().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>{global.fetch=nativeFetch;global.window=nativeWindow;memory.close();});
