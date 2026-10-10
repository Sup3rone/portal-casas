// API real y SSR layout/footer con contexto; SQLite en memoria, sin Neon.
const assert=require('node:assert/strict'),fs=require('node:fs');
const {load,memory,req,mockModule,setSession}=require('./test-property-access.cjs');
const React=req('react'),intl=req('next-intl'),{renderToStaticMarkup}=req('react-dom/server');
let locale='es',pathname='/';
mockModule('../globals.css',{});
mockModule('next-intl',{...intl,NextIntlClientProvider:props=>React.createElement(intl.NextIntlClientProvider,{...props,locale,messages:require('../apps/web/messages/'+locale+'.json'),timeZone:'America/Mexico_City'})});
mockModule('next-intl/server',{getMessages:async()=>require('../apps/web/messages/'+locale+'.json')});
mockModule('@/i18n/navigation',{usePathname:()=>pathname,Link:({href,children,...props})=>React.createElement('a',{...props,href:`/${locale}${href}`},children)});
mockModule('@/components/Navbar',()=>null);
mockModule('@/components/AuthProvider',({children})=>children);
const api=load('apps/web/src/app/api/panel/site-content/route.ts');
const Layout=load('apps/web/src/app/[locale]/layout.tsx').default;
const Footer=load('apps/web/src/components/Footer.tsx').default;
const {formatContactWhatsapp}=load('apps/web/src/components/FooterContactsProvider.tsx');
const content={about_es:'',about_en:'',about_fr:'',social_instagram:'https://instagram.com/example',social_facebook:'https://facebook.com/example',featured_property_id:'',contact_whatsapp:'5215512345678'};
const put=body=>api.PUT(new Request('http://localhost/test',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}));
const render=async(path,inDetail=false)=>{
  pathname=path;
  const children=inDetail?React.createElement(Footer,{inDetail:true}):'content';
  return renderToStaticMarkup(await Layout({params:Promise.resolve({locale}),children}));
};
async function main(){
  assert.equal(formatContactWhatsapp('5215512345678'),'+521 55 1234 5678');
  assert.equal(formatContactWhatsapp('12345678'),'+1234 5678');
  assert.equal(formatContactWhatsapp('123456789012345'),'+123 456 7 8901 2345');
  setSession({user:{id:'a'}});assert.equal((await put(content)).status,403);
  setSession({user:{id:'admin'}});
  for(const number of ['1234567','1234567890123456','+5215512345678','52155 12345678','abcdefgh']){
    const response=await put({...content,contact_whatsapp:number});assert.equal(response.status,400);assert.equal((await response.json()).code,'INVALID_CONTACT_WHATSAPP');
  }
  for(const number of ['12345678','123456789012345',content.contact_whatsapp])assert.equal((await put({...content,contact_whatsapp:number})).status,200);
  assert.equal((await (await api.GET()).json()).contact_whatsapp,content.contact_whatsapp);
  for(locale of ['es','en','fr']){
    for(const [path,detail]of [[`/${locale}`,false],[`/${locale}/casas`,false],[`/${locale}/casas/pa`,true]]){
      const html=await render(path,detail);
      assert.equal((html.match(/<footer /g)||[]).length,1);
      assert.ok(html.includes('hola@portalcasas.com'));
      assert.ok(html.includes('href="https://wa.me/5215512345678"'));
      assert.ok(html.includes('>+521 55 1234 5678</span>'));
      for(const url of [content.social_instagram,content.social_facebook]){
        assert.ok(html.includes(`href="${url}" target="_blank" rel="noopener noreferrer"`));
      }
      assert.ok(html.includes('flex-wrap'));assert.ok(html.includes('aria-label='));
    }
    // Borrar una configuración no oculta los demás contactos ni el email.
    for(const key of ['social_instagram','social_facebook','contact_whatsapp']){
      assert.equal((await put({...content,[key]:''})).status,200);
      const html=await render(`/${locale}/casas`);
      for(const other of ['social_instagram','social_facebook','contact_whatsapp']){
        const url=other==='contact_whatsapp'?'https://wa.me/'+content[other]:content[other];
        assert.equal(html.includes(`href="${url}"`),other!==key);
      }
    }
    assert.equal((await put(content)).status,200);
  }
  assert.equal((await put({...content,social_instagram:'',social_facebook:'',contact_whatsapp:''})).status,200);
  assert.ok(!(await render('/fr')).includes('https://wa.me/'));
  const sql=fs.readFileSync('scripts/sql/site-content-contact.sql','utf8'),check=sql.match(/CHECK \(([\s\S]*?)\);/)[1];
  memory.exec(`CREATE TEMP TABLE check_contact ("key" TEXT CHECK (${check}))`);
  memory.prepare('INSERT INTO check_contact VALUES (?)').run('contact_whatsapp');
  assert.throws(()=>memory.prepare('INSERT INTO check_contact VALUES (?)').run('other'),/CHECK/);
  console.log('OK footer: contexto global/detalle, email, contactos condicionales es/en/fr, formato/wa.me, ADMIN y validación 8–15 dígitos. Sin Neon.');
}
main().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>memory.close());
