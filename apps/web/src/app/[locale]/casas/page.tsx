// src/app/[locale]/casas/page.tsx
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

  // Deduplicar: nos quedamos la primera foto de cada propiedad
  const seen = new Set<string>();
  const propertyList = [];
  for (const row of rows) {
    if (seen.has(row.property.id)) continue;
    seen.add(row.property.id);
    propertyList.push({ ...row.property, media: row.m ? [row.m] : [] });
  }

  return (
    <main className="relative min-h-screen">
      {/* IMAGEN DE FONDO COMPLETA */}
      <div className="absolute inset-0 h-full w-full">
        <img
          src="/images/listado-bg.jpg"
          alt=""
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/10" />
      </div>

      {/* CONTENIDO FLOTANTE ENCIMA */}
      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col items-center justify-center px-6 pb-24">
        <div className="mb-12 rounded-full bg-white/20 px-8 py-3 backdrop-blur-sm">
          <span className="text-sm font-medium tracking-widest text-white">
            DESTINOS
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
