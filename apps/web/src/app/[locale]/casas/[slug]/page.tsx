// apps/web/src/app/[locale]/casas/[slug]/page.tsx
import { db, properties, media, bookings, seasonRates } from '@portal/db';
import { eq, and } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import MessageForm from '@/components/MessageForm';
import AvailabilityCalendar from '@/components/AvailabilityCalendar';
import Gallery from "@/components/Gallery";
import LocationMap from "@/components/LocationMap";
import SectionSlider from '@/components/SectionSlider';

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

  // Tarifas de temporada para esta propiedad
  const rateRows = await db
    .select()
    .from(seasonRates)
    .where(eq(seasonRates.propertyId, property.id));

  const pricing = {
    base: {
      weekday: property.baseWeekdayPrice,
      weekend: property.baseWeekendPrice,
    },
    seasons: rateRows.map(r => ({
      start: r.startDate,
      end: r.endDate,
      weekday: r.weekdayPrice,
      weekend: r.weekendPrice,
      priority: r.priority,
    })),
    booked: bookingRows.map(b => ({ start: b.startDate, end: b.endDate })),
  };
  // Determinar textos según idioma
  const localeMap: Record<string, { title: string; desc: string }> = {
    es: { title: property.titleEs, desc: property.descEs },
    en: { title: property.titleEn, desc: property.descEn },
    fr: { title: property.titleFr, desc: property.descFr },
  };
  const { title, desc: description } = localeMap[locale] ?? localeMap.es;

  // Agrupar medias por categoría
  const categorias = ['principal', 'habitaciones', 'amenidades', 'lugar'] as const;

  const secciones = categorias.map((cat) => ({
    categoria: cat,
    slides: mediaList.filter((m) => m.category === cat),
  })).filter((s) => s.slides.length > 0);

  const labels: Record<string, string> = {
    principal: 'EL LUGAR',
    habitaciones: 'HABITACIONES',
    amenidades: 'AMENIDADES',
    lugar: 'EN EL LUGAR',
  };

  return (
    <main className="min-h-screen">
      {/* ===== SECCIÓN 0: título + slider principal ===== */}
      <section className="mx-auto max-w-7xl px-6 pt-12">
        <h1 className="mb-2 text-4xl font-light tracking-[0.2em] text-gray-900">
          {title.toUpperCase()}
        </h1>
        <p className="mb-8 text-sm text-gray-500">
          {property.city} · {property.maxGuests} {t('details.guests')} · {property.bedrooms} {t('details.bedrooms')} · {property.bathrooms} {t('details.bathrooms')}
        </p>

        {secciones.length > 0 ? (
          <SectionSlider slides={secciones[0].slides} />
        ) : mediaList.length > 0 ? (
          <SectionSlider slides={mediaList} />
        ) : null}
      </section>

      {/* ===== PEQUEÑA DESCRIPCIÓN — "antes de dar scroll" ===== */}
      <section className="mx-auto max-w-2xl px-6 py-16 text-center">
        <p className="whitespace-pre-wrap leading-relaxed text-gray-700">{description}</p>
      </section>

      {/* ===== SECCIONES DE SCROLL ===== */}
      {secciones.slice(1).map(({ categoria, slides }) => (
        <section key={categoria} className="mx-auto max-w-6xl px-6 pb-24">
          <SectionSlider slides={slides} />
          <h2 className="mt-6 text-center text-2xl font-light tracking-[0.25em] text-gray-900">
            {labels[categoria]}
          </h2>
        </section>
      ))}

      {/* ===== UBICACIÓN ===== */}
      {property.lat != null && property.lng != null && (
        <section className="mx-auto max-w-6xl px-6 pb-24">
          <h2 className="mb-6 text-center text-2xl font-light tracking-[0.25em] text-gray-900">
            {t('details.location').toUpperCase()}
          </h2>
          <LocationMap lat={property.lat} lng={property.lng} address={property.address} />
        </section>
      )}

      {/* ===== RESERVAR ===== */}
      <section id="reservar" className="mx-auto max-w-3xl px-6 pb-24">
        <div className="rounded-2xl bg-white p-8 shadow-xl ring-1 ring-gray-100">
          <h2 className="mb-6 text-center text-2xl font-light tracking-[0.25em] text-gray-900">
            RESERVAR
          </h2>
          <div className="mb-6">
            <h3 className="mb-2 text-sm font-medium text-gray-500">
              DISPONIBILIDAD
            </h3>
            <AvailabilityCalendar bookings={bookingRows} />
          </div>
          <hr className="my-6 border-gray-200" />
          <MessageForm propertyId={property.id} locale={locale} pricing={pricing} />
        </div>
      </section>
    </main>
  );
}
