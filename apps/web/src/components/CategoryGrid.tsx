// apps/web/src/components/CategoryGrid.tsx
'use client';

import { useState } from 'react';
import SectionSlider from './SectionSlider';

type Slide = { url: string; type: 'PHOTO' | 'VIDEO' };
type Item = { icon: string; label: string };

export type CategoryData = {
  mapEmbedUrl: string | null;
  amenities: Item[];
  roomSlides: Slide[];
  placeOffers: Item[];
};

type PopupKind = 'destino' | 'amenidades' | 'habitaciones' | 'lugar' | null;

const boxes = [
  { id: 'destino', label: 'EL DESTINO', icon: '◎' },
  { id: 'amenidades', label: 'AMENIDADES', icon: '✦' },
  { id: 'habitaciones', label: 'HABITACIONES', icon: '▤' },
  { id: 'lugar', label: 'EN EL LUGAR', icon: '◈' },
] as const;

export default function CategoryGrid({ data }: { data: CategoryData }) {
  const [popup, setPopup] = useState<PopupKind>(null);

  const close = () => setPopup(null);

  return (
    <div>
      {/* ===== LOS 4 CUADROS ===== */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {boxes.map((b) => (
          <button
            key={b.id}
            onClick={() => setPopup(b.id)}
            className="group flex aspect-square flex-col items-center justify-center border border-gray-300 transition-colors hover:border-gray-900"
          >
            <span className="text-2xl text-gray-400 transition-colors group-hover:text-gray-900">
              {b.icon}
            </span>
            <span className="mt-4 text-[0.6rem] tracking-[0.25em] text-gray-500 transition-colors group-hover:text-gray-900">
              {b.label}
            </span>
          </button>
        ))}
      </div>

      {/* ===== POPUP ===== */}
      {popup && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4"
          onClick={close}
        >
          <div
            className="relative max-h-[85vh] w-full max-w-3xl overflow-y-auto bg-white p-8 md:p-12"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={close}
              className="absolute right-4 top-4 text-2xl font-light text-gray-400 hover:text-gray-900"
              aria-label="Cerrar"
            >
              ×
            </button>

            {/* EL DESTINO → mapa */}
            {popup === 'destino' && (
              <>
                <h2 className="mb-6 text-center text-xl font-light tracking-[0.3em] text-gray-900">
                  EL DESTINO
                </h2>
                {data.mapEmbedUrl ? (
                  <iframe
                    src={data.mapEmbedUrl}
                    width="100%"
                    height="420"
                    style={{ border: 0 }}
                    loading="lazy"
                    allowFullScreen
                    title="Mapa del destino"
                  />
                ) : (
                  <p className="text-center text-sm text-gray-500">Ubicación próximamente.</p>
                )}
              </>
            )}

            {/* AMENIDADES → lista */}
            {popup === 'amenidades' && (
              <>
                <h2 className="mb-6 text-center text-xl font-light tracking-[0.3em] text-gray-900">
                  AMENIDADES
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {data.amenities.map((a, i) => (
                    <div key={i} className="flex items-center gap-3 border-b border-gray-100 pb-3">
                      <span className="text-lg">{a.icon}</span>
                      <span className="text-sm font-light text-gray-700">{a.label}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* HABITACIONES → slider de fotos de la categoría */}
            {popup === 'habitaciones' && (
              <>
                <h2 className="mb-6 text-center text-xl font-light tracking-[0.3em] text-gray-900">
                  HABITACIONES
                </h2>
                {data.roomSlides.length > 0 ? (
                  <SectionSlider slides={data.roomSlides} />
                ) : (
                  <p className="text-center text-sm text-gray-500">
                    Fotos de habitaciones próximamente.
                  </p>
                )}
              </>
            )}

            {/* EN EL LUGAR → lo que ofrecemos */}
            {popup === 'lugar' && (
              <>
                <h2 className="mb-6 text-center text-xl font-light tracking-[0.3em] text-gray-900">
                  EN EL LUGAR
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {data.placeOffers.map((o, i) => (
                    <div key={i} className="flex items-center gap-3 border-b border-gray-100 pb-3">
                      <span className="text-lg">{o.icon}</span>
                      <span className="text-sm font-light text-gray-700">{o.label}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
