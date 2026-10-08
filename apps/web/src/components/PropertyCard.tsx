// src/components/PropertyCard.tsx
'use client';

import { useLocale, useTranslations } from 'next-intl';
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
  const t = useTranslations('properties');

  const title =
    locale === 'es' ? property.titleEs
    : locale === 'en' ? property.titleEn
    : property.titleFr;

  return (
    <Link href={`/casas/${property.slug}`} className="group block">
      {/* CARD TRANSPARENTE CON BORDE FINO */}
      <div className="backdrop-blur-sm transition-transform group-hover:-translate-y-2 dark:rounded-lg dark:bg-gray-900/80">
        {/* Imagen cuadrada grande (como en captura) */}
        <div className="overflow-hidden rounded-lg border border-white/30 dark:border-gray-700 bg-white/5 dark:bg-white/5">
          {property.media.length > 0 ? (
            <div className="aspect-[4/3] overflow-hidden">
              <img
                src={property.media[0].url}
                alt={title}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
            </div>
          ) : (
            <div className="aspect-[4/3] bg-white/10 dark:bg-white/10" />
          )}
        </div>

        {/* Info — centrada debajo de la imagen */}
        <div className="mt-4 text-center">
          <h3 className="text-lg font-medium tracking-wide text-white dark:text-gray-100 drop-shadow-md">
            {title.toUpperCase()}
          </h3>
          <p className="text-sm text-white/80 dark:text-gray-200">{property.city}</p>
          <p className="pt-1 text-xs text-white/60 dark:text-gray-400">
            {property.maxGuests} {t('guests')} · {property.bedrooms} {t('bedrooms')}
          </p>
        </div>
      </div>
    </Link>
  );
}
