// T-4682: lerp y parallax del hero — inercia, reposo, reduced-motion, móvil y cleanup.
const assert = require('node:assert/strict');
const { load, req, memory, mockModule } = require('./test-property-access.cjs');
const React = req('react');
let effect; mockModule('react', { ...React, useEffect: fn => { effect = fn; } });
const { lerp, frameFactor, approach } = load('apps/web/src/lib/lerp.ts');
const Parallax = load('apps/web/src/components/HomeHeroParallax.tsx');

// Utilidad
assert.equal(lerp(0, 100, 0), 0); assert.equal(lerp(0, 100, 1), 100); assert.equal(lerp(10, 20, 0.5), 15);
assert.ok(Math.abs(frameFactor(0.12, 1000 / 60) - 0.12) < 1e-9, 'A 60 Hz avanza el factor nominal');
assert.ok(frameFactor(0.12, 2000 / 60) > 0.12, 'A 30 Hz compensa con más avance por fotograma');
assert.equal(frameFactor(0.12, 5000), frameFactor(0.12, 100), 'Saltos largos (pestaña oculta) se acotan');
assert.equal(approach(99.99, 100, 0.1), 100, 'Llega exacto al destino y permite detener la animación');

function el() { return { style: { transform: '', opacity: '', willChange: '' } }; }
function mount({ reduced = false, desktop = true, scrollY = 0, withVideo = true } = {}) {
  const media = el(), h1 = el(), h2 = el(), listeners = {}, motionListeners = [];
  const hero = { offsetHeight: 800, querySelectorAll: () => [h1, h2] };
  const frames = [];
  const motion = { matches: reduced, addEventListener: (_, fn) => motionListeners.push(fn), removeEventListener: (_, fn) => motionListeners.splice(motionListeners.indexOf(fn), 1) };
  global.document = { querySelector: () => hero, getElementById: () => withVideo ? { parentElement: media } : null };
  global.window = {
    scrollY, innerHeight: 800,
    matchMedia: q => q.includes('reduce') ? motion : { matches: desktop },
    addEventListener: (n, fn) => { listeners[n] = fn; }, removeEventListener: n => { delete listeners[n]; },
    requestAnimationFrame: fn => { frames.push(fn); return frames.length; }, cancelAnimationFrame: () => { frames.length = 0; },
  };
  Parallax.default();
  const cleanup = effect();
  let now = 0;
  const run = (count = 1000) => { for (let i = 0; i < count && frames.length; i++) { now += 1000 / 60; frames.shift()(now); } };
  return { media, h1, h2, listeners, frames, run, cleanup, motion, motionListeners, scroll: y => { window.scrollY = y; listeners.scroll(); } };
}

// Escritorio: el video baja al 25 % del scroll y el título al 35 %, con inercia.
const d = mount();
assert.ok(d.listeners.scroll && d.listeners.resize, 'Escucha scroll y resize');
d.scroll(400); assert.equal(d.frames.length, 1, 'Un solo rAF por movimiento'); d.listeners.scroll(); assert.equal(d.frames.length, 1, 'No duplica rAF');
d.run(1); const first = parseFloat(d.media.style.transform.match(/, ([\d.]+)px/)[1]);
assert.ok(first > 0 && first < 100, 'Primer fotograma solo avanza una fracción (inercia)');
assert.equal(d.media.style.willChange, 'transform');
d.run(); assert.equal(d.frames.length, 0, 'Se detiene en reposo');
assert.equal(d.media.style.transform, 'translate3d(0, 100.00px, 0)'); assert.equal(d.h1.style.transform, 'translate3d(0, 140.00px, 0)');
assert.equal(d.h2.style.opacity, String(1 - 0.5 * 0.6)); assert.equal(d.media.style.willChange, '', 'Libera will-change al terminar');
d.scroll(5000); d.run(); assert.equal(d.media.style.transform, 'translate3d(0, 200.00px, 0)', 'Más allá del hero queda fijo');
d.cleanup(); assert.ok(!d.listeners.scroll); assert.equal(d.media.style.transform, '', 'Cleanup restaura'); assert.equal(d.h1.style.opacity, '');

// Móvil: desplazamiento menor.
const m = mount({ desktop: false }); m.scroll(400); m.run();
assert.equal(m.media.style.transform, 'translate3d(0, 48.00px, 0)'); assert.equal(m.h1.style.transform, 'translate3d(0, 80.00px, 0)'); m.cleanup();

// Reduced-motion: no escucha ni transforma; al cambiar la preferencia en vivo se apaga.
const r = mount({ reduced: true, scrollY: 300 });
assert.ok(!r.listeners.scroll); assert.equal(r.media.style.transform, ''); assert.equal(r.frames.length, 0);
r.motion.matches = false; r.motionListeners[0](); assert.ok(r.listeners.scroll, 'Se activa si se quita reduced-motion');
r.scroll(200); r.run(3); r.motion.matches = true; r.motionListeners[0]();
assert.ok(!r.listeners.scroll); assert.equal(r.media.style.transform, ''); assert.equal(r.frames.length, 0, 'Se apaga en vivo'); r.cleanup();

// Carga ya desplazada (recargar a mitad de página): sin salto animado.
const s = mount({ scrollY: 400 }); assert.equal(s.media.style.transform, 'translate3d(0, 100.00px, 0)'); assert.equal(s.frames.length, 0); s.cleanup();

// Sin video (HOME_HERO_MEDIA_ENABLED=false): solo el título.
const t = mount({ withVideo: false }); t.scroll(400); t.run(); assert.equal(t.h1.style.transform, 'translate3d(0, 140.00px, 0)'); t.cleanup();

console.log('OK parallax hero: lerp/frameFactor/approach, inercia, un rAF, reposo y will-change, tope en el hero, móvil, reduced-motion inicial y en vivo, carga desplazada, sin video y cleanup.');
memory.close();
