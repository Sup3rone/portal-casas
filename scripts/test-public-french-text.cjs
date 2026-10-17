// Limpieza solo de texto público FR; datos de prueba en memoria, sin Neon.
const assert=require('node:assert/strict');
const {load,memory,req,setLocale}=require('./test-property-access.cjs');
const {publicFrenchText}=load('apps/web/src/i18n/public-french-text.ts');
const Home=load('apps/web/src/app/[locale]/page.tsx').default;
const Detail=load('apps/web/src/app/[locale]/casas/[slug]/page.tsx').default;
const React=req('react'),{renderToStaticMarkup}=req('react-dom/server'),{NextIntlClientProvider}=req('next-intl');
function render(locale,element){return renderToStaticMarkup(React.createElement(NextIntlClientProvider,{locale,messages:require('../apps/web/messages/'+locale+'.json'),timeZone:'America/Mexico_City',onError(error){throw error;}},element));}
async function main(){
  for(const text of ['Test text about destiny in this apartment','Texte de test sur le destin dans ce département','Texte de test sur nous','Texto de prueba sobre el destino','Lorem ipsum dolor sit amet','Placeholder'])assert.equal(publicFrenchText(text),'');
  for(const text of ['Une maison près de la mer.','Testez les activités locales.','Nuevo Vallarta','Instagram'])assert.equal(publicFrenchText(text),text);
  assert.equal(publicFrenchText(null),'');assert.equal(publicFrenchText(''),'');
  memory.prepare('UPDATE Property SET titleEs=?,titleEn=?,titleFr=?,descEs=?,descEn=?,descFr=?,city=? WHERE id=?').run('Casa','House','Maison','Texto de prueba ES','Test text EN','Test text about destiny in this apartment','Vallarta','pa');
  memory.prepare('INSERT INTO Media (id,propertyId,url,type,"order",category,isCover) VALUES (?,?,?,?,?,?,?)').run('photo','pa','/fotos/real.jpg','PHOTO',0,'principal',0);
  const section=memory.prepare('INSERT INTO PropertySection (propertyId,section,descriptionEs,descriptionEn,descriptionFr,heroMediaId) VALUES (?,?,?,?,?,?)');
  section.run('pa','destino','Texto de prueba ES','Test text EN','Texte de test sur le destin dans ce département','photo');
  section.run('pa','amenidades','Texto de prueba ES','Test text EN','Lorem ipsum',null);
  section.run('pa','advertencias','Texto de prueba ES','Test text EN','Placeholder',null);
  const insert=memory.prepare('INSERT INTO SiteContent (key,value) VALUES (?,?)');
  for(const [key,value]of Object.entries({about_image:'https://qa.public.blob.vercel-storage.com/about.jpg',about_es:'Texto de prueba ES',about_en:'Test text EN',about_fr:'Texte de test sur nous',featured_property_id:'pa',social_instagram:'',social_facebook:'',contact_whatsapp:''}))insert.run(key,value);
  const placeholders=/test text|texte de test|texto de prueba|lorem ipsum|placeholder/i;
  setLocale('fr');
  let home=render('fr',await Home({params:Promise.resolve({locale:'fr'})}));
  let detail=render('fr',await Detail({params:Promise.resolve({locale:'fr',slug:'pa'})}));
  assert.doesNotMatch(home,placeholders);assert.doesNotMatch(detail,placeholders);
  assert.ok(detail.includes('/fotos/real.jpg'),'Fotos reales conservadas');
  assert.ok(!detail.includes('data-editorial-slide="amenidades"'),'Fila solo con prueba no deja sección vacía');
  assert.ok(!detail.includes('data-editorial-narrative'),'Sin cuadros de narrativa vacíos');
  for(const locale of ['es','en']){
    setLocale(locale);
    assert.match(render(locale,await Home({params:Promise.resolve({locale})})),locale==='es'?/Texto de prueba ES/:/Test text EN/);
    assert.match(render(locale,await Detail({params:Promise.resolve({locale,slug:'pa'})})),locale==='es'?/Texto de prueba ES/:/Test text EN/);
  }
  assert.equal(memory.prepare('SELECT descriptionFr FROM PropertySection WHERE propertyId=? AND section=?').get('pa','destino').descriptionFr,'Texte de test sur le destin dans ce département','Sin cambios de contenido persistido');
  memory.prepare('UPDATE Property SET descFr=? WHERE id=?').run('Une description française authentique.','pa');
  memory.prepare('UPDATE PropertySection SET descriptionFr=? WHERE propertyId=? AND section=?').run('Profitez de la région et de ses paysages.','pa','destino');
  memory.prepare('UPDATE SiteContent SET value=? WHERE key=?').run('Nous vous aidons à préparer votre séjour.','about_fr');
  setLocale('fr');home=render('fr',await Home({params:Promise.resolve({locale:'fr'})}));detail=render('fr',await Detail({params:Promise.resolve({locale:'fr',slug:'pa'})}));
  assert.ok(home.includes('Nous vous aidons'));assert.ok(home.includes('Une description française authentique.'));
  assert.ok(detail.includes('Profitez de la région'));assert.ok(detail.includes('Une description française authentique.'));
  // Revisar textos visibles, no nombres internos de claves como namePlaceholder.
  const texts=value=>typeof value==='string'?[value]:value&&typeof value==='object'?Object.values(value).flatMap(texts):[];
  assert.doesNotMatch(texts(require('../apps/web/messages/fr.json')).join('\n'),placeholders);
  console.log('OK texte public FR: placeholders masqués, descriptions réelles/fotos conservées, pas de fallback ES et es/en inchangés.');
}
main().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>memory.close());
