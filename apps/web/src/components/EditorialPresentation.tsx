'use client';
import { useEffect, useRef, type ReactNode } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { sceneGeometry, sceneProgress, type EditorialSlide } from '@/lib/editorial-presentation';
import styles from './EditorialPresentation.module.css';

const titles = { destino: 'destino', amenidades: 'amenidades', habitaciones: 'habitaciones', lugar: 'enLugar' } as const;

function EditorialScreen({ slide }: { slide: EditorialSlide }) {
  const t = useTranslations('details'), gallery = useTranslations('details.gallery');
  const count = slide.photos.length;
  return <section className={styles.screen} aria-label={t(titles[slide.section])}>
    {slide.hero && <div className={styles.backdrop} aria-hidden="true"><Image src={slide.hero.url} alt="" fill unoptimized sizes="100vw" className="object-cover" /></div>}
    <div className={styles.floating}>
    <div className={`${styles.images} glass-panel rounded-2xl p-4 shadow-xl ring-1 ring-white/40 dark:ring-gray-700/50 text-gray-900 dark:text-gray-100`} role="region" aria-label={t('presentation.slideshow', { section: t(titles[slide.section]) })}
      tabIndex={count > 1 ? 0 : undefined}
      onKeyDown={event => { if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault(); window.scrollBy({ top: (event.key === 'ArrowLeft' ? -1 : 1) * window.innerHeight,
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      } }}>
      <div className={styles.frames}>
        {slide.photos.map((photo, number) => {
          return <div key={photo.id} data-editorial-photo={number} className={styles.photo}
            style={{ opacity: count === 1 ? 1 : number === 0 ? 'calc(1 - var(--editorial-photo-progress, 0))' : 'var(--editorial-photo-progress, 0)' }} aria-hidden={number !== 0}>
            <Image src={photo.url} alt={gallery('foto', { number: number + 1 })} fill unoptimized sizes="(max-width: 1023px) 45vw, 25vw" className="object-cover" />
          </div>;
        })}
      </div>
    </div>
    <div className={`${styles.narrative} glass-panel rounded-2xl p-6 shadow-xl ring-1 ring-white/40 dark:ring-gray-700/50 text-gray-900 dark:text-gray-100`}>
      <h2 className="break-words text-2xl font-light tracking-widest md:text-4xl">{t(titles[slide.section])}</h2>
      {slide.description && <div className={styles.description} tabIndex={0} aria-label={t('presentation.description', { section: t(titles[slide.section]) })}>
        <p className="whitespace-pre-wrap break-words leading-relaxed">{slide.description}</p></div>}

    </div>
    </div>
  </section>;
}

export type EditorialScene = { id: string; label: string; content: ReactNode };

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
  const t = useTranslations('details');
  return <EditorialStage scenes={[...scenes, ...slides.map(slide => ({ id: slide.section, label: t(titles[slide.section]), content: <EditorialScreen slide={slide} /> })), ...afterScenes]} />;
}
