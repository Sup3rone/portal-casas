// Comparación en navegador del formulario anterior y corregido, sin red externa ni BD.
const fs = require('node:fs'), path = require('node:path'), http = require('node:http');
const { createRequire } = require('node:module');
const app = path.resolve(__dirname, '../apps/web');
const dbRequire = createRequire(path.resolve(__dirname, '../packages/db/package.json'));
const esbuild = createRequire(dbRequire.resolve('tsx'))('esbuild');
async function main() {
  const original = fs.readFileSync(path.join(app, 'src/components/panel/PropertyForm.tsx'), 'utf8')
    .replace("key={`${key}:${property?.[key] ?? ''}`} ", '');
  const result = await esbuild.build({
    stdin: { loader: 'jsx', resolveDir: app, contents: `
      import React,{useState} from 'react'; import {createRoot} from 'react-dom/client';
      import Fixed from './src/components/panel/PropertyForm'; import Original from 'original';
      function QA(){const [property,setProperty]=useState({id:'qa',maxGuests:4,bathrooms:1.5,bedrooms:2});
        return <><h1>QA sin BD: escribe en los campos y pulsa Actualizar datos</h1>
          <button onClick={()=>setProperty({...property,maxGuests:9,bathrooms:4.5,bedrooms:4})}>Actualizar datos</button>
          <section id="original"><h2>Anterior</h2><Original property={property}/></section>
          <section id="fixed"><h2>Corregido</h2><Fixed property={property}/></section></>;}
      createRoot(document.getElementById('root')).render(<QA/>);` },
    bundle: true, write: false, format: 'iife', jsx: 'automatic', plugins: [{ name: 'qa', setup(build) {
      build.onResolve({ filter: /^original$/ }, () => ({ path: 'original', namespace: 'qa' }));
      build.onLoad({ filter: /.*/, namespace: 'qa' }, () => ({ contents: original, loader: 'tsx', resolveDir: path.join(app, 'src/components/panel') }));
      build.onResolve({ filter: /^next-intl$|^@\/i18n\/navigation$/ }, args => ({ path: args.path, namespace: 'stub' }));
      build.onLoad({ filter: /.*/, namespace: 'stub' }, () => ({ contents: 'export const useTranslations=()=>key=>key; export const useRouter=()=>({push(){},refresh(){}});', loader: 'js' }));
    } }]
  });
  const server = http.createServer((request, response) => {
    response.setHeader('Content-Type', request.url === '/qa.js' ? 'text/javascript' : 'text/html');
    response.end(request.url === '/qa.js' ? result.outputFiles[0].text : '<!doctype html><div id="root"></div><script src="/qa.js"></script>');
  });
  server.listen(3103, '127.0.0.1', () => console.log('QA PropertyForm: http://127.0.0.1:3103 — sin Neon'));
}
main().catch(error => { console.error(error); process.exitCode = 1; });
