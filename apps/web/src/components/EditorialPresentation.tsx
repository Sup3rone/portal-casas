'use client';
import { PUBLIC_PHOTO_BACKGROUNDS } from '@/lib/public-appearance';

import { useEffect, useRef, useState, type ReactNode, type HTMLAttributes } from 'react';
import Image from 'next/image';
import DeferredDetailImage from './DeferredDetailImage';
import { useTranslations } from 'next-intl';
import { sceneGeometry, sceneProgress, type EditorialSlide } from '@/lib/editorial-presentation';
import styles from './EditorialPresentation.module.css';

const titles = { destino: 'destino', amenidades: 'amenidades', habitaciones: 'habitaciones', lugar: 'enLugar' } as const;

// Una rueda/swipe completo, una escena. No interfiere con zoom ni controles.
export function attachFullpageNavigation(container: HTMLElement, motion: MediaQueryList) {
  const sections = Array.from(container.querySelectorAll<HTMLElement>('[data-detail-section], [data-editorial-flow]'));
  let moving = false, lastWheel = 0, wheelHandled = false, accumulated = 0;
  function viewportTop() { return 0; }
  function indexAtTop() { return Math.max(0, sections.findLastIndex(section => section.getBoundingClientRect().top <= viewportTop() + 2)); }
  function naturalScroll(direction: number) {
    if (document.documentElement.classList.contains('detail-free-scroll')) return true;
    const reservation = sections.find(section => section.id === 'reservar');
    if (reservation && reservation.getBoundingClientRect().top <= window.innerHeight / 2) return true;
    const section = sections[indexAtTop()];
    if (!section) return false;
    const rect = section.getBoundingClientRect(), height = window.innerHeight;
    return rect.height > height + 1 && (direction > 0 ? rect.bottom > viewportTop() + height + 1 : rect.top < viewportTop() - 1);
  }

  let settle: ReturnType<typeof setTimeout> | undefined;
  let touch: { x: number; y: number; native: boolean } | undefined;
  function protectedTarget(target: EventTarget | null) {
    return !(target instanceof Element) || Boolean(target.closest('input, textarea, select, iframe, dialog[open]')) || Boolean(container.querySelector('dialog[open]'));
  }
  function move(direction: number) {
    if (moving || !sections.length) return;
    const top = viewportTop();
    const index = indexAtTop();
    const next = index + direction;
    if (next < 0) return;
    if (next >= sections.length) {
      container.parentElement?.querySelector<HTMLElement>('.detail-footer-flow')?.scrollIntoView({ behavior: motion.matches ? 'auto' : 'smooth', block: 'start' });
      return;
    }
    moving = true;
    window.scrollTo({ top: window.scrollY + sections[next].getBoundingClientRect().top - top, behavior: motion.matches ? 'auto' : 'smooth' });
    clearTimeout(settle); settle = setTimeout(() => { moving = false; }, 900);
  }
  function scroll() {
    if (!moving) return;
    clearTimeout(settle); settle = setTimeout(() => { moving = false; }, 120);
  }
  function wheel(event: WheelEvent) {
    if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY) || protectedTarget(event.target)) return;
    const direction = Math.sign(event.deltaY);
    if (!direction) return;
    const now = Date.now();
    if (now - lastWheel > 180) { accumulated = 0; wheelHandled = false; }
    lastWheel = now;
    if (naturalScroll(direction)) { wheelHandled = true; return; }
    event.preventDefault();
    if (moving || wheelHandled) return;
    accumulated += event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1);
    if (Math.abs(accumulated) >= 40) { wheelHandled = true; move(Math.sign(accumulated)); }
  }
  function start(event: TouchEvent) {
    touch = undefined;
    if (event.touches.length !== 1 || protectedTarget(event.target)) return;
    touch = { x: event.touches[0].clientX, y: event.touches[0].clientY, native: false };
  }
  function drag(event: TouchEvent) {
    if (!touch || event.touches.length !== 1) { touch = undefined; return; }
    const dx = event.touches[0].clientX - touch.x, dy = touch.y - event.touches[0].clientY;
    if (Math.abs(dy) <= Math.abs(dx) || Math.abs(dy) < 8) return;
    if (touch.native || naturalScroll(Math.sign(dy))) { touch.native = true; return; }
    event.preventDefault();
  }
  function end(event: TouchEvent) {
    if (touch && !touch.native && event.changedTouches.length) {
      const dx = event.changedTouches[0].clientX - touch.x, dy = touch.y - event.changedTouches[0].clientY;
      if (Math.abs(dy) >= 40 && Math.abs(dy) > Math.abs(dx)) move(Math.sign(dy));
    }
    touch = undefined;
  }
  function cancel() { touch = undefined; }
  container.addEventListener('wheel', wheel, { passive: false });
  container.addEventListener('touchstart', start, { passive: true });
  container.addEventListener('touchmove', drag, { passive: false });
  container.addEventListener('touchend', end);
  container.addEventListener('touchcancel', cancel);
  window.addEventListener('scroll', scroll, { passive: true });
  return () => {
    clearTimeout(settle);
    container.removeEventListener('wheel', wheel); container.removeEventListener('touchstart', start);
    container.removeEventListener('touchmove', drag); container.removeEventListener('touchend', end);
    container.removeEventListener('touchcancel', cancel);
    window.removeEventListener('scroll', scroll);
  };
}

// Fundido local: nunca ocultar ni reemplazar la imagen original.
export function attachLocalBackgroundFade(sections: HTMLElement[]) {
  // Referencias fuertes a los fondos visitados hasta desmontar el detalle.
  const sources = new Map<HTMLElement, { original: HTMLImageElement; image: HTMLImageElement; ready: Promise<boolean>; cleanup: () => void }>();
  function prepare(section: HTMLElement) {
    const existing = sources.get(section);
    if (existing) return existing;
    const original = section.querySelector<HTMLImageElement>('[data-section-background] img, [data-flow-background] img');
    if (!original) return;
    original.dispatchEvent?.(new Event('detail-image-load'));
    original.loading = 'eager';
    const url = original.dataset?.deferredSrc || original.currentSrc || original.src;
    const image = new window.Image(); image.alt = ''; image.src = url;
    const matchesSource = () => original.src === url || original.getAttribute?.('src') === url;
    let cleanup = () => {};
    const originalReady = original.dataset?.deferredSrc && !matchesSource()
      ? new Promise<void>((resolve, reject) => {
          const loaded = () => { if (!matchesSource()) return; cleanup(); original.decode().then(resolve, reject); };
          const failed = () => { cleanup(); reject(new Error('background load')); };
          cleanup = () => { original.removeEventListener('load', loaded); original.removeEventListener('error', failed); };
          original.addEventListener('load', loaded); original.addEventListener('error', failed);
        }) : original.decode();
    const ready = Promise.all([image.decode(), originalReady]).then(() => true, () => false);
    const source = { original, image, ready, cleanup }; sources.set(section, source); return source;
  }
  sections.slice(0, 2).forEach(prepare);
  let current: HTMLElement | undefined, disposed = false, version = 0;
  let timer: ReturnType<typeof setTimeout> | undefined, finish: ReturnType<typeof setTimeout> | undefined;
  let outgoing: HTMLImageElement | undefined, running = false, pending: HTMLElement | undefined;
  async function change(section: HTMLElement) {
    if (disposed || section === current) return;
    if (running) { pending = section; return; }
    const request = ++version, old = current && prepare(current), next = prepare(section);
    if (!next || !old) { current = section; return; }
    if (!(await next.ready) || !(await old.ready) || disposed || request !== version) return;
    // Imagen decodificada anterior sobre la imagen nueva opaca, dentro de SU fondo.
    outgoing = old.image;
    outgoing.className = 'detail-background-outgoing'; outgoing.setAttribute('aria-hidden', 'true');
    outgoing.style.opacity = '1'; outgoing.style.transition = 'none';
    next.original.parentElement!.append(outgoing);
    void outgoing.offsetWidth;
    outgoing.style.transition = ''; outgoing.style.opacity = '0';
    current = section; running = true;
    finish = setTimeout(() => {
      outgoing?.remove(); outgoing = undefined; running = false;
      const queued = pending; pending = undefined; if (queued) void change(queued);
    }, 300);
  }
  return {
    update(section: HTMLElement) {
      prepare(section);
      const index = sections.indexOf(section);
      sections.slice(index + 1, index + 3).forEach(prepare);
      if (section === current && !running) return;
      ++version; pending = undefined; clearTimeout(timer);
      timer = setTimeout(() => { void change(section); }, 80);
    },
    dispose() { disposed = true; ++version; clearTimeout(timer); clearTimeout(finish); outgoing?.remove(); sources.forEach(source => source.cleanup()); },
  };
}

export function DetailSectionTransitions({ children, ...props }: HTMLAttributes<HTMLDivElement>) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const container = root.current;
    if (!container?.matches?.('.detail-fullpage[data-fullpage-enabled="true"]')) return;
    return attachFullpageNavigation(container, window.matchMedia('(prefers-reduced-motion: reduce)'));
  }, []);
  useEffect(() => {
    const container = root.current;
    if (!container) return;
    const sections = Array.from(container.querySelectorAll<HTMLElement>('[data-detail-section], [data-editorial-flow]'));
    if (!sections.length) return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let observer: IntersectionObserver | undefined;
    let fade: ReturnType<typeof attachLocalBackgroundFade> | undefined;
    function configure() {
      observer?.disconnect(); fade?.dispose(); fade = undefined;
      container!.removeAttribute('data-transitions-ready');
      sections.forEach(section => section.removeAttribute('data-section-active'));
      if (motion.matches || typeof IntersectionObserver === 'undefined') return;
      if (container!.matches?.('.detail-fullpage')) fade = attachLocalBackgroundFade(sections);
      let previous: HTMLElement | undefined;
      const visible = new Map<Element, number>();
      observer = new IntersectionObserver(entries => {
        entries.forEach(entry => visible.set(entry.target, entry.isIntersecting ? entry.intersectionRect.height : 0));
        const active = sections.reduce((best, section) => (visible.get(section) || 0) > (visible.get(best) || 0) ? section : best, sections[0]);
        if (active === previous || !(visible.get(active) || 0)) return;
        previous = active; fade?.update(active);
        sections.forEach(section => section.setAttribute('data-section-active', String(section === active)));
        container!.setAttribute('data-transitions-ready', 'true');
      }, { root: null, threshold: Array.from({ length: 21 }, (_, index) => index / 20) });
      sections.forEach(section => observer!.observe(section));
    }
    configure();
    motion.addEventListener('change', configure);
    window.addEventListener('resize', configure);
    return () => {
      observer?.disconnect(); fade?.dispose(); motion.removeEventListener('change', configure);
      window.removeEventListener('resize', configure);
      container.removeAttribute('data-transitions-ready');
      sections.forEach(section => section.removeAttribute('data-section-active'));
    };
  }, []);
  return <div {...props} ref={root}>{children}</div>;
}

export function EditorialScreen({ slide, flow = false }: { slide: EditorialSlide; flow?: boolean }) {
  const t = useTranslations('details'), gallery = useTranslations('details.gallery');
  const count = slide.photos.length;
  const [index, setIndex] = useState(0);
  const active = index % Math.max(1, count);
  const carousel = useRef<HTMLDivElement>(null);
  const interaction = useRef({ hover: false, focus: false, touch: false });
  const touch = useRef({ x: 0, y: 0 });
  useEffect(() => {
    if (count < 2 || typeof IntersectionObserver === 'undefined') return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let visible = false;
    const observer = new IntersectionObserver(entries => { visible = entries.some(entry => entry.isIntersecting); }, { threshold: 0.15 });
    if (carousel.current) observer.observe(carousel.current);
    const timer = window.setInterval(() => {
      if (visible && !motion.matches && !Object.values(interaction.current).some(Boolean)) setIndex(value => (value + 1) % count);
    }, 4000);
    return () => { window.clearInterval(timer); observer.disconnect(); };
  }, [count]);
  function move(delta: number) { setIndex(value => (value + delta + count) % count); }

  return <section className={styles.screen} data-editorial-slide={flow ? slide.section : undefined} aria-label={t(titles[slide.section])}>
    {PUBLIC_PHOTO_BACKGROUNDS && !flow && slide.hero && <div className={styles.backdrop} aria-hidden="true"><Image src={slide.hero.url} alt="" fill unoptimized sizes="100vw" className="object-cover" /></div>}
    <div className={styles.floating} style={!count || !slide.description.trim() ? { gridTemplateColumns: 'minmax(0, 1fr)' } : undefined}>
    {count > 0 && <div className={`${styles.images} glass-panel rounded-2xl p-4 shadow-xl ring-1 ring-white/40 dark:ring-gray-700/50 text-gray-900 dark:text-gray-100`} role="region" aria-label={t('presentation.slideshow', { section: t(titles[slide.section]) })}
      ref={carousel} tabIndex={count > 1 ? 0 : undefined} data-editorial-carousel
      onMouseEnter={() => { interaction.current.hover = true; }} onMouseLeave={() => { interaction.current.hover = false; }}
      onFocus={() => { interaction.current.focus = true; }} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) interaction.current.focus = false; }}
      onTouchStart={event => { const point = event.touches[0]; touch.current = { x: point.clientX, y: point.clientY }; interaction.current.touch = true; }}
      onTouchEnd={event => {
        const point = event.changedTouches[0], dx = point.clientX - touch.current.x, dy = point.clientY - touch.current.y;
        if (count > 1 && Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) move(dx < 0 ? 1 : -1);
        interaction.current.touch = false;
      }} onTouchCancel={() => { interaction.current.touch = false; }}
      onKeyDown={event => { if (count > 1 && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) { event.preventDefault(); move(event.key === 'ArrowLeft' ? -1 : 1); } }}>
      <div className={styles.frames}>
        {slide.photos.map((photo, number) => {
          return <div key={photo.id} data-carousel-photo={number} className={styles.photo}
            style={{ opacity: number === active ? 1 : 0 }} aria-hidden={number !== active}>
            <DeferredDetailImage key={photo.url} src={photo.url} alt={gallery('foto', { number: number + 1 })} fill unoptimized sizes="(max-width: 1023px) 45vw, 25vw" className="object-cover" />
          </div>;
        })}
      </div>
      {count > 1 && <div className={styles.controls} data-editorial-controls>
        <button type="button" onClick={() => move(-1)} aria-label={gallery('anterior')}>‹</button>
        <div className={styles.dots}>{slide.photos.map((photo, number) => <button key={photo.id} type="button" onClick={() => setIndex(number)} aria-label={gallery('irFoto', { number: number + 1 })} aria-pressed={number === active}><span /></button>)}</div>
        <button type="button" onClick={() => move(1)} aria-label={gallery('siguiente')}>›</button>
      </div>}
    </div>}
    {slide.description.trim() && <div data-editorial-narrative className={`${styles.narrative} glass-panel rounded-2xl p-6 shadow-xl ring-1 ring-white/40 dark:ring-gray-700/50 text-gray-900 dark:text-gray-100`}>
      <h2 className="break-words text-2xl font-light tracking-widest md:text-4xl">{t(titles[slide.section])}</h2>
      {slide.description && <div className={styles.description} tabIndex={0} aria-label={t('presentation.description', { section: t(titles[slide.section]) })}>
        <p className="whitespace-pre-wrap break-words leading-relaxed">{slide.description}</p></div>}

    </div>}
    </div>
  </section>;
}

export type EditorialScene = { id: string; label: string; content: ReactNode };

function EditorialFlow({ slides }: { slides: EditorialSlide[] }) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const screens = Array.from(element.querySelectorAll<HTMLElement>('[data-editorial-slide]'));
    const backgrounds = Array.from(element.querySelectorAll<HTMLElement>('[data-flow-background]'));
    const scrollTarget = window;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    function update() {
      frame = 0;
      const rect = element!.getBoundingClientRect();
      // El margen del 10% permite ver el fade antes de salir por completo.
      element!.setAttribute('data-scroll-free', String(rect.top < window.innerHeight * 0.9 && rect.bottom > window.innerHeight * 0.1));
      const distance = -rect.top + window.innerHeight * 0.35;
      const positions = screens.map(screen => ({ start: screen.getBoundingClientRect().top - rect.top, height: screen.offsetHeight }));
      const index = Math.max(0, positions.findLastIndex(position => distance >= position.start));
      const phase = Math.max(0, Math.min(1, (distance - positions[index].start) / Math.max(1, positions[index].height)));
      const fade = reduced.matches ? 0 : Math.max(0, Math.min(1, (phase - 0.75) / 0.25));
      backgrounds.forEach((background, number) => { background.style.opacity = String(number === index ? 1 : number === index + 1 ? fade : 0); });
      screens.forEach((screen, number) => {
        const local = Math.max(0, Math.min(1, (distance - positions[number].start) / Math.max(1, positions[number].height)));
        const photoPhase = reduced.matches ? 0 : Math.max(0, Math.min(1, (local - 0.25) / 0.5));
        screen.style.setProperty('--editorial-photo-progress', String(photoPhase));
        const photos = screen.querySelectorAll<HTMLElement>('[data-editorial-photo]');
        photos.forEach((photo, photoIndex) => photo.setAttribute('aria-hidden', String(!reduced.matches && photos.length > 1 && photoIndex !== (photoPhase >= 0.5 ? 1 : 0))));
      });
    }
    function schedule() { if (!frame) frame = requestAnimationFrame(update); }
    const resize = new ResizeObserver(schedule);
    screens.forEach(screen => resize.observe(screen));
    scrollTarget.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    reduced.addEventListener('change', schedule);
    update();
    return () => {
      cancelAnimationFrame(frame); resize.disconnect();
      scrollTarget.removeEventListener('scroll', schedule); window.removeEventListener('resize', schedule);
      reduced.removeEventListener('change', schedule); element.removeAttribute('data-scroll-free');
    };
  }, [slides]);
  if (!slides.length) return null;
  return <div ref={root} className={styles.flow} data-editorial-flow>
    {PUBLIC_PHOTO_BACKGROUNDS && <div className={styles.flowBackdrop} aria-hidden="true"><div className={styles.flowBackgroundStage}>
      {slides.map((slide,index)=><div key={slide.section} data-flow-background={slide.section} className={styles.backdrop} style={{ opacity: index === 0 ? 1 : 0 }}>
        {slide.hero && <DeferredDetailImage key={slide.hero.url} src={slide.hero.url} alt="" fill unoptimized sizes="100vw" className="object-cover" />}
      </div>)}
    </div></div>}
    {slides.map(slide=><EditorialScreen key={slide.section} slide={slide} flow />)}
  </div>;
}

// Motor compartido; los componentes de las escenas permanecen montados.
export function EditorialStage({ scenes }: { scenes: EditorialScene[] }) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const panels = Array.from(element.querySelectorAll<HTMLElement>('[data-editorial-panel]'));
    const stage = element.querySelector<HTMLElement>('[data-editorial-stage]')!;
    const stops = Array.from(element.querySelectorAll<HTMLElement>('[data-scene-stop]'));
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0, viewportHeight = stage.offsetHeight;
    let geometry = sceneGeometry(panels.map(() => viewportHeight), viewportHeight);
    function update() {
      frame = 0;
      if (element!.querySelector('dialog[open]')) return;
      if (document.activeElement?.matches('input, textarea, select') && window.visualViewport && window.visualViewport.height < window.innerHeight * 0.8) return;
      if (reduced.matches) {
        panels.forEach(panel => {
          panel.inert = false; panel.removeAttribute('aria-hidden'); panel.style.opacity = '1'; panel.style.pointerEvents = 'auto';
          panel.setAttribute('data-reveal-entered', 'true');
          panel.style.setProperty('--editorial-photo-progress', '0');
          panel.querySelectorAll<HTMLElement>('[data-editorial-photo]').forEach(photo => photo.setAttribute('aria-hidden', 'false'));
        });
        return;
      }
      const distance = -element!.getBoundingClientRect().top;
      const height = viewportHeight;
      const { index, fade, active } = sceneProgress(distance, height, geometry, false);
      // Transferencia explícita de foco antes de volver inerte una escena.
      const focused = panels.findIndex(panel => panel.contains(document.activeElement));
      if (focused >= 0 && focused !== active && panels[active]) {
        panels[active].inert = false;
        panels[active].style.visibility = 'visible';
        panels[active].removeAttribute('aria-hidden');
        panels[active].focus({ preventScroll: true });
      }
      panels.forEach((panel, number) => {
        const local = Math.max(0, distance - geometry[number].start);
        const photoPhase = Math.max(0, Math.min(1, (local / Math.max(1, height) - 0.25) / 0.5));
        panel.style.setProperty('--editorial-photo-progress', String(photoPhase));
        const photos = panel.querySelectorAll<HTMLElement>('[data-editorial-photo]');
        photos.forEach((photo, photoIndex) => photo.setAttribute('aria-hidden', String(photos.length > 1 && photoIndex !== (photoPhase >= 0.5 ? 1 : 0))));
        panel.style.opacity = String(number === index ? 1 : number === index + 1 ? fade : 0);
        panel.style.visibility = number === index || number === index + 1 && fade > 0 ? 'visible' : 'hidden';
        panel.style.pointerEvents = number === active ? 'auto' : 'none';
        panel.inert = number !== active;
        panel.setAttribute('aria-hidden', String(number !== active));
        if (number === active) panel.setAttribute('data-reveal-entered', 'true');
      });
    }
    function measure() {
      // No cambiar el recorrido mientras el diálogo o teclado/foco están activos.
      if (element!.querySelector('dialog[open]') || document.activeElement?.matches('input, textarea, select')) return;
      const height = stage.offsetHeight || window.innerHeight;
      viewportHeight = height;
      geometry = sceneGeometry(panels.map(() => height), height);
      element!.style.height = reduced.matches ? 'auto' : `${geometry.reduce((sum, scene) => sum + scene.length, 0)}px`;
      stops.forEach((stop, index) => { stop.style.top = `${geometry[index].start}px`; stop.style.height = `${geometry[index].length}px`; });
      schedule();
    }
    function schedule() { if (!frame) frame = requestAnimationFrame(update); }
    function navigate(hash: string) {
      const id = hash.replace(/^#/, '');
      if (reduced.matches || !/^[a-zA-Z0-9_-]+$/.test(id)) return false;
      const index = panels.findIndex(panel => panel.querySelector(`[id="${id}"]`));
      if (index < 0) return false;
      window.scrollTo({ top: element!.getBoundingClientRect().top + window.scrollY + geometry[index].start, behavior: 'smooth' });
      return true;
    }
    function anchorClick(event: MouseEvent) {
      const link = (event.target as Element | null)?.closest('a[href^="#"]');
      const hash = link?.getAttribute('href');
      if (hash && navigate(hash)) { event.preventDefault(); window.history.replaceState(null, '', hash); }
    }
    function hashChanged() { if (window.location.hash) navigate(window.location.hash); }
    function focusOut() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => { frame = 0; measure(); });
    }
    function motionChanged() {
      panels.forEach(panel => { panel.style.visibility = ''; panel.style.opacity = ''; panel.style.pointerEvents = ''; panel.inert = false; panel.removeAttribute('aria-hidden'); });
      measure();
    }
    const resize = new ResizeObserver(measure);
    resize.observe(stage);
    panels.forEach(panel => resize.observe(panel.querySelector<HTMLElement>('[data-scene-content]')!));
    const dialogs = new MutationObserver(() => { measure(); schedule(); });
    dialogs.observe(element, { subtree: true, attributes: true, attributeFilter: ['open'] });
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', measure);
    window.visualViewport?.addEventListener('resize', measure);
    document.addEventListener('focusout', focusOut);
    document.addEventListener('click', anchorClick);
    window.addEventListener('hashchange', hashChanged);
    reduced.addEventListener('change', motionChanged);
    measure(); update();
    if (window.location?.hash) hashChanged();
    return () => {
      cancelAnimationFrame(frame); resize.disconnect(); dialogs.disconnect();
      window.removeEventListener('scroll', schedule); window.removeEventListener('resize', measure);
      window.visualViewport?.removeEventListener('resize', measure);
      document.removeEventListener('focusout', focusOut);
      document.removeEventListener('click', anchorClick);
      window.removeEventListener('hashchange', hashChanged);
      reduced.removeEventListener('change', motionChanged);
    };
  }, [scenes]);
  if (!scenes.length) return null;
  return <div ref={root} className={styles.presentation} style={{ height: `${scenes.length * 100}dvh` }}>
    {scenes.map((scene, index) => <div key={scene.id} data-scene-stop className={styles.stop} aria-hidden="true" style={{ top: `${index * 100}dvh`, height: '100dvh' }} />)}
    <div className={styles.stage} data-editorial-stage>
      {scenes.map((scene, index) => <div key={scene.id} data-editorial-panel={scene.id} data-scene-height="100dvh" className={styles.panel} role="region" tabIndex={-1} aria-label={scene.label}
        style={{ opacity: index === 0 ? 1 : 0, visibility: index === 0 ? 'visible' : 'hidden' }}>
        <div className={styles.body} data-scene-body><div data-scene-content className={styles.content}>{scene.content}</div></div>
      </div>)}
    </div>
  </div>;
}

export default function EditorialPresentation({ slides, scenes = [], afterScenes = [] }: { slides: EditorialSlide[]; scenes?: EditorialScene[]; afterScenes?: EditorialScene[] }) {
  const anchor = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const journey = anchor.current?.closest<HTMLElement>('.detail-journey');
    if (!journey) return;
    const sections = Array.from(journey.querySelectorAll<HTMLElement>('[data-detail-section], [data-editorial-slide]'));
    const layers = Array.from(journey.querySelectorAll<HTMLElement>('[data-journey-background]'));
    if (!sections.length || !layers.length) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    function update() {
      frame = 0;
      if (reduced.matches) { journey!.removeAttribute('data-background-ready'); return; }
      // La misma línea de lectura y último cuarto usados por EditorialFlow.
      const line = window.innerHeight * 0.35;
      const positions = sections.map(section => ({ top: section.getBoundingClientRect().top, height: section.offsetHeight }));
      const index = Math.max(0, positions.findLastIndex(position => position.top <= line));
      const phase = Math.max(0, Math.min(1, (line - positions[index].top) / Math.max(1, positions[index].height)));
      const fade = Math.max(0, Math.min(1, (phase - 0.75) / 0.25));
      const current = sections[index].dataset.detailSection || sections[index].dataset.editorialSlide;
      const next = sections[index + 1]?.dataset.detailSection || sections[index + 1]?.dataset.editorialSlide;
      layers.forEach(layer => { layer.style.opacity = String(layer.dataset.journeyBackground === current ? 1 : layer.dataset.journeyBackground === next ? fade : 0); });
      journey!.setAttribute('data-background-ready', 'true');
    }
    function schedule() { if (!frame) frame = requestAnimationFrame(update); }
    const resize = new ResizeObserver(schedule);
    sections.forEach(section => resize.observe(section));
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    reduced.addEventListener('change', schedule);
    update();
    return () => {
      cancelAnimationFrame(frame); resize.disconnect();
      window.removeEventListener('scroll', schedule); window.removeEventListener('resize', schedule);
      reduced.removeEventListener('change', schedule); journey.removeAttribute('data-background-ready');
    };
  }, [slides]);
  return <><EditorialStage scenes={scenes} /><EditorialFlow slides={slides} /><EditorialStage scenes={afterScenes} /><span ref={anchor} hidden aria-hidden="true" /></>;
}
