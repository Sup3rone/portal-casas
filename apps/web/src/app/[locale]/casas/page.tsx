import { getTranslations } from 'next-intl/server';
import { asc, eq } from 'drizzle-orm';
import { db, properties, media } from '@portal/db';
import PropertyCard from '@/components/PropertyCard';


export default async function PropertiesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  // Propiedades publicadas + su primera foto (order asc)
  const rows = await db
    .select({ property: properties, m: media })
    .from(properties)
    .leftJoin(media, eq(media.propertyId, properties.id))
    .where(eq(properties.published, true))
    .orderBy(asc(properties.createdAt), asc(media.order));

  // Deduplicar: el leftJoin repite la propiedad por cada foto; nos quedamos la primera (order más bajo)
  const seen = new Set<string>();

  const propertyList = [];
  for (const row of rows) {
    if (seen.has(row.property.id)) continue;
    seen.add(row.property.id);
    propertyList.push({ ...row.property, media: row.m ? [row.m] : [] });
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-gray-900">
        {t('properties.titulo')}
      </h1>
      <p className="mb-10 text-lg text-gray-600 max-w-2xl">
        {t('properties.subtitulo')}
      </p>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {propertyList.map((p) => (
          <PropertyCard key={p.id} property={p} />
        ))}
      </div>
    </main>
  );
}
