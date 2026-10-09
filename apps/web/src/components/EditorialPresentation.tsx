'use client';
import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { editorialProgress, type EditorialSlide } from '@/lib/editorial-presentation';
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
      const distance = -element.getBoundingClientRect().top;
      const height = element.querySelector<HTMLElement>('[data-editorial-stage]')!.offsetHeight;
      const { index, fade, active } = editorialProgress(distance, height, panels.length, reduced.matches);
      panels.forEach((panel, number) => {
        const progress = Math.max(0, Math.min(1, (distance / Math.max(1, height) - number - 0.25) / 0.5));
        panel.style.setProperty('--editorial-photo-progress', String(reduced.matches ? Number(progress >= 0.5) : progress));
        const photos = panel.querySelectorAll<HTMLElement>('[data-editorial-photo]');
        photos.forEach((photo, photoIndex) => {
          photo.setAttribute('aria-hidden', String(photoIndex !== (progress >= 0.5 ? 1 : 0) && photos.length > 1));
        });
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
  return <div ref={root} className={styles.presentation} style={{ height: `${slides.length * 100}dvh` }}>
    <div className={styles.stage} data-editorial-stage>
      {slides.map((slide, number) => <div key={slide.section} data-editorial-panel className={styles.panel} style={{ opacity: number === 0 ? 1 : 0 }}
        inert={number !== 0} aria-hidden={number !== 0}><EditorialScreen slide={slide} /></div>)}
    </div>
  </div>;
}
