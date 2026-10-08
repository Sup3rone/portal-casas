// src/app/[locale]/casas/page.tsx
import { getTranslations } from 'next-intl/server';
import { and, asc, eq, sql } from 'drizzle-orm';
import { db, properties, media } from '@portal/db';
import PropertyCard from '@/components/PropertyCard';

export default async function PropertiesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  const rows = await db
    .select({ property: properties, m: media })
    .from(properties)
    // Portada explícita (máximo cinco); sin selección, una PHOTO por orden.
    .leftJoin(media, and(eq(media.propertyId, properties.id), sql`${media.id} in (
      select candidate.id from "Media" candidate
      where candidate."propertyId" = ${properties.id} and candidate.type = 'PHOTO'
        and (candidate."isCover" or (not exists (
          select 1 from "Media" cover where cover."propertyId" = ${properties.id} and cover.type = 'PHOTO' and cover."isCover"
        ) and candidate.id = (
          select fallback.id from "Media" fallback
          where fallback."propertyId" = candidate."propertyId" and fallback.type = 'PHOTO'
          order by fallback."order" asc, fallback.id asc limit 1
        )))
      order by case when candidate."isCover" then candidate."coverOrder" else candidate."order" end asc, candidate.id asc
      limit 5
    )`))
    .where(eq(properties.published, true))
    .orderBy(asc(properties.createdAt), asc(properties.id), asc(media.coverOrder), asc(media.id));

  const grouped = new Map<string, typeof rows[number]['property'] & { media: NonNullable<typeof rows[number]['m']>[] }>();
  for (const row of rows) {
    const property = grouped.get(row.property.id) ?? { ...row.property, media: [] };
    if (row.m) property.media.push(row.m);
    grouped.set(row.property.id, property);
  }
  const propertyList = [...grouped.values()];

  return (
    <main className="relative min-h-screen">
      {/* IMAGEN DE FONDO COMPLETA */}
      <div className="absolute inset-0 h-full w-full">
        <img
          src="/images/listado-bg.jpg"
          alt=""
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/10 dark:bg-black/60" />
      </div>

      {/* CONTENIDO FLOTANTE ENCIMA */}
      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col items-center justify-center px-6 pb-24">
        <div className="mb-12 rounded-full bg-white/20 dark:bg-white/20 px-8 py-3 backdrop-blur-sm">
          <span className="text-sm font-medium tracking-widest text-white dark:text-gray-100">
            {t('properties.destinations')}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-3">
          {propertyList.map((p) => (
            <PropertyCard key={p.id} property={p} />
          ))}
        </div>
      </div>
    </main>
  );
}
