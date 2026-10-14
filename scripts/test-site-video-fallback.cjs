const assert=require('node:assert/strict');const {load,req,memory,mockModule}=require('./test-property-access.cjs');const React=req('react');let effect;mockModule('react',{...React,useEffect:fn=>{effect=fn;}});const Motion=load('apps/web/src/components/HomeVideoMotion.tsx').default;
for(const reduced of [false,true]){const handlers={};let loads=0,plays=0;const video={src:'https://example.com/video.mp4',networkState:1,load(){loads++;},play(){plays++;return Promise.resolve();},pause(){},addEventListener(n,fn){handlers[n]=fn;},removeEventListener(n){delete handlers[n];}};global.document={getElementById:()=>video};global.window={matchMedia:()=>({matches:reduced,addEventListener(){},removeEventListener(){}})};Motion();const cleanup=effect();handlers.error();assert.equal(video.src,'/videos/hero.mp4');assert.equal(loads,1);handlers.error();assert.equal(loads,1,'Fallback solo una vez');assert.equal(plays,reduced?0:2);cleanup();assert.ok(!handlers.error);}
let failed=false;
mockModule('react',{...React,useState:()=>[failed,value=>{failed=value;}]});
mockModule('next/image',{__esModule:true,default:()=>null});
const Background=load('apps/web/src/components/SiteListingBackground.tsx').default;
assert.equal(Background({url:''}).props.src,'/images/listado-bg.jpg');
const image=Background({url:'https://example.com/photo.jpg'});
assert.equal(image.props.src,'https://example.com/photo.jpg');
image.props.onError();assert.equal(Background({url:'https://example.com/photo.jpg'}).props.src,'/images/listado-bg.jpg');
console.log('OK video/imagen: fallback de carga, vacío, reduced-motion sin reproducción y cleanup.');memory.close();
