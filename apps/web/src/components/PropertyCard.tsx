import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import type { FakeProperty } from '@/data/properties';

export default function PropertyCard({ property }: { property: FakeProperty }) {
  const t = useTranslations('properties');
  const locale = useLocale() as 'es' | 'en' | 'fr';

  return (
    <article className="group overflow-hidden rounded-2xl bg-white shadow-sm transition hover:shadow-md">
      {/* imagen */}
      <div className="relative h-56 w-full overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={property.image}
          alt={property.titles[locale]}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />
      </div>

      {/* info */}
      <div className="p-4">
        <h3 className="text-lg font-semibold">{property.titles[locale]}</h3>
        <p className="text-sm text-gray-500">{property.city}</p>

        <div className="mt-2 flex gap-3 text-sm text-gray-600">
          <span>{t('huespedes', { count: property.maxGuests })}</span>
          <span>·</span>
          <span>{t('habitaciones', { count: property.bedrooms })}</span>
          <span>·</span>
          <span>{t('banos', { count: property.bathrooms })}</span>
        </div>

        <button className="mt-4 w-full rounded-xl bg-purple-600 py-2 text-white transition hover:bg-purple-700">
          {t('consultar')}
        </button>
      </div>
    </article>
  );
}
