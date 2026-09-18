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

  return (
    <Link href={`/casas/${property.slug}`}>
      <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow group">
        {property.media.length > 0 ? (
          <div className="aspect-video overflow-hidden">
            <img
              src={property.media[0].url}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        ) : null}
        <div className="p-4">
          <h3 className="text-xl font-bold mb-2 text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600">{property.city}</p>
          <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
            <span>{property.maxGuests} huéspedes</span>
            <span>{property.bedrooms} hab.</span>
            <span>{property.bathrooms} baños</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
