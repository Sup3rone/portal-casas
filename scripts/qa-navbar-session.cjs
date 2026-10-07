// Navbar/AuthProvider y Auth.js cliente reales; cookies/endpoints simulados, sin BD.
const fs = require('node:fs'), path = require('node:path'), http = require('node:http');
const { createRequire } = require('node:module');
const app = path.resolve(__dirname, '../apps/web');
const dbRequire = createRequire(path.resolve(__dirname, '../packages/db/package.json'));
const esbuild = createRequire(dbRequire.resolve('tsx'))('esbuild');
const messages = Object.fromEntries(['es','en','fr'].map(locale => [locale, JSON.parse(fs.readFileSync(path.join(app,'messages',locale+'.json'),'utf8'))]));
const navigation = `import React,{useSyncExternalStore} from 'react';
  const listeners=new Set();
  export function push(url){history.pushState(null,'',url);listeners.forEach(fn=>fn());}
  export function usePathname(){return useSyncExternalStore(fn=>{listeners.add(fn);return()=>listeners.delete(fn)},()=>location.pathname);}
  export function useRouter(){return {push,refresh(){}};}
  export function Link({href,...props}){const locale=usePathname().split('/')[1]||'es';return <a {...props} href={'/'+locale+href} onClick={e=>{e.preventDefault();push('/'+locale+href)}}/>;}`;
async function main() {
  const build = await esbuild.build({
    stdin: { loader:'jsx',resolveDir:app,contents:`
      import React from 'react';import {createRoot} from 'react-dom/client';
      import AuthProvider from './src/components/AuthProvider';import Navbar from './src/components/Navbar';
      import {usePathname,push} from 'next/navigation';
      document.documentElement.dataset.qaDocument=crypto.randomUUID();
      function Screen(){const pathname=usePathname(),locale=pathname.split('/')[1]||'es';
        async function login(e){e.preventDefault();await fetch('/qa/login',{method:'POST'});push('/'+locale+'/mi-cuenta');}
        async function logout(){await fetch('/qa/logout',{method:'POST'});push('/'+locale);}
        return <main style={{padding:24}}><p>QA sin BD — sesión simulada; Auth.js cliente real</p>
          <p>{pathname}</p>{pathname.endsWith('/login')?<form onSubmit={login}><label>Email de prueba<input name="email" defaultValue="qa@example.test"/></label><button>Iniciar sesión QA</button></form>:<button onClick={()=>push('/'+locale+'/login')}>Ir al login QA</button>}
          <button onClick={logout}>Logout Server Action QA</button>
        </main>;}
      createRoot(document.getElementById('root')).render(<AuthProvider><Navbar/><Screen/></AuthProvider>);
    `},
    bundle:true,write:false,outdir:'out',platform:'browser',format:'iife',define:{'process.env.NODE_ENV':'"development"','process.env.NEXTAUTH_URL':'undefined','process.env.NEXTAUTH_URL_INTERNAL':'undefined','process.env.VERCEL_URL':'undefined'},
    plugins:[{name:'qa-shims',setup(b){
      b.onResolve({filter:/^(next\/navigation|@\/i18n\/navigation)$/},()=>({path:'navigation',namespace:'qa'}));
      b.onResolve({filter:/^next-intl$/},()=>({path:'intl',namespace:'qa'}));
      b.onResolve({filter:/^@\/lib\/theme$/},()=>({path:path.join(app,'src/lib/theme.ts')}));
      b.onLoad({filter:/.*/,namespace:'qa'},a=>({loader:'jsx',resolveDir:app,contents:a.path==='navigation'?navigation:
        `import {usePathname} from 'next/navigation';const messages=${JSON.stringify(messages)};
        export function useLocale(){return usePathname().split('/')[1]||'es';}
        export function useTranslations(namespace){const locale=useLocale();return key=>(namespace+'.'+key).split('.').reduce((v,k)=>v[k],messages[locale]);}`
      }));
    }}],
  });
  const js=build.outputFiles.find(f=>f.path.endsWith('.js')).text;
  const chunks=path.join(app,'.next/dev/static/chunks');
  const cssFile=fs.readdirSync(chunks).find(f=>f.startsWith('apps_web_src_app_globals_')&&f.endsWith('.css'));
  if(!cssFile)throw new Error('Se necesita CSS local existente; no se inicia Next ni se conecta a BD.');
  const css=fs.readFileSync(path.join(chunks,cssFile),'utf8');
  http.createServer((request,response)=>{
    response.setHeader('Cache-Control','no-store');
    const authenticated=/qa_session=collaborator/.test(request.headers.cookie||'');
    const json=value=>{response.setHeader('Content-Type','application/json');response.end(JSON.stringify(value));};
    if(request.url==='/api/auth/session')return json(authenticated?{user:{id:'qa',name:'QA',email:'qa@example.test',role:'COLLABORATOR'},expires:'2099-01-01T00:00:00.000Z'}:null);
    if(request.url==='/api/auth/csrf')return json({csrfToken:'qa'});
    if(request.method==='POST'&&request.url==='/qa/login'){response.setHeader('Set-Cookie','qa_session=collaborator; HttpOnly; SameSite=Lax; Path=/');return json({success:true});}
    if(request.method==='POST'&&['/qa/logout','/api/auth/signout'].includes(request.url)){
      response.setHeader('Set-Cookie','qa_session=; Max-Age=0; Path=/');
      if(request.url==='/qa/logout')return json({success:true});
      let body='';request.on('data',chunk=>body+=chunk);request.on('end',()=>json({url:new URLSearchParams(body).get('callbackUrl')||'/es'}));return;
    }
    if(request.url==='/bundle.js'){response.setHeader('Content-Type','text/javascript');return response.end(js);}
    response.setHeader('Content-Type','text/html; charset=utf-8');
    response.end('<!doctype html><html class="light"><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+css+'</style><body><div id="root"></div><script src="/bundle.js"></script></body></html>');
  }).listen(3101,'127.0.0.1',()=>console.log('QA Navbar http://127.0.0.1:3101/es/login — endpoints simulados, sin Neon.'));
}
main().catch(error=>{console.error(error);process.exitCode=1;});
