// apps/web/src/components/SectionSlider.tsx
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

type Slide = {
  url: string;
  type: 'PHOTO' | 'VIDEO';
};

export default function SectionSlider({
  slides,
  fullscreen = false,
}: {
  slides: Slide[];
  fullscreen?: boolean;
}) {
  const t = useTranslations('details.gallery');
  const [idx, setIdx] = useState(0);

  if (slides.length === 0) return null;

  const prev = () => setIdx((i) => (i - 1 + slides.length) % slides.length);
  const next = () => setIdx((i) => (i + 1) % slides.length);

  const esVideo = slides[idx].type === 'VIDEO';

  return (
    <div
      className={
        fullscreen
          ? 'absolute inset-0 overflow-hidden'
          : 'relative aspect-[16/9] overflow-hidden rounded-lg bg-gray-100'
      }
    >
      {/* Slide activo */}
      {esVideo ? (
        <video
          key={idx}
          src={slides[idx].url}
          controls
          playsInline
          className="h-full w-full animate-[fade_.4s_ease] object-cover"
        />
      ) : (
        <img
          key={idx}
          src={slides[idx].url}
          alt={t('foto', { number: idx + 1 })}
          className="h-full w-full animate-[fade_.4s_ease] object-cover"
        />
      )}

      {/* Controles — solo si hay más de un slide */}
      {slides.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 z-20 -translate-y-1/2 cursor-pointer rounded-full bg-white/90 p-3 text-gray-900 transition hover:bg-white"
            aria-label={t('anterior')}
          >
            ‹
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 z-20 -translate-y-1/2 cursor-pointer rounded-full bg-white/90 p-3 text-gray-900 transition hover:bg-white"
            aria-label={t('siguiente')}
          >
            ›
          </button>

          {/* Dots — arriba a la derecha en video para no chocar con sus controles */}
          <div
            className={
              esVideo
                ? 'absolute right-4 top-4 z-20 flex gap-2'
                : 'absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2'
            }
          >
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className={`h-2 w-2 cursor-pointer rounded-full transition-colors ${
                  i === idx ? 'bg-white' : 'bg-white/50'
                }`}
                aria-label={t('irFoto', { number: i + 1 })}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
