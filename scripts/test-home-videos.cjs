// T-4679: lista de videos del hero — parseo/validación y alternancia de dos <video> en loop.
const assert = require('node:assert/strict');
const { load, req, memory, mockModule } = require('./test-property-access.cjs');
const React = req('react');
let effect; mockModule('react', { ...React, useEffect: fn => { effect = fn; } });
const lib = load('apps/web/src/lib/home-videos.ts');
const Motion = load('apps/web/src/components/HomeVideoMotion.tsx').default;

// Parseo y lista efectiva
assert.deepEqual(lib.parseHomeVideos(''), []);
assert.equal(lib.parseHomeVideos('[{"url":"https://a.test/1.mp4","device":"phone"}]'), null);
assert.equal(lib.serializeHomeVideos([]), '');
assert.deepEqual(lib.effectiveHomeVideos('', ''), [{ url: '/videos/hero.mp4', device: 'all' }]);
assert.deepEqual(lib.effectiveHomeVideos('', 'https://a.test/old.mp4'), [{ url: 'https://a.test/old.mp4', device: 'all' }], 'Sin lista: video anterior');
assert.deepEqual(lib.videosForViewport([{ url: 'https://a.test/d.mp4', device: 'desktop' }], false), [{ url: '/videos/hero.mp4', device: 'all' }], 'Viewport sin videos usa el respaldo');

function player(name) {
  const handlers = {};
  return {
    name, src: '', loop: true, autoplay: true, preload: 'none', currentTime: 0, duration: 10, networkState: 1, style: {}, loads: 0, plays: 0, paused: true,
    load() { this.loads++; }, play() { this.plays++; this.paused = false; return Promise.resolve(); }, pause() { this.paused = true; },
    addEventListener(n, fn) { (handlers[n] ||= []).push(fn); }, removeEventListener(n, fn) { handlers[n] = (handlers[n] || []).filter(h => h !== fn); },
    fire(n) { for (const fn of [...(handlers[n] || [])]) fn({ currentTarget: this }); }, count(n) { return (handlers[n] || []).length; },
  };
}
function mount({ reduced = false, desktop = true, videos }) {
  const a = player('a'), b = player('b');
  global.document = { getElementById: id => id === 'home-background-video' ? a : id === 'home-background-video-next' ? b : null };
  global.window = { matchMedia: q => ({ matches: q.includes('reduce') ? reduced : desktop, addEventListener() {}, removeEventListener() {} }) };
  Motion({ videos });
  return { a, b, cleanup: effect() };
}
const list = [{ url: 'https://a.test/playa.mp4', device: 'all' }, { url: 'https://a.test/nuevo.mp4', device: 'all' }, { url: 'https://a.test/movil.mp4', device: 'mobile' }];

(async () => {
  try {
    // Escritorio: playa → nuevo → playa, sin el de móvil.
    const { a, b, cleanup } = mount({ videos: list });
    assert.equal(a.loop, false); assert.equal(b.loop, false); assert.equal(a.autoplay, false, 'Sin autoplay: precargar no reproduce'); assert.equal(b.autoplay, false); assert.equal(a.plays, 1); assert.equal(b.style.opacity, '0');
    a.currentTime = 4; a.fire('timeupdate'); assert.equal(b.src, '', 'No precarga antes de la mitad');
    a.currentTime = 6; a.fire('timeupdate'); assert.equal(b.src, 'https://a.test/nuevo.mp4'); assert.equal(b.preload, 'auto'); assert.equal(b.loads, 1);
    a.fire('timeupdate'); assert.equal(b.loads, 1, 'Precarga una sola vez');
    b.fire('ended'); assert.equal(b.plays, 0, 'El ended del oculto no cambia de video');
    a.fire('ended'); assert.equal(b.plays, 1); assert.equal(a.style.opacity, '1', 'No oculta antes de que el siguiente reproduzca');
    b.fire('playing'); assert.equal(b.style.opacity, '1'); assert.equal(a.style.opacity, '0'); assert.ok(a.paused);
    b.currentTime = 6; b.fire('timeupdate'); assert.equal(a.src, 'https://a.test/playa.mp4', 'Loop vuelve al primero');
    b.fire('ended'); a.fire('playing'); assert.equal(a.style.opacity, '1'); assert.equal(b.style.opacity, '0');
    // Un video que falla se salta: el actual se repite.
    a.currentTime = 6; a.fire('timeupdate'); b.fire('error'); const before = b.plays; a.fire('ended');
    assert.equal(b.plays, before, 'No reproduce el que falló'); assert.equal(a.currentTime, 0); assert.equal(a.style.opacity, '1');
    cleanup(); assert.equal(a.count('ended') + b.count('ended') + a.count('timeupdate'), 0, 'Cleanup');

    // Móvil: playa, nuevo y el de móvil (3 videos).
    const m = mount({ desktop: false, videos: list });
    for (const expected of ['https://a.test/nuevo.mp4', 'https://a.test/movil.mp4']) {
      const [cur, next] = m.a.style.opacity === '1' ? [m.a, m.b] : [m.b, m.a];
      cur.currentTime = 6; cur.fire('timeupdate'); assert.equal(next.src, expected); cur.fire('ended'); next.fire('playing');
    }
    m.cleanup();

    // Reduced-motion: nada se reproduce, ni siquiera al cambiar de video.
    const r = mount({ reduced: true, videos: list });
    assert.equal(r.a.plays + r.b.plays, 0); r.a.currentTime = 6; r.a.fire('timeupdate'); r.a.fire('ended');
    assert.equal(r.a.plays + r.b.plays, 0); r.cleanup();

    // Un solo video para el viewport: sin segundo reproductor, comportamiento anterior (loop nativo).
    const single = mount({ videos: [list[0], list[2]] });
    assert.equal(single.a.loop, true); assert.equal(single.b.src, ''); assert.equal(single.a.count('ended'), 0); single.cleanup();

    console.log('OK videos del hero: parseo, lista efectiva, respaldo por viewport, precarga a la mitad, alternancia en ended, loop, salto por error, reduced-motion, un solo video y cleanup.');
  } finally { memory.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
