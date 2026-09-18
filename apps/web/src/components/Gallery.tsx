"use client";

import { useState } from "react";

type MediaItem = {
  id: string;
  url: string;
  type: string;
};

export default function Gallery({ media }: { media: MediaItem[] }) {
  const PREVIEW_COUNT = 5;
  const [expanded, setExpanded] = useState(false);

  const photos = media.filter((m) => m.type === "PHOTO");
  const videos = media.filter((m) => m.type === "VIDEO");
  const visiblePhotos = expanded ? photos : photos.slice(0, PREVIEW_COUNT);

  if (photos.length === 0 && videos.length === 0) {
    return <p className="text-gray-500 italic mb-8">Sin fotos todavía</p>;
  }

  return (
    <div className="mb-8">
      {/* Grid de fotos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visiblePhotos.map((m, idx) => (
          <div
            key={m.id}
            className={`relative aspect-video overflow-hidden rounded-lg ${
              idx === 0 && !expanded ? "md:col-span-2 row-span-2" : ""
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={m.url}
              alt={`Foto ${idx + 1}`}
              loading={idx >= PREVIEW_COUNT ? "lazy" : undefined}
              className="h-full w-full object-cover"
            />
          </div>
        ))}
      </div>

      {/* Botón ver más / ver menos */}
      {!expanded && photos.length > PREVIEW_COUNT && (
        <button
          onClick={() => setExpanded(true)}
          className="mt-4 w-full rounded-xl border border-[#6d4aff] px-4 py-3 font-medium text-[#6d4aff] transition hover:bg-[#6d4aff] hover:text-white"
        >
          Ver {photos.length - PREVIEW_COUNT} fotos más
        </button>
      )}
      {expanded && photos.length > PREVIEW_COUNT && (
        <button
          onClick={() => setExpanded(false)}
          className="mt-4 w-full rounded-xl border border-gray-300 px-4 py-3 font-medium text-gray-600 transition hover:bg-gray-50"
        >
          Ver menos
        </button>
      )}

      {/* Videos al final */}
      {videos.length > 0 && (
        <div className="mt-4 grid grid-cols-1 gap-4">
          {videos.map((m) => (
            <video key={m.id} controls className="w-full rounded-xl">
              <source src={m.url} />
            </video>
          ))}
        </div>
      )}
    </div>
  );
}
