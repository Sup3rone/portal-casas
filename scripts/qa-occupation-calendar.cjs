// Fixture interactiva: componente/CSS reales, datos simulados, sin Neon ni nuevas dependencias.
const fs = require('node:fs'), path = require('node:path'), http = require('node:http');
const { createRequire } = require('node:module');
const app = path.resolve(__dirname, '../apps/web');
const dbRequire = createRequire(path.resolve(__dirname, '../packages/db/package.json'));
const esbuild = createRequire(dbRequire.resolve('tsx'))('esbuild');
const messages = JSON.parse(fs.readFileSync(path.join(app, 'messages/es.json'), 'utf8'));
async function main() {
  const build = await esbuild.build({
    stdin: { loader: 'jsx', resolveDir: app, contents: `
      import React from 'react'; import {createRoot} from 'react-dom/client';
      import CalendarBoard from './src/components/CalendarBoard';
      const now=new Date(), y=now.getFullYear(),m=String(now.getMonth()+1).padStart(2,'0');
      const propiedades=[{id:'a',slug:'casa-a',title:'Casa de prueba con nombre largo en Nuevo Vallarta'},{id:'b',slug:'casa-b',title:'Segunda casa'}];
      const bookings=[{propertyId:'a',start:y+'-'+m+'-15',end:y+'-'+m+'-18',source:'airbnb',guestName:'Ana',manualBlock:false,ownBlock:false}];
      createRoot(document.getElementById('root')).render(<div style={{padding:16}}><CalendarBoard propiedades={propiedades} bookings={bookings} canSync={location.search.includes('admin=1')}/></div>);
    ` },
    bundle: true, write: false, outdir: 'out', platform: 'browser', format: 'iife',
    define: { 'process.env.NODE_ENV': '"development"' },
    plugins: [{ name: 'qa-shims', setup(b) {
      b.onResolve({ filter: /^next\/image$/ }, () => ({ path: 'image', namespace: 'qa' }));
      b.onResolve({filter:/^@\/i18n\/navigation$/},()=>({path:'router',namespace:'qa'}));
      b.onResolve({ filter: /^next-intl$/ }, () => ({ path: 'intl', namespace: 'qa' }));
      b.onResolve({ filter: /^@\/lib\/editorial-presentation$/ }, () => ({ path: path.join(app, 'src/lib/editorial-presentation.ts') }));
      b.onLoad({ filter: /.*/, namespace: 'qa' }, a => ({ loader: 'jsx', resolveDir: app, contents: a.path === 'router' ? `export function useRouter(){return {refresh(){}};}` : a.path === 'image' ?
        `import React from 'react';export default function Image({fill,unoptimized,sizes,...props}){return <img {...props} style={fill?{position:'absolute',width:'100%',height:'100%',objectFit:'cover'}:{}}/>;}` :
        `export function useLocale(){return 'es';}const messages=${JSON.stringify(messages)};export function useTranslations(namespace){return(key,values={})=>{
          let result=(namespace+'.'+key).split('.').reduce((v,k)=>v[k],messages);for(const[k,v]of Object.entries(values))result=result.replaceAll('{'+k+'}',String(v));return result;};}` }));
    } }],
  });
  const js = build.outputFiles.find(f => f.path.endsWith('.js')).text;
  const css = build.outputFiles.find(f => f.path.endsWith('.css'))?.text || '';
  const chunks = path.join(app, '.next/dev/static/chunks');
  const globalPath = fs.readdirSync(chunks).find(file => file.startsWith('apps_web_src_app_globals_') && file.endsWith('.css'));
  if (!globalPath) throw new Error('Se necesita CSS local existente de pnpm dev; este script no inicia Next ni conecta a BD.');
  const global = fs.readFileSync(path.join(chunks, globalPath), 'utf8');
  http.createServer((request, response) => {
    if (request.url === '/bundle.js') { response.setHeader('Content-Type', 'text/javascript'); return response.end(js); }
    if (request.url.startsWith('/photo/')) {
      const nums = request.url.split('/').slice(2).map(Number); response.setHeader('Content-Type', 'image/svg+xml');
      return response.end(`<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000"><rect width="1600" height="1000" fill="hsl(${nums[0]*70+nums[1]*15} 45% 40%)"/><circle cx="800" cy="450" r="260" fill="white" opacity=".2"/><text x="600" y="400" font-size="100" fill="white">${nums.join(' / ')}</text></svg>`);
    }
    response.setHeader('Content-Type', 'text/html; charset=utf-8');
    response.end(`<!doctype html><html class="${request.url.includes('dark=1')?'dark':'light'}"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${global}\n${css}${request.url.includes('reduced=1')?'\n[class*=photo]{transition:none!important}':''}</style><body><div id="root"></div><script src="/bundle.js"></script></body></html>`);
  }).listen(3100, '127.0.0.1', () => console.log('QA Calendario http://127.0.0.1:3100 — datos simulados, sin Neon. ?admin=1 / ?dark=1'));
}
main().catch(error => { console.error(error); process.exitCode = 1; });
