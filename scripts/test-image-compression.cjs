// Compresión real con canvas/decoder simulados; sin red, Blob ni Neon.
const assert=require('node:assert/strict');
const {load,memory}=require('./test-property-access.cjs');
const {optimizePhoto,photoCompression,photoMetadata}=load('apps/web/src/lib/photo-upload.ts');
const native={bitmap:global.createImageBitmap,document:global.document,Image:global.Image,createURL:URL.createObjectURL,revokeURL:URL.revokeObjectURL};
let dimensions={width:6000,height:4000},closed=0,draws=[],decode=[],encodes=[],outputBytes=450_000,nullBlob=false,invalidType=false;
global.createImageBitmap=async(file,options)=>{decode.push(options);return {...dimensions,close(){closed++;}};};
global.document={createElement:()=>{
  const canvas={width:0,height:0,getContext:()=>({fillRect(){},drawImage:(source,x,y,w,h)=>draws.push({w,h})}),
    toBlob:(callback,type,quality)=>{encodes.push({type,quality});callback(nullBlob?null:new Blob([new Uint8Array(outputBytes)],{type:invalidType?'image/png':type}));}};
  return canvas;
}};
const file=(size,name='Cámara vertical.PNG',type='image/png')=>new File([new Uint8Array(size)],name,{type,lastModified:123});
async function main(){
  for(const size of [999_999,1_000_000]){const original=file(size);assert.equal((await optimizePhoto(original)).file,original);}
  for(const mime of ['video/mp4','application/pdf','image/gif']){const original=file(8_000_000,'file',mime);assert.equal((await optimizePhoto(original)).file,original);}
  assert.equal(decode.length,0);
  const original=file(8_200_000);const optimized=await optimizePhoto(original);
  assert.ok(optimized.optimized);assert.equal(optimized.file.size,450_000);assert.equal(optimized.file.type,'image/jpeg');
  assert.equal(optimized.file.name,'Camara_vertical.jpg');assert.equal(optimized.file.lastModified,123);
  assert.deepEqual(decode.at(-1),{imageOrientation:'from-image'});assert.deepEqual(draws.at(-1),{w:1920,h:1280});
  assert.deepEqual(encodes.at(-1),{type:'image/jpeg',quality:0.82});assert.equal(closed,1);
  dimensions={width:3000,height:6000};await optimizePhoto(file(8_000_000));assert.deepEqual(draws.at(-1),{w:960,h:1920});
  dimensions={width:640,height:480};await optimizePhoto(file(2_000_000));assert.deepEqual(draws.at(-1),{w:640,h:480});
  const named=await optimizePhoto(file(2_000_000,'../ weird Cámara!.webp','image/webp'));assert.equal(named.file.name,'weird_Camara.jpg');
  nullBlob=true;assert.equal((await optimizePhoto(original)).file,original);nullBlob=false;
  invalidType=true;assert.equal((await optimizePhoto(original)).file,original);invalidType=false;
  outputBytes=9_000_000;assert.equal((await optimizePhoto(original)).file,original);
  outputBytes=4_000_001;const tooLarge=await optimizePhoto(original);assert.throws(()=>photoMetadata(tooLarge.file.type,tooLarge.file.size),e=>e.code==='INVALID_FILE_SIZE');
  outputBytes=450_000;
  let revoked=0;URL.createObjectURL=()=> 'blob:local-test';URL.revokeObjectURL=()=>{revoked++;};
  global.createImageBitmap=async()=>{throw new Error('decode unsupported');};
  global.Image=class{style={};naturalWidth=900;naturalHeight=1600;set src(value){this.onload();}};
  assert.ok((await optimizePhoto(original)).optimized);assert.deepEqual(draws.at(-1),{w:900,h:1600});assert.equal(revoked,1);
  global.createImageBitmap=undefined;assert.ok((await optimizePhoto(original)).optimized);assert.equal(revoked,2);
  global.Image=class{style={};set src(value){this.onerror();}};
  assert.equal((await optimizePhoto(original)).file,original);assert.equal(revoked,3);
  assert.throws(()=>photoMetadata(original.type,original.size),e=>e.code==='INVALID_FILE_SIZE');
  assert.equal(photoCompression.thresholdBytes,1_000_000);
  memory.close();console.log('OK compresión: umbral, orientación solicitada, 1920px/no upscale, JPEG/nombre/calidad, fallback/cleanup y validación final 4MB.');
}
main().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>{global.createImageBitmap=native.bitmap;global.document=native.document;global.Image=native.Image;URL.createObjectURL=native.createURL;URL.revokeObjectURL=native.revokeURL;});
