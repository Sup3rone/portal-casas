// apps/web/src/app/[locale]/casas/[slug]/page.tsx
import { db, properties, media, bookings  } from '@portal/db';
import { eq, and } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import MessageForm from '@/components/MessageForm';
import AvailabilityCalendar from '@/components/AvailabilityCalendar';

export async function generateStaticParams() {
  const props = await db.select({ slug: properties.slug }).from(properties).where(eq(properties.published, true));
  return props.map((p) => ({ slug: p.slug }));
}

export default async function PropertyPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale });

  // Buscar la propiedad
  const propertyList = await db
    .select()
    .from(properties)
    .where(and(eq(properties.slug, slug), eq(properties.published, true)))
    .limit(1);

  if (propertyList.length === 0) {
    notFound();
  }

  const property = propertyList[0];

  // Obtener todas las medias asociadas
  const mediaList = await db
    .select()
    .from(media)
    .where(eq(media.propertyId, property.id))
    .orderBy(media.order);

  // Reservas de esta propiedad
  const bookingRows = await db
    .select({
      startDate: bookings.startDate,
      endDate: bookings.endDate,
    })
    .from(bookings)
    .where(eq(bookings.propertyId, property.id))
    .orderBy(bookings.startDate);

  // Determinar textos según idioma
  const localeMap: Record<string, { title: string; desc: string }> = {
    es: { title: property.titleEs, desc: property.descEs },
    en: { title: property.titleEn, desc: property.descEn },
    fr: { title: property.titleFr, desc: property.descFr },
  };
  const { title, desc: description } = localeMap[locale] ?? localeMap.es;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-6">{title}</h1>

      {/* Galería Principal */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {mediaList.length > 0 ? (
          mediaList.map((m, idx) => (
            <div key={m.id} className={`relative aspect-video overflow-hidden rounded-lg ${idx === 0 ? 'md:col-span-2 row-span-2' : ''}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={m.url}
                alt={`${title} - Foto ${idx + 1}`}
                className="h-full w-full object-cover"
              />
            </div>
          ))
        ) : (
          <p className="text-gray-500 italic">{t('common.noImages')}</p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-semibold mb-4">{t('details.description')}</h2>
          <p className="whitespace-pre-wrap text-gray-700">{description}</p>

          <div className="mt-6 grid grid-cols-3 gap-4 text-sm">
            <div><strong>{t('details.guests')}:</strong> {property.maxGuests}</div>
            <div><strong>{t('details.bedrooms')}:</strong> {property.bedrooms}</div>
            <div><strong>{t('details.bathrooms')}:</strong> {property.bathrooms}</div>
          </div>
        </div>

        <div className="lg:col-span-1">
          {/* Calendario de disponibilidad */}
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 mb-6">
            <h3 className="text-lg font-bold mb-4">Disponibilidad</h3>
            <AvailabilityCalendar bookings={bookingRows} />
          </div>

          {/* Formulario de consulta */}
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
            <h3 className="text-xl font-bold mb-4">{t('details.inquire')}</h3>
            <MessageForm propertyId={property.id} locale={locale} />
          </div>
        </div>
      </div>
    </div>
  );
}
