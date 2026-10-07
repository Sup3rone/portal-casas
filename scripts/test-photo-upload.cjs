// Endpoint y API Media reales, SDK mockeado; sin Blob/Neon ni secretos.
const assert = require('node:assert/strict'), fs = require('node:fs');
const { load, memory, req, mockModule, setSession, setLocale } = require('./test-property-access.cjs');
const sdk = req('@vercel/blob/client');
const { createRequire } = require('node:module');
const sdkRequire = createRequire(req.resolve('@vercel/blob/client'));
const { MockAgent, getGlobalDispatcher, setGlobalDispatcher } = sdkRequire('undici');
const issued = [];
let failSDK = false;
mockModule('@vercel/blob/client', {
  handleUpload: async options => {
    if (failSDK) throw new Error('SDK error containing private configuration');
    const payload = options.body.payload;
    return sdk.handleUpload({ ...options, token:'vercel_blob_rw_teststore_offline-test-secret',
      onBeforeGenerateToken: async (...args) => {
        const policy = await options.onBeforeGenerateToken(...args);
        issued.push({ pathname: payload.pathname, policy });
        return policy;
      },
    });
  },
  upload: async () => { throw new Error('No network upload in SSR'); },
});
const route = load('apps/web/src/app/api/properties/[id]/upload/route.ts');
const mediaRoute = load('apps/web/src/app/api/properties/[id]/[resource]/route.ts');
const { photoPath, maxPhotoBytes } = load('apps/web/src/lib/photo-upload.ts');
const uuid = '2f3e4d5c-6789-4abc-8def-0123456789ab';
const input = (id='pa',contentType='image/jpeg',size=1000) => ({type:'blob.generate-client-token',payload:{pathname:photoPath(id,uuid,contentType),multipart:false,clientPayload:JSON.stringify({contentType,size})}});
const request = body => new Request('http://localhost/test',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
const context = id => ({params:Promise.resolve({id})});
async function main() {
  for(const [actor,status] of [[null,401],['client',403],['viewer',403],['b',404]]){
    setSession(actor?{user:{id:actor}}:null);
    assert.equal((await route.POST(request(input()),context('pa'))).status,status);
  }
  assert.equal(issued.length,0);
  setSession({user:{id:'a'}});
  for(const [body,code] of [[input('pa','application/pdf'), 'INVALID_FILE_TYPE'],[input('pa','image/jpeg',maxPhotoBytes+1),'INVALID_FILE_SIZE'],[input('pa','image/jpeg',0),'INVALID_FILE_SIZE'],[input('pb'),'INVALID_UPLOAD_PATH']]){
    const response=await route.POST(request(body),context('pa'));
    assert.equal(response.status,400);assert.equal((await response.json()).code,code);
  }
  for(const body of [null, {type:'blob.upload-completed'}, {...input(),payload:{...input().payload,multipart:true}}, {...input(),payload:{...input().payload,clientPayload:'bad-json'}}])assert.equal((await route.POST(request(body),context('pa'))).status,400);
  assert.equal(issued.length,0);
  for(const mime of ['image/jpeg','image/png','image/webp']){
    const response=await route.POST(request(input('pa',mime,maxPhotoBytes)),context('pa'));
    assert.equal(response.status,200);assert.equal(response.headers.get('Cache-Control'),'no-store');
    const { clientToken } = await response.json();
    assert.ok(clientToken.startsWith('vercel_blob_client_teststore_'));
    const tokenPayload = sdk.getPayloadFromClientToken(clientToken);
    assert.equal(tokenPayload.pathname,input('pa',mime).payload.pathname);
    assert.equal(tokenPayload.maximumSizeInBytes,maxPhotoBytes);
    const policy=issued.at(-1).policy;
    assert.deepEqual(policy.allowedContentTypes,[mime]);assert.equal(policy.maximumSizeInBytes,maxPhotoBytes);
    assert.equal(policy.allowOverwrite,false);assert.equal(policy.addRandomSuffix,false);
    assert.ok(policy.validUntil>Date.now()&&policy.validUntil<=Date.now()+300000);
  }
  // Transporte SDK real: POST autorizado → PUT oficial → URL pública del store.
  // MockAgent impide cualquier conexión real, no solo las peticiones esperadas.
  const tokenResponse=await route.POST(request(input()),context('pa'));
  const tokenBody=await tokenResponse.json();
  const dispatcher=getGlobalDispatcher(), mockAgent=new MockAgent();mockAgent.disableNetConnect();setGlobalDispatcher(mockAgent);
  let result;
  const pathname=input().payload.pathname;
  const expectedUrl='https://teststore.public.blob.vercel-storage.com/'+pathname;
  try {
    mockAgent.get('http://localhost:3000').intercept({path:'/api/properties/pa/upload',method:'POST'}).reply(200,options=>{
      assert.deepEqual(JSON.parse(String(options.body)),input());return tokenBody;
    });
    mockAgent.get('https://vercel.com').intercept({path:'/api/blob/?pathname='+encodeURIComponent(pathname),method:'PUT'}).reply(200,{
      url:expectedUrl,downloadUrl:expectedUrl+'?download=1',pathname,contentType:'image/jpeg',contentDisposition:'inline',
    });
    result=await sdk.upload(pathname,new Blob(['offline-test'],{type:'image/jpeg'}),{
      access:'public',contentType:'image/jpeg',multipart:false,handleUploadUrl:'http://localhost:3000/api/properties/pa/upload',
      clientPayload:input().payload.clientPayload,
    });
    mockAgent.assertNoPendingInterceptors();
    assert.equal(result.url,expectedUrl);
    assert.equal(new URL(result.url).hostname,'teststore.public.blob.vercel-storage.com');
  } finally { setGlobalDispatcher(dispatcher);await mockAgent.close(); }
  // URL devuelta por upload se guarda por el API existente, PHOTO/categoría/orden.
  const url=result.url;
  const response=await mediaRoute.POST(request({url,category:'habitaciones',order:7}),{params:Promise.resolve({id:'pa',resource:'media'})});
  assert.equal(response.status,201);
  const photo=memory.prepare('SELECT * FROM Media WHERE url=?').get(url);
  assert.equal(photo.type,'PHOTO');assert.equal(photo.category,'habitaciones');assert.equal(photo.order,7);
  setSession({user:{id:'admin'}});assert.equal((await route.POST(request(input('pb')),context('pb'))).status,200);
  failSDK=true;
  const failed=await route.POST(request(input()),context('pa'));
  assert.equal(failed.status,500);assert.deepEqual(await failed.json(),{error:'upload',code:'UPLOAD_FAILED'});
  const Editor=load('apps/web/src/components/panel/ResourceEditor.tsx').default;
  const React=req('react'), {renderToStaticMarkup}=req('react-dom/server'), {NextIntlClientProvider}=req('next-intl');
  for(const locale of ['es','en','fr']){
    setLocale(locale);const messages=JSON.parse(fs.readFileSync('apps/web/messages/'+locale+'.json','utf8'));
    const render=resource=>renderToStaticMarkup(React.createElement(NextIntlClientProvider,{locale,messages,timeZone:'America/Mexico_City'},React.createElement(Editor,{propertyId:'pa',resource,items:[]})));
    const html=render('media');assert.ok(html.includes('name="url"'));assert.ok(html.includes('image/jpeg,image/png,image/webp'));assert.ok(html.includes(messages.photoUpload.hint));
    assert.ok(!render('rates').includes('type="file"'));
  }
  memory.close();console.log('OK upload: 401/403/404, MIME/size/path 400, token 5MB/TTL, admin, Media PHOTO/categoría/orden, error sanitizado y SSR es/en/fr. SDK mock, sin red/Blob/Neon.');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
