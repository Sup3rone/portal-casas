// Contenido público/ADMIN, SQL real en memoria y SSR; sin Neon.
const assert = require('node:assert/strict');
const { load, memory, req, setLocale, setSession } = require('./test-property-access.cjs');
const React=req('react'),{renderToStaticMarkup}=req('react-dom/server'),{NextIntlClientProvider}=req('next-intl');
const api=load('apps/web/src/app/api/panel/site-content/route.ts');
const Home=load('apps/web/src/app/[locale]/page.tsx').default;
const ContentPage=load('apps/web/src/app/[locale]/panel/contenido/page.tsx').default;
const Layout=load('apps/web/src/app/[locale]/panel/layout.tsx').default;
const content={about_es:'Nosotros ES',about_en:'About EN',about_fr:'À propos FR',social_instagram:'https://www.instagram.com/example/',social_facebook:'https://www.facebook.com/example/'};
const put=value=>api.PUT(new Request('http://localhost/api/panel/site-content',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(value)}));
async function renderHome(locale){setLocale(locale);const messages=require('../apps/web/messages/'+locale+'.json');return renderToStaticMarkup(React.createElement(NextIntlClientProvider,{locale,messages,timeZone:'America/Mexico_City'},await Home({params:Promise.resolve({locale})})));}
async function main(){
  for(const id of [null,'a','client','viewer']){
    setSession(id?{user:{id}}:null);const status=id?403:401;
    assert.equal((await api.GET()).status,status);assert.equal((await put(content)).status,status);
    await assert.rejects(()=>ContentPage({params:Promise.resolve({locale:'es'})}),e=>e.status===404);
  }
  assert.equal(memory.prepare('SELECT count(*) n FROM SiteContent').get().n,0);
  assert.ok(!(await renderHome('es')).includes('Nosotros ES'));
  assert.ok(!(await renderHome('es')).includes('Sobre nosotros'));
  setSession({user:{id:'admin'}});
  for(const [value,code]of [[{...content,about_es:'x'.repeat(2001)},'ABOUT_TOO_LONG'],[{...content,social_instagram:'http://instagram.com/x'},'INVALID_SOCIAL_URL'],[{...content,social_facebook:'javascript:alert(1)'},'INVALID_SOCIAL_URL'],[{...content,social_facebook:'https://user:pass@example.com'},'INVALID_SOCIAL_URL'],[{...content,unknown:'x'},'INVALID_SITE_CONTENT'],[{},'INVALID_SITE_CONTENT']]){
    const response=await put(value);assert.equal(response.status,400);assert.equal((await response.json()).code,code);
  }
  assert.equal((await put(content)).status,200);
  assert.deepEqual(await (await api.GET()).json(),content);
  for(const locale of ['es','en','fr']){
    const html=await renderHome(locale);assert.ok(html.includes(content['about_'+locale]));
    assert.ok(html.indexOf('Sobre nosotros')>html.indexOf('</form>')||locale!=='es');
    assert.ok(html.includes('target="_blank"'));assert.ok(html.includes('rel="noopener noreferrer"'));assert.ok(html.includes('--reveal-delay:100ms'));
    const messages=require('../apps/web/messages/'+locale+'.json');
    const page=await ContentPage({params:Promise.resolve({locale})});
    const editor=renderToStaticMarkup(React.createElement(NextIntlClientProvider,{locale,messages,timeZone:'America/Mexico_City'},page));
    assert.ok(/maxlength="2000"/i.test(editor));assert.ok(editor.includes('social_instagram'));
    const layout=await Layout({params:Promise.resolve({locale}),children:'panel'});
    const menu=renderToStaticMarkup(React.createElement(NextIntlClientProvider,{locale,messages,timeZone:'America/Mexico_City'},layout));
    assert.ok(menu.includes(`href="/${locale}/panel/contenido"`));
  }
  setSession({user:{id:'a'}});
  const menu=renderToStaticMarkup(await Layout({params:Promise.resolve({locale:'es'}),children:'panel'}));
  assert.ok(!menu.includes('/panel/contenido'));
  setSession({user:{id:'admin'}});
  assert.equal((await put({...content,about_es:'',about_en:'',about_fr:'',social_facebook:'',social_instagram:''})).status,200);
  assert.ok(!(await renderHome('fr')).includes('À propos de nous'));
  assert.equal((await put({...content,about_es:'',about_en:'',about_fr:'',social_facebook:''})).status,200);
  const socialOnly=await renderHome('en');assert.ok(socialOnly.includes('https://www.instagram.com/example/'));assert.ok(!socialOnly.includes('About us'));
  memory.close();console.log('OK SiteContent: ADMIN/denegaciones, validación 400, UPSERT, vaciado, home localizada/Reveal/redes, menú y editor es/en/fr.');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
