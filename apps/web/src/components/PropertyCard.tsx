// src/components/PropertyCard.tsx
'use client';

import { useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';

type DbProperty = {
  id: string;
  slug: string;
  titleEs: string;
  titleEn: string;
  titleFr: string;
  city: string;
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  media: { url: string; type: string }[];
};

export default function PropertyCard({ property }: { property: DbProperty }) {
  const locale = useLocale() as 'es' | 'en' | 'fr';

  const title =
    locale === 'es' ? property.titleEs
    : locale === 'en' ? property.titleEn
    : property.titleFr;

  const guestsLabel = locale === 'en' ? 'guests' : locale === 'fr' ? 'voyageurs' : 'huéspedes';
  const bedLabel = locale === 'en' ? 'bedrooms' : locale === 'fr' ? 'chambres' : 'habitaciones';

  return (
    <Link href={`/casas/${property.slug}`} className="group block">
      {/* Imagen vertical 4:3 con zoom sutil */}
      <div className="overflow-hidden rounded-lg">
        {property.media.length > 0 ? (
          <div className="aspect-[4/3] overflow-hidden bg-gray-100">
            <img
              src={property.media[0].url}
              alt={title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        ) : (
          <div className="aspect-[4/3] bg-gray-100" />
        )}
      </div>

      {/* Info — minimalista, sin sombra de tarjeta, texto directo sobre fondo */}
      <div className="mt-4 space-y-1">
        <h3 className="text-lg font-medium tracking-wide text-gray-900">
          {title.toUpperCase()}
        </h3>
        <p className="text-sm text-gray-500">{property.city}</p>
        <p className="pt-1 text-xs text-gray-600">
          {property.maxGuests} {guestsLabel} · {property.bedrooms} {bedLabel}
        </p>
      </div>
    </Link>
  );
}
