// apps/web/src/app/[locale]/casas/[slug]/page.tsx
import { db, properties, media, bookings  } from '@portal/db';
import { eq, and } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import MessageForm from '@/components/MessageForm';
import AvailabilityCalendar from '@/components/AvailabilityCalendar';
import Gallery from "@/components/Gallery";
import LocationMap from "@/components/LocationMap";

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
      <Gallery media={mediaList} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-semibold mb-4">{t('details.description')}</h2>
          <p className="whitespace-pre-wrap text-gray-700">{description}</p>

          <div className="mt-6 grid grid-cols-3 gap-4 text-sm">
            <div><strong>{t('details.guests')}:</strong> {property.maxGuests}</div>
            <div><strong>{t('details.bedrooms')}:</strong> {property.bedrooms}</div>
            <div><strong>{t('details.bathrooms')}:</strong> {property.bathrooms}</div>
            {/* Ubicación */}
            <h2 className="text-2xl font-semibold mt-10 mb-4">{t('details.location')}</h2>
            {property.lat != null && property.lng != null ? (
              <LocationMap lat={property.lat} lng={property.lng} address={property.address} />
            ) : null}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
            {/* Disponibilidad */}
            <h3 className="text-lg font-bold mb-4 text-gray-900">Disponibilidad</h3>
            <div className="mb-6">
              <AvailabilityCalendar bookings={bookingRows} />
            </div>

            {/* Línea divisoria */}
            <hr className="my-6 border-gray-200" />

            {/* Formulario de consulta */}
            <h3 className="text-xl font-bold mb-4 text-gray-900">{t('details.inquire')}</h3>
            <MessageForm propertyId={property.id} locale={locale} />
          </div>
        </div>
      </div>
    </div>
  );
}
