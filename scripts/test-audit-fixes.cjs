// Regresiones quirúrgicas de la auditoría; sin red ni BD real.
const assert = require('node:assert/strict');
const { load, req, memory, queryLog, setLocale, setSession } = require('./test-property-access.cjs');
const React = req('react'), { renderToStaticMarkup } = req('react-dom/server');
const Forgot = load('apps/web/src/app/[locale]/olvide-password/page.tsx').default;
const Reset = load('apps/web/src/app/[locale]/reset-password/page.tsx').default;
const { resetPassword } = load('apps/web/src/app/[locale]/reset-password/actions.ts');
const Account = load('apps/web/src/app/[locale]/mi-cuenta/page.tsx').default;
const Modal = load('apps/web/src/components/MessageModal.tsx').default;
const booking = load('apps/web/src/app/api/bookings/create/route.ts');
memory.exec('CREATE TABLE PasswordResetToken (id TEXT PRIMARY KEY, userId TEXT, token TEXT, expiresAt TEXT, usedAt TEXT, createdAt TEXT)');
memory.prepare('INSERT INTO PasswordResetToken (id,userId,token,expiresAt) VALUES (?,?,?,?)').run('reset-a','a','valid-token','2099-01-01T00:00:00.000Z');
async function main() {
  for (const locale of ['es','en','fr']) {
    setLocale(locale); setSession(null);
    const messages = require('../apps/web/messages/' + locale + '.json');
    const forgot = renderToStaticMarkup(await Forgot({params:Promise.resolve({locale}),searchParams:Promise.resolve({})}));
    assert.ok(forgot.includes(messages.auth.email));
    const data = new FormData(); data.set('locale',locale); data.set('token','valid-token'); data.set('password','short');
    await assert.rejects(()=>resetPassword(data), e=>e.message===`redirect: /${locale}/reset-password?token=valid-token&error=corta`);
    const reset = renderToStaticMarkup(await Reset({params:Promise.resolve({locale}),searchParams:Promise.resolve({token:'valid-token',error:'corta'})}));
    assert.ok(reset.includes('<form')); assert.ok(reset.includes('role="alert"')); assert.ok(reset.includes(messages.auth.resetTooShort));
    await assert.rejects(()=>Account(), e=>e.message===`redirect: /${locale}/login`);
  }
  setSession({user:{id:'a'}});
  for (const [startDate,endDate] of [['invalid','2027-01-02'],['2027-01-01','invalid']]) {
    const before=queryLog.length;
    const response=await booking.POST(new Request('http://localhost/api/bookings/create',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({propertyId:'pa',startDate,endDate})}));
    assert.equal(response.status,400);assert.equal((await response.json()).code,'INVALID_DATES');
    // Solo la lectura de autorización, ninguna escritura ni cast de fechas.
    assert.ok(queryLog.slice(before).every(query=>!query.toLowerCase().includes('insert')));
  }
  const base={id:'m',name:'Guest',email:'guest@test.invalid',phone:null,body:'Inquiry',propertyId:'pa',propertyName:'House',propertySlug:'pa',userId:null,startDate:'2027-01-01'};
  // SSR usa los estados iniciales reales y verifica el botón de confirmación.
  for (const endDate of ['2027-01-01','2027-01-02']) {
    const html=renderToStaticMarkup(React.createElement(Modal,{message:{...base,endDate},onClose(){},onSuccess(){},onDelete:async()=>{}}));
    const confirm = html.match(/<button[^>]*>[^<]*Confirmar[^<]*<\/button>/)?.[0];
    assert.ok(confirm); assert.equal(/\sdisabled(?:=|\s|>)/.test(confirm),endDate===base.startDate);
  }
  memory.close(); console.log('OK auditoría: recuperación/locales, error corto con token válido, fechas inválidas 400 y modal llegada < salida.');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
