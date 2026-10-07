// Efecto real del provider: comprobar transiciones sin red ni cuentas reales.
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const { createRequire } = require('node:module');
const req = createRequire(path.resolve(__dirname,'../apps/web/package.json'));
const React = req('react'), ts = req('typescript');
let pathname='/es/login', notifications=0;
const previous={current:pathname}, exportsObject={};
const code=ts.transpileModule(fs.readFileSync('apps/web/src/components/AuthProvider.tsx','utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX},
}).outputText;
new Function('require','exports',code)(name=>{
  if(name==='react')return {...React,useRef:()=>previous,useEffect:effect=>effect()};
  if(name==='next/navigation')return {usePathname:()=>pathname};
  if(name==='next-auth/react')return {SessionProvider:({children})=>children,getSession:()=>{notifications++;return Promise.resolve(null);}};
  return req(name);
},exportsObject);
const refresh=exportsObject.default({children:null}).props.children[0].type;
function visit(next){pathname=next;refresh();}
visit('/es/login');assert.equal(notifications,0); // Provider hace su lectura inicial.
visit('/es/login');assert.equal(notifications,0); // Error de login: misma ruta.
visit('/es/mi-cuenta');assert.equal(notifications,1); // Cookie nueva + redirect.
visit('/es/mi-cuenta');assert.equal(notifications,1);
visit('/es');assert.equal(notifications,2); // Logout del servidor: sesión null.
visit('/es/casas');assert.equal(notifications,2); // Sin polling en navegación normal.
for(const locale of ['en','fr']){
  const before=notifications;
  visit('/'+locale+'/registro');visit('/'+locale+'/mi-cuenta');visit('/'+locale);
  assert.equal(notifications,before+2);
}
console.log('OK provider: login/registro y logout notifican sesión; sin lectura extra inicial o en navegación normal; es/en/fr. Sin red/BD.');
