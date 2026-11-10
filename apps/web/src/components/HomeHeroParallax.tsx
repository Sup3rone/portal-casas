'use client';
import { useEffect } from 'react';
import { approach, frameFactor } from '@/lib/lerp';

// T-4682: parallax suave del hero de la home. Se engancha al marcado existente
// (capa del video y títulos) sin cambiarlo. El video baja más lento que la página
// y el título un poco más, con inercia por lerp en cada fotograma. Solo trabaja
// mientras hay movimiento pendiente; con reduced-motion no hace nada.
export const heroParallax = {
  desktop: { media: 0.25, title: 0.35 },
  mobile: { media: 0.12, title: 0.2 },
  smoothing: 0.12,
  fade: 0.6,
};

export default function HomeHeroParallax() {
  useEffect(() => {
    const hero = document.querySelector<HTMLElement>('[data-home-hero]');
    const media = document.getElementById('home-background-video')?.parentElement ?? null;
    const titles = hero ? Array.from(hero.querySelectorAll<HTMLElement>('h1, h2')) : [];
    if (!hero || (!media && !titles.length)) return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const desktop = window.matchMedia('(min-width: 768px)');
    let current = 0, target = 0, frame = 0, last = 0, active = false;

    function paint(offset: number) {
      const speed = desktop.matches ? heroParallax.desktop : heroParallax.mobile;
      const height = hero!.offsetHeight || window.innerHeight || 1;
      if (media) media.style.transform = offset ? `translate3d(0, ${(offset * speed.media).toFixed(2)}px, 0)` : '';
      for (const title of titles) {
        title.style.transform = offset ? `translate3d(0, ${(offset * speed.title).toFixed(2)}px, 0)` : '';
        title.style.opacity = offset ? String(1 - Math.min(offset / height, 1) * heroParallax.fade) : '';
      }
    }
    function tick(now: number) {
      current = approach(current, target, frameFactor(heroParallax.smoothing, last ? now - last : 1000 / 60));
      last = now;
      paint(current);
      frame = current === target ? 0 : window.requestAnimationFrame(tick);
      if (!frame) { last = 0; for (const element of [media, ...titles]) if (element) element.style.willChange = ''; }
    }
    function onScroll() {
      // Más allá del hero el valor queda fijo y la animación se detiene sola.
      target = Math.min(Math.max(window.scrollY, 0), hero!.offsetHeight || window.innerHeight);
      if (!frame && target !== current) {
        for (const element of [media, ...titles]) if (element) element.style.willChange = 'transform';
        frame = window.requestAnimationFrame(tick);
      }
    }
    function start() {
      if (active) return;
      active = true;
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll, { passive: true });
      current = target = Math.min(Math.max(window.scrollY, 0), hero!.offsetHeight || window.innerHeight);
      paint(current);
    }
    function stop() {
      active = false;
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
      frame = 0; last = 0; current = target = 0;
      paint(0);
      for (const element of [media, ...titles]) if (element) element.style.willChange = '';
    }
    function onMotionChange() { if (motion.matches) stop(); else start(); }
    motion.addEventListener('change', onMotionChange);
    if (!motion.matches) start();
    return () => { motion.removeEventListener('change', onMotionChange); stop(); };
  }, []);
  return null;
}
