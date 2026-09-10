import { useTranslations } from 'next-intl';
import PropertyCard from '@/components/PropertyCard';
import { fakeProperties } from '@/data/properties';

export default function PropertiesPage() {
  const t = useTranslations('properties');

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="mb-8 text-3xl font-bold">{t('titulo')}</h1>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {fakeProperties.map((p) => (
          <PropertyCard key={p.id} property={p} />
        ))}
      </div>
    </main>
  );
}
