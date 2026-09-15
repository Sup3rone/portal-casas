import Link from 'next/link';
import { useLocale } from 'next-intl';
import { useTranslations } from 'next-intl';

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
  const t = useTranslations('properties');
  const locale = useLocale() as 'es' | 'en' | 'fr';

  const title =
    locale === 'es' ? property.titleEs
    : locale === 'en' ? property.titleEn
    : property.titleFr;

  const specs = {
    es: {
      guests: `${property.maxGuests} huéspedes`,
      rooms: `${property.bedrooms} hab.`,
      baths: `${property.bathrooms} baños`
    },
    en: {
      guests: `${property.maxGuests} guests`,
      rooms: `${property.bedrooms} bd.`,
      baths: `${property.bathrooms} baths`
    },
    fr: {
      guests: `${property.maxGuests} voyageurs`,
      rooms: `${property.bedrooms} ch.`,
      baths: `${property.bathrooms} sdb`
    }
  };

  return (
    <Link
      href={`/${locale}/casas/${property.slug}`}
      className="group block overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 transition-all hover:shadow-xl hover:-translate-y-1"
    >
      {/* Imagen con overlay y badge */}
      <div className="relative h-64 w-full overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={property.media?.[0]?.url || '/placeholder.jpg'}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100"></div>

        {/* Badge de propiedad destacada (opcional) */}
        <div className="absolute top-4 right-4 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-purple-600 shadow-sm">
          ✨ Destacado
        </div>
      </div>

      <div className="p-5">
        <h3 className="mb-2 text-lg font-bold text-gray-900 group-hover:text-purple-600 line-clamp-1">{title}</h3>
        <p className="mb-4 text-sm text-gray-500 flex items-center gap-1">
          <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {property.city}
        </p>

        <div className="flex items-center justify-between border-t border-gray-100 pt-4 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <svg className="h-4 w-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {specs[locale].guests}
          </div>
          <div className="flex items-center gap-1">
            <svg className="h-4 w-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            {specs[locale].rooms}
          </div>
          <div className="flex items-center gap-1">
            <svg className="h-4 w-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {specs[locale].baths}
          </div>
        </div>
      </div>
    </Link>
  );
}
