'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import Reveal from './Reveal';
import styles from './PropertyGallery.module.css';

type Slide = { url: string; type: 'PHOTO' | 'VIDEO' };
const DETAIL_GALLERY_LIMIT = 8;

export default function PropertyGallery({ slides: allSlides, fullCollection = false }: { slides: Slide[]; fullCollection?: boolean }) {
  const slides = fullCollection ? allSlides : allSlides.slice(0, DETAIL_GALLERY_LIMIT);
  const t = useTranslations('details.gallery');
  const [selected, setSelected] = useState(0);
  const stripRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLButtonElement>(null);
  const open = index !== null;
  const current = index === null ? null : slides[index];

  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current!;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.showModal();
    closeRef.current?.focus();
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  function close() {
    dialogRef.current?.close();
    setIndex(null);
    openerRef.current?.focus();
  }

  function move(delta: number) {
    setIndex(actual => actual === null ? null : (actual + delta + slides.length) % slides.length);
  }

  if (!slides.length) return null;

  return (
    <>
      <Reveal className={styles.gallery}>
        <button type="button" aria-haspopup="dialog"
          aria-label={t(slides[selected].type === 'VIDEO' ? 'abrirVideo' : 'abrirFoto', { number: selected + 1 })}
          onClick={event => { openerRef.current = event.currentTarget; setIndex(selected); }}
          className={styles.hero}>
          {slides[selected].type === 'VIDEO' ? (
            <><video src={slides[selected].url} preload="metadata" muted playsInline aria-hidden="true" className={styles.photo} />
              <span aria-hidden="true" className={styles.play}>▶</span></>
          ) : (
            <Image src={slides[selected].url} alt={t('foto', { number: selected + 1 })} fill unoptimized
              loading="eager" fetchPriority={selected === 0 ? 'high' : 'auto'}
              sizes="(max-width: 1024px) 100vw, 1024px" className={styles.photo} />
          )}
        </button>
        {slides.length > 1 && <>
          <div ref={stripRef} className={styles.strip}>
            {slides.map((slide, i) => (
              <button key={slide.url + '-' + i} type="button" aria-pressed={selected === i}
                aria-label={t(slide.type === 'VIDEO' ? 'abrirVideo' : 'abrirFoto', { number: i + 1 })}
                onClick={() => setSelected(i)} className={styles.thumbnail}>
                {slide.type === 'VIDEO' ? (
                  <><video src={slide.url} preload="metadata" muted playsInline aria-hidden="true" className={styles.photo} />
                    <span aria-hidden="true" className={styles.play}>▶</span></>
                ) : (
                  <Image src={slide.url} alt={t('foto', { number: i + 1 })} fill unoptimized loading="lazy"
                    sizes="(max-width: 1024px) 33vw, 336px" className={styles.photo} />
                )}
              </button>
            ))}
          </div>
          {slides.length > 3 && <div className={styles.controls}>
            <button type="button" aria-label={t('anterior')} className={styles.arrow}
              onClick={() => stripRef.current?.scrollBy({ left: -stripRef.current.clientWidth, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })}><svg aria-hidden="true" width="36" height="28" viewBox="0 0 32 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M28 12H4m8-8-8 8 8 8" /></svg></button>
            <button type="button" aria-label={t('siguiente')} className={styles.arrow}
              onClick={() => stripRef.current?.scrollBy({ left: stripRef.current.clientWidth, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })}><svg aria-hidden="true" width="36" height="28" viewBox="0 0 32 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12h24m-8-8 8 8-8 8" /></svg></button>
          </div>}
        </>}
      </Reveal>

      <dialog ref={dialogRef} aria-label={t('lightbox')} aria-modal="true"
        onCancel={event => { event.preventDefault(); close(); }}
        onClick={event => {
          const target = event.target;
          if (target instanceof Element && !target.closest('button, img, video')) close();
        }}
        onKeyDown={event => {
          if (event.key === 'Tab') {
            const focusable = [...event.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled]), video[controls]')];
            const first = focusable[0], last = focusable[focusable.length - 1];
            if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
            else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
          }
          if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1); }
          if (event.key === 'ArrowRight') { event.preventDefault(); move(1); }
        }}
        className={`${styles.lightbox} property-lightbox fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none border-0 bg-transparent p-0 text-white dark:text-gray-100 backdrop:bg-black/85 open:flex open:flex-col`}>
        {current && <>
          <div className="flex shrink-0 items-center justify-between gap-4 px-4 py-3">
            <p role="status" aria-live="polite" aria-label={t('posicion', { number: index! + 1, count: slides.length })}>
              {index! + 1}/{slides.length}
            </p>
            <button ref={closeRef} type="button" onClick={close} aria-label={t('cerrar')} title={t('cerrar')}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 dark:bg-white/10 text-2xl hover:bg-white/20 dark:hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-white">×</button>
          </div>
          <div className={`${styles.lightboxMedia} flex min-h-0 flex-1 items-center justify-center p-4 sm:p-8`}>
            {current.type === 'VIDEO' ? (
              <video key={current.url} src={current.url} controls playsInline aria-label={t('abrirVideo', { number: index! + 1 })} className="max-h-full max-w-full" />
            ) : (
              <Image key={current.url} src={current.url} alt={t('foto', { number: index! + 1 })} width={1600} height={1200} unoptimized sizes="100vw" className="h-auto max-h-full w-auto max-w-full object-contain" />
            )}
          </div>
          {slides.length > 1 && <div className="flex shrink-0 justify-between gap-4 px-4 py-3">
            <button type="button" onClick={() => move(-1)} aria-label={t('anterior')} title={t('anterior')}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 dark:bg-white/10 text-2xl hover:bg-white/20 dark:hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-white">‹</button>
            <button type="button" onClick={() => move(1)} aria-label={t('siguiente')} title={t('siguiente')}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 dark:bg-white/10 text-2xl hover:bg-white/20 dark:hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-white">›</button>
          </div>}
        </>}
      </dialog>
    </>
  );
}
