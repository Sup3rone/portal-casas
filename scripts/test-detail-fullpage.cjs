const assert = require('node:assert/strict');
const { load, memory } = require('./test-property-access.cjs');
const { attachFullpageNavigation } = load('apps/web/src/components/EditorialPresentation.tsx');
const native = { document:global.document, window: global.window, Element: global.Element, setTimeout: global.setTimeout, clearTimeout: global.clearTimeout, now: Date.now };
const listeners = () => { const handlers = new Map(); return { handlers, addEventListener: (key, fn) => handlers.set(key, fn), removeEventListener: key => handlers.delete(key) }; };
let clock = 1000, timerId = 0, timers = new Map(), heights = [720, 720, 720], footer = 0;
const mobile = { matches: false }, motion = { matches: false }, calls = [];
class Target { constructor(protectedControl = false) { this.protectedControl = protectedControl; } closest(selector) { return selector.startsWith('input') && this.protectedControl ? this : null; } }
const target = new Target();
const container = { ...listeners(), clientHeight: 720, scrollTop: 0,
  getBoundingClientRect: () => ({ top: -global.window.scrollY }),
  querySelector: () => null, querySelectorAll: () => sections,
  parentElement: { querySelector: () => ({ scrollIntoView: () => { footer++; } }) },
  scrollTo() { assert.fail('El contenedor no debe scrollear'); }
};
const sections = heights.map((_, index) => ({ getBoundingClientRect: () => ({ top: heights.slice(0, index).reduce((a,b)=>a+b,0) - global.window.scrollY, height: heights[index], bottom: heights.slice(0,index+1).reduce((a,b)=>a+b,0) - global.window.scrollY }) }));
function wheel(deltaY, extra = {}) { let prevented = false; container.handlers.get('wheel')({ target, deltaY, deltaX:0, deltaMode:0, ctrlKey:false, preventDefault(){prevented=true;}, ...extra }); return prevented; }
function settle() { for (const [id, fn] of [...timers]) { timers.delete(id); fn(); } }
try {
  global.document = {documentElement:{classList:{contains:()=>false}}};
  global.Element = Target; Date.now = () => clock;
  global.setTimeout = fn => { const id = ++timerId; timers.set(id,fn); return id; }; global.clearTimeout = id => timers.delete(id);
  global.window = { ...listeners(), innerHeight:720, scrollY:0, matchMedia: () => mobile, scrollTo(options){calls.push(options);this.scrollY=options.top;} };
  let dispose = attachFullpageNavigation(container, motion);
  assert.ok(wheel(120)); assert.equal(calls.at(-1).top,720);
  wheel(120); settle(); clock += 50; wheel(120); assert.equal(calls.length,1,'Inercia del mismo gesto no salta otra escena');
  clock += 250; wheel(120); assert.equal(calls.at(-1).top,1440);
  settle(); clock+=250; wheel(120); assert.equal(footer,1,'Footer exterior alcanzable');
  clock+=250;motion.matches=true;wheel(-120);assert.equal(calls.at(-1).top,720);assert.equal(calls.at(-1).behavior,'auto');
  settle(); assert.equal(wheel(120,{ctrlKey:true}),false,'Zoom del navegador libre');
  assert.equal(wheel(120,{target:new Target(true)}),false,'Input/iframe/modal no se interceptan');
  assert.equal(wheel(20,{deltaX:100}),false,'Gesto horizontal libre');
  dispose(); assert.equal(container.handlers.size,0);assert.equal(global.window.handlers.size,0);
  motion.matches=false;global.window.scrollY=0;container.scrollTop=0;dispose=attachFullpageNavigation(container,motion);
  container.handlers.get('touchstart')({target,touches:[{clientX:0,clientY:200}]});
  let prevented=false;container.handlers.get('touchmove')({touches:[{clientX:0,clientY:100}],preventDefault(){prevented=true;}});
  container.handlers.get('touchend')({changedTouches:[{clientX:0,clientY:50}]});assert.ok(prevented);assert.equal(global.window.scrollY,720);assert.equal(container.scrollTop,0);
  const before=calls.length;container.handlers.get('touchstart')({target,touches:[{clientX:200,clientY:100}]});
  container.handlers.get('touchend')({changedTouches:[{clientX:20,clientY:105}]});assert.equal(calls.length,before,'Swipe horizontal no cambia escena');
  dispose(); mobile.matches=true;heights=[1000,720,720];global.window.scrollY=0;container.scrollTop=0;clock+=250;
  dispose=attachFullpageNavigation(container,motion);
  assert.equal(wheel(120),false,'Escena larga admite scroll natural');
  global.window.scrollY=720;clock+=250;wheel(120);assert.equal(global.window.scrollY,1000,'Al salir del contenido largo llega al inicio siguiente');
  settle();clock+=250;wheel(120);assert.equal(global.window.scrollY,1720,'Una escena móvil que cabe avanza completa');
  // Reserva libre incluso si cabe; ningún gesto salta al footer ni a otra escena.
  sections[2].id='reservar';global.window.scrollY=1720;settle();clock+=250;
  const callsBeforeFree=calls.length;
  assert.equal(wheel(120),false,'Reserva no intercepta rueda hacia footer');
  assert.equal(wheel(-120),false,'Reserva no intercepta rueda hacia arriba');
  container.handlers.get('touchstart')({target,touches:[{clientX:0,clientY:200}]});
  let freePrevented=false;
  container.handlers.get('touchmove')({touches:[{clientX:0,clientY:100}],preventDefault(){freePrevented=true;}});
  container.handlers.get('touchend')({changedTouches:[{clientX:0,clientY:50}]});
  assert.equal(freePrevented,false);assert.equal(calls.length,callsBeforeFree);
  global.window.scrollY=0;clock+=250;assert.equal(wheel(120),false,'Contenido largo anterior sigue natural');
  heights=[720,720,720];global.window.scrollY=0;clock+=250;
  assert.equal(wheel(120),true,'Volver a escenas anteriores recupera fullpage');
  assert.equal(global.window.scrollY,720);
  settle();clock+=250;
  assert.equal(wheel(120),true,'Mapa completo conserva avance fullpage hacia reserva');
  assert.equal(global.window.scrollY,1440);
  settle();clock+=250;assert.equal(wheel(120),false,'Dentro de reserva continúa libre hasta footer');
  global.window.scrollY=0;global.document.documentElement.classList.contains=()=>true;clock+=250;
  assert.equal(wheel(120),false,'Ancla en navegación no se intercepta aunque todavía atraviese slides');
  delete sections[2].id;
  dispose();assert.equal(timers.size,0);
  console.log('OK fullpage: un gesto/inercia, swipe, footer, controles protegidos, reduced-motion, excepción móvil natural y cleanup. Sin BD/red.');
} finally { global.document=native.document;global.window=native.window;global.Element=native.Element;global.setTimeout=native.setTimeout;global.clearTimeout=native.clearTimeout;Date.now=native.now;memory.close(); }
