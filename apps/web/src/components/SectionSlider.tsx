'use client';

import { useState } from 'react';

type Slide = { url: string; type: string };

export default function SectionSlider({ slides }: { slides: Slide[] }) {
  const [idx, setIdx] = useState(0);

  if (slides.length === 0) return null;

  const prev = () => setIdx((i) => (i - 1 + slides.length) % slides.length);
  const next = () => setIdx((i) => (i + 1) % slides.length);

  return (
    <div className="relative aspect-[16/9] overflow-hidden rounded-lg bg-gray-100">
      {/* Foto activa */}
      {slides[idx].type === 'VIDEO' ? (
        <video src={slides[idx].url} controls className="h-full w-full object-cover" />
      ) : (
        <img src={slides[idx].url} alt="" className="h-full w-full object-cover" />
      )}

      {/* Flechas — solo si hay más de una */}
      {slides.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-3 text-gray-900 transition hover:bg-white"
            aria-label="Anterior"
          >
            ‹
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-3 text-gray-900 transition hover:bg-white"
            aria-label="Siguiente"
          >
            ›
          </button>

          {/* Indicadores */}
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className={`h-2 w-2 rounded-full transition-colors ${
                  i === idx ? 'bg-white' : 'bg-white/50'
                }`}
                aria-label={`Foto ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
