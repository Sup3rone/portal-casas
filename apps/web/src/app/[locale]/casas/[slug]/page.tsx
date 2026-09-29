// apps/web/src/app/[locale]/casas/[slug]/page.tsx
import { db, properties, media, bookings, seasonRates } from '@portal/db';
import { eq, and } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import MessageForm from '@/components/MessageForm';
import AvailabilityCalendar from '@/components/AvailabilityCalendar';
import SectionSlider from '@/components/SectionSlider';
import CategoryGrid from '@/components/CategoryGrid';

export async function generateStaticParams() {
  const props = await db.select({ slug: properties.slug }).from(properties).where(eq(properties.published, true));
  return props.map((p) => ({ slug: p.slug }));
}

export default async function PropertyPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale });

  const propertyList = await db
    .select()
    .from(properties)
    .where(and(eq(properties.slug, slug), eq(properties.published, true)))
    .limit(1);

  if (propertyList.length === 0) notFound();
  const property = propertyList[0];

  const mediaList = await db
    .select()
    .from(media)
    .where(eq(media.propertyId, property.id))
    .orderBy(media.order);

  const bookingRows = await db
    .select({ startDate: bookings.startDate, endDate: bookings.endDate })
    .from(bookings)
    .where(eq(bookings.propertyId, property.id))
    .orderBy(bookings.startDate);

  const rateRows = await db
    .select()
    .from(seasonRates)
    .where(eq(seasonRates.propertyId, property.id));

  const pricing = {
    base: { weekday: property.baseWeekdayPrice, weekend: property.baseWeekendPrice },
    seasons: rateRows.map(r => ({
      start: r.startDate, end: r.endDate,
      weekday: r.weekdayPrice, weekend: r.weekendPrice, priority: r.priority,
    })),
    booked: bookingRows.map(b => ({ start: b.startDate, end: b.endDate })),
  };

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

  const principal = secciones.find((s) => s.categoria === 'principal');
  const restantes = secciones.filter((s) => s !== principal);

  const labels: Record<string, string> = {
    principal: 'EL LUGAR',
    habitaciones: 'HABITACIONES',
    amenidades: 'AMENIDADES',
    lugar: 'EN EL LUGAR',
  };

  // Datos para los 4 cuadros con popup
  const categoryData = {
    mapEmbedUrl:
      property.lat != null && property.lng != null
        ? `https://maps.google.com/maps?q=${property.lat},${property.lng}&z=15&output=embed`
        : null,
    amenities: [
      { icon: '📶', label: 'WiFi de alta velocidad' },
      { icon: '🍳', label: 'Cocina equipada' },
      { icon: '❄️', label: 'Aire acondicionado' },
      { icon: '🏊', label: 'Piscina' },
      { icon: '🅿️', label: 'Estacionamiento gratuito' },
      { icon: '📺', label: 'Smart TV' },
      { icon: '🌊', label: 'Frente al mar' },
      { icon: '🧺', label: 'Lavadora y secadora' },
    ],
    roomSlides: mediaList.filter((m) => m.category === 'habitaciones'),
    placeOffers: [
      { icon: '🌿', label: 'Terraza con vista al mar' },
      { icon: '🛗', label: 'Ascensor' },
      { icon: '🔒', label: 'Seguridad 24/7' },
      { icon: '🧹', label: 'Limpieza profesional' },
    ],
  };

  return (
    <main className="min-h-screen bg-white">
      {/* ===== DIAPOSITIVA 1: título arriba, slider PEGADO ABAJO ===== */}
      <section className="flex h-screen flex-col items-center justify-start px-6 pt-24 md:pt-32">
        <h1 className="text-center text-3xl font-light tracking-[0.3em] text-gray-900 md:text-5xl">
          {title.toUpperCase()}
        </h1>
        <p className="mt-4 text-center text-[0.65rem] tracking-[0.25em] text-gray-400">
          {property.city.toUpperCase()} · {property.maxGuests} {t('details.guests')} · {property.bedrooms} {t('details.bedrooms')} · {property.bathrooms} {t('details.bathrooms')}
        </p>
        {/* Descripción breve ANTES del scroll */}
        <p className="mx-auto mt-8 max-w-2xl text-center text-sm font-light leading-relaxed text-gray-500">
          {description.split('\n')[0]}
        </p>
        {/* Slider anclado hasta abajo de la pantalla */}
        <div className="mt-auto w-full max-w-6xl pb-8">
          {principal ? (
            <SectionSlider slides={principal.slides} />
          ) : mediaList.length > 0 ? (
            <SectionSlider slides={mediaList} />
          ) : null}
        </div>
      </section>

      {/* ===== DIAPOSITIVA 2: los 4 cuadros (destino/amenidades/habitaciones/lugar) ===== */}
      <section className="flex h-screen flex-col items-center justify-center px-6">
        <p className="mb-6 text-[0.65rem] tracking-[0.25em] text-gray-400">ELIGE UNA CATEGORÍA</p>
        <div className="w-full max-w-4xl">
          <CategoryGrid data={categoryData} />
        </div>
        {/* Slider de apoyo debajo de los cuadros */}
        {restantes.length > 0 && (
          <div className="mt-10 hidden w-full max-w-4xl md:block">
            <SectionSlider slides={restantes[0].slides} />
          </div>
        )}
      </section>

      {/* ===== DIAPOSITIVAS DE CATEGORÍA: título arriba, slider ABAJO ===== */}
      {restantes.slice(1).map(({ categoria, slides }) => (
        <section key={categoria} className="flex h-screen flex-col items-center px-6 pt-24">
          <h2 className="text-center text-2xl font-light tracking-[0.35em] text-gray-900 md:text-3xl">
            {labels[categoria]}
          </h2>
          <div className="mt-auto w-full max-w-6xl pb-8">
            <SectionSlider slides={slides} />
          </div>
        </section>
      ))}

      {/* ===== DIAPOSITIVA FINAL: RESERVAR ===== */}
      <section id="reservar" className="flex min-h-screen flex-col items-center justify-center px-6 py-24">
        <h2 className="mb-10 text-center text-2xl font-light tracking-[0.35em] text-gray-900 md:text-3xl">
          RESERVAR
        </h2>
        <div className="w-full max-w-3xl">
          <div className="rounded-2xl bg-white p-8 shadow-xl ring-1 ring-gray-100 md:p-12">
            <h3 className="mb-3 text-[0.65rem] tracking-[0.25em] text-gray-400">
              DISPONIBILIDAD
            </h3>
            <AvailabilityCalendar bookings={bookingRows} />
            <hr className="my-8 border-gray-200" />
            <MessageForm propertyId={property.id} locale={locale} pricing={pricing} />
          </div>
        </div>
      </section>
    </main>
  );
}
