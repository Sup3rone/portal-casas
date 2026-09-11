import { useLocale } from 'next-intl';

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
};

export default function PropertyCard({ property }: { property: DbProperty }) {
  const locale = useLocale() as 'es' | 'en' | 'fr';
  const title =
    locale === 'es' ? property.titleEs
    : locale === 'en' ? property.titleEn
    : property.titleFr;

  return (
    <article className="overflow-hidden rounded-2xl bg-white shadow-sm">
      <div className="p-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-gray-500">{property.city}</p>
        <p className="mt-2 text-sm text-gray-600">
          {property.maxGuests} huéspedes · {property.bedrooms} hab. · {property.bathrooms} baños
        </p>
      </div>
    </article>
  );
}
