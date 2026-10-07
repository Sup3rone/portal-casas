'use client';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { editorialProgress, editorialSwipe, type EditorialSlide } from '@/lib/editorial-presentation';
import styles from './EditorialPresentation.module.css';

const titles = { destino: 'destino', amenidades: 'amenidades', habitaciones: 'habitaciones', lugar: 'enLugar' } as const;

function EditorialScreen({ slide }: { slide: EditorialSlide }) {
  const t = useTranslations('details'), gallery = useTranslations('details.gallery');
  const [index, setIndex] = useState(0);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const count = slide.photos.length;
  const [paused, setPaused] = useState(false), [reduced, setReduced] = useState(true);
  const resume = useRef<ReturnType<typeof setTimeout> | null>(null);
  const interacting = useRef({ hover: false, focus: false, touch: false });
  function pause() { if (resume.current) clearTimeout(resume.current); setPaused(true); }
  function release() {
    if (resume.current) clearTimeout(resume.current);
    resume.current = setTimeout(() => {
      if (!Object.values(interacting.current).some(Boolean)) setPaused(false);
    }, 5000);
  }
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(query.matches); update(); query.addEventListener('change', update);
    return () => { query.removeEventListener('change', update); if (resume.current) clearTimeout(resume.current); };
  }, []);
  useEffect(() => {
    if (count !== 2 || paused || reduced) return;
    const timer = setInterval(() => setIndex(value => (value + 1) % 2), 5000);
    return () => clearInterval(timer);
  }, [count, paused, reduced]);
  function move(step: number) { pause(); if (count > 1) setIndex(value => (value + step + count) % count); release(); }
  return <section className={styles.screen} aria-label={t(titles[slide.section])}>
    {slide.hero && <div className={styles.backdrop} aria-hidden="true"><Image src={slide.hero.url} alt="" fill unoptimized sizes="100vw" className="object-cover" /></div>}
    <div className={styles.floating}>
    <div className={`${styles.images} glass-panel rounded-2xl p-4 shadow-xl ring-1 ring-white/40 dark:ring-gray-700/50 text-gray-900 dark:text-gray-100`} role="region" aria-label={t('presentation.slideshow', { section: t(titles[slide.section]) })}
      tabIndex={count > 1 ? 0 : undefined}
      onMouseEnter={() => { interacting.current.hover = true; pause(); }}
      onMouseLeave={() => { interacting.current.hover = false; release(); }}
      onFocus={() => { interacting.current.focus = true; pause(); }}
      onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) { interacting.current.focus = false; release(); } }}
      onKeyDown={event => { if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); move(event.key === 'ArrowLeft' ? -1 : 1); } }}
      onTouchStart={event => { interacting.current.touch = true; pause(); const point = event.touches[0]; touch.current = { x: point.clientX, y: point.clientY }; }}
      onTouchCancel={() => { interacting.current.touch = false; touch.current = null; release(); }}
      onTouchEnd={event => { const point = event.changedTouches[0], start = touch.current; touch.current = null;
        interacting.current.touch = false; if (start) move(editorialSwipe(start, { x: point.clientX, y: point.clientY })); release(); }}>
      <div className={styles.frames}>
        {slide.photos.map((photo, number) => {
          return <div key={photo.id} className={styles.photo} style={{ opacity: number === index ? 1 : 0 }} aria-hidden={number !== index}>
            <Image src={photo.url} alt={gallery('foto', { number: number + 1 })} fill unoptimized sizes="(max-width: 1023px) 45vw, 25vw" className="object-cover" />
          </div>;
        })}
      </div>
      {count > 1 && <div className={styles.controls}>
        <button type="button" className={styles.arrow} onClick={() => move(-1)} aria-label={gallery('anterior')}>‹</button>
        <span>{gallery('posicion', { number: index + 1, count })}</span>
        <button type="button" className={styles.arrow} onClick={() => move(1)} aria-label={gallery('siguiente')}>›</button>
        <div className={styles.indicators}>{slide.photos.map((photo, number) => <button key={photo.id} type="button"
          onClick={() => move(number - index)} aria-label={gallery('irFoto', { number: number + 1 })} aria-current={number === index ? 'true' : undefined}
          className={styles.indicator}><span style={{ opacity: number === index ? 1 : 0.4 }} /></button>)}</div>
      </div>}
    </div>
    <div className={`${styles.narrative} glass-panel rounded-2xl p-6 shadow-xl ring-1 ring-white/40 dark:ring-gray-700/50 text-gray-900 dark:text-gray-100`}>
      <h2 className="break-words text-2xl font-light tracking-widest md:text-4xl">{t(titles[slide.section])}</h2>
      {slide.description && <div className={styles.description} tabIndex={0} aria-label={t('presentation.description', { section: t(titles[slide.section]) })}>
        <p className="whitespace-pre-wrap break-words leading-relaxed">{slide.description}</p></div>}

    </div>
    </div>
  </section>;
}

export default function EditorialPresentation({ slides }: { slides: EditorialSlide[] }) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!root.current) return;
    const element = root.current;
    const panels = Array.from(element.querySelectorAll<HTMLElement>('[data-editorial-panel]'));
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    function update() {
      frame = 0;
      const { index, fade, active } = editorialProgress(-element.getBoundingClientRect().top, element.querySelector<HTMLElement>('[data-editorial-stage]')!.offsetHeight, panels.length, reduced.matches);
      panels.forEach((panel, number) => {
        panel.style.opacity = String(number === index ? 1 : number === index + 1 ? fade : 0);
        panel.style.pointerEvents = number === active ? 'auto' : 'none';
        panel.inert = number !== active;
        panel.setAttribute('aria-hidden', String(number !== active));
      });
    }
    function schedule() { if (!frame) frame = requestAnimationFrame(update); }
    const resize = new ResizeObserver(schedule); resize.observe(element);
    window.addEventListener('scroll', schedule, { passive: true }); window.addEventListener('resize', schedule);
    reduced.addEventListener('change', schedule); update();
    return () => { cancelAnimationFrame(frame); resize.disconnect(); window.removeEventListener('scroll', schedule); window.removeEventListener('resize', schedule); reduced.removeEventListener('change', schedule); };
  }, [slides.length]);
  if (!slides.length) return null;
  return <div ref={root} className={styles.presentation} style={{ height: `${slides.length * 100}svh` }}>
    <div className={styles.stage} data-editorial-stage>
      {slides.map((slide, number) => <div key={slide.section} data-editorial-panel className={styles.panel} style={{ opacity: number === 0 ? 1 : 0 }}
        inert={number !== 0} aria-hidden={number !== 0}><EditorialScreen slide={slide} /></div>)}
    </div>
  </div>;
}
