import { getTranslations } from 'next-intl/server';
import { prisma } from '@portal/db';
import PropertyCard from '@/components/PropertyCard';

export default async function PropertiesPage() {
  const properties = await prisma.property.findMany({
    where: { published: true },
    include: { media: { orderBy: { order: 'asc' }, take: 1 } }
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="mb-8 text-3xl font-bold">Nuestras propiedades</h1>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {properties.map((p) => (
          <PropertyCard key={p.id} property={p} />
        ))}
      </div>
    </main>
  );
}
