'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

type Slide = { url: string; type: 'PHOTO' | 'VIDEO' };
const DETAIL_GALLERY_LIMIT = 8;

export default function PropertyGallery({ slides: allSlides }: { slides: Slide[] }) {
  const slides = allSlides.slice(0, DETAIL_GALLERY_LIMIT);
  const t = useTranslations('details.gallery');
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
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
        {slides.map((slide, i) => {
          return (
            <button key={`${slide.url}-${i}`} type="button" aria-haspopup="dialog"
              aria-label={t(slide.type === 'VIDEO' ? 'abrirVideo' : 'abrirFoto', { number: i + 1 })}
              onClick={event => { openerRef.current = event.currentTarget; setIndex(i); }}
              className="relative aspect-[4/3] min-w-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700">
              {slide.type === 'VIDEO' ? (
                <><video src={slide.url} preload="metadata" muted playsInline aria-hidden="true" className="h-full w-full object-cover" />
                  <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center bg-black/30 dark:bg-black/50 text-3xl text-white dark:text-gray-100">▶</span></>
              ) : (
                <Image src={slide.url} alt={t('foto', { number: i + 1 })} fill unoptimized sizes="(max-width: 767px) 50vw, (max-width: 1023px) 33vw, 25vw" className="object-cover" />
              )}
            </button>
          );
        })}
      </div>

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
        className="property-lightbox fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none border-0 bg-transparent p-0 text-white dark:text-gray-100 backdrop:bg-black/85 open:flex open:flex-col">
        {current && <>
          <div className="flex shrink-0 items-center justify-between gap-4 px-4 py-3">
            <p role="status" aria-live="polite" aria-label={t('posicion', { number: index! + 1, count: slides.length })}>
              {index! + 1}/{slides.length}
            </p>
            <button ref={closeRef} type="button" onClick={close} aria-label={t('cerrar')} title={t('cerrar')}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 dark:bg-white/10 text-2xl hover:bg-white/20 dark:hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-white">×</button>
          </div>
          <div className="flex min-h-0 flex-1 items-center justify-center p-4 sm:p-8">
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
