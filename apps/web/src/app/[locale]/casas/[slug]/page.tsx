// apps/web/src/app/[locale]/casas/[slug]/page.tsx
import { db, properties, media, bookings, seasonRates } from '@portal/db';
import { eq, and } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import MessageForm from '@/components/MessageForm';
import AvailabilityCalendar from '@/components/AvailabilityCalendar';
import SectionSlider from '@/components/SectionSlider';
import CategorySection from '@/components/CategorySection';
import LocationMap from '@/components/LocationMap';

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
  const porCategoria = (cat: string) =>
    mediaList.filter((m) => m.category === cat);

  const principal = porCategoria('principal').length > 0
    ? porCategoria('principal')
    : mediaList; // fallback: si nada tiene categoría, todo es principal

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
    <main
      className="min-h-screen"
      style={{
        backgroundImage: "url('/images 2/detalle-bg.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* ===== HERO: imagen de fondo a pantalla completa ===== */}
      <section className="relative h-screen overflow-hidden">
        {principal.length > 0 && <SectionSlider slides={principal} fullscreen />}
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute inset-x-0 top-24 z-10 px-6 text-center">
          <h1 className="text-3xl font-light tracking-[0.3em] text-white md:text-5xl">
            {title.toUpperCase()}
          </h1>
          <p className="mt-4 text-[0.65rem] tracking-[0.25em] text-white/80">
            {property.city.toUpperCase()} · {property.maxGuests} {t('details.guests')} · {property.bedrooms} {t('details.bedrooms')} · {property.bathrooms} {t('details.bathrooms')}
          </p>
        </div>
      </section>

      {/* ===== PEQUEÑA DESCRIPCIÓN ===== */}
      <section className="mx-auto max-w-2xl px-6 py-16 text-center">
        <p className="whitespace-pre-wrap leading-relaxed text-gray-900/90 bg-white/70 backdrop-blur-sm p-6 rounded-xl font-light">
          {description}
        </p>
      </section>

      {/* ===== EL DESTINO: info + mapa + amenities (3 columnas en desktop) ===== */}
      {property.lat != null && property.lng != null && (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8 px-6 py-16 max-w-7xl mx-auto">
          {/* Columna 1: Título + descripción */}
          <div className="flex flex-col justify-center">
            <h2 className="mb-8 text-2xl font-light tracking-[0.3em] text-gray-900">
              EL DESTINO
            </h2>
            <p className="text-sm font-light leading-relaxed text-gray-600">
              {property.address}, {property.city}
            </p>
          </div>

          {/* Columna 2: Mapa (cuadro más pequeño) */}
          <div className="w-full">
            <LocationMap lat={property.lat} lng={property.lng} address={property.address} />
          </div>

          {/* Columna 3: Lo que ofrece este lugar */}
          <div className="flex flex-col justify-center">
            <h2 className="mb-8 text-2xl font-light tracking-[0.3em] text-gray-900">
              LO QUE OFRECE ESTE LUGAR
            </h2>
            <ul className="space-y-4">
              {[
                { icon: '🌊', label: 'Vista al mar' },
                { icon: '🏊', label: 'Acceso a la playa frente a la playa' },
                { icon: '📶', label: 'WiFi' },
                { icon: '🅿️', label: 'Estacionamiento gratuito en las instalaciones' },
                { icon: '🍳', label: 'Cocina' },
                { icon: '📺', label: 'Televisión' },
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-4 border-b border-gray-100 pb-3 last:border-0">
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-sm font-light tracking-wide text-gray-600">{item.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ===== AMENIDADES: info + imagen ===== */}
      <CategorySection
        label="AMENIDADES"
        slides={porCategoria('amenidades')}
        items={[
          { icon: '📶', label: 'WiFi de alta velocidad' },
          { icon: '🍳', label: 'Cocina equipada' },
          { icon: '❄️', label: 'Aire acondicionado' },
          { icon: '🏊', label: 'Piscina' },
          { icon: '🅿️', label: 'Estacionamiento gratuito' },
        ]}
      />

      {/* ===== HABITACIONES: imagen + info (invertido) ===== */}
      <CategorySection
        label="HABITACIONES"
        slides={porCategoria('habitaciones')}
        reverse
        items={[
          { icon: '🛏️', label: 'Recámaras con ropa de cama premium' },
          { icon: '🛁', label: 'Baños completos' },
        ]}
      />

      {/* ===== RESERVAR: calendario izquierda, formulario derecha ===== */}
      <section id="reservar" className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-10 text-center text-3xl font-light tracking-[0.35em] text-gray-900 md:text-4xl">
            RESERVAR
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* Columna izquierda: Calendario */}
            <div className="rounded-2xl bg-white/80 backdrop-blur-sm p-6 shadow-xl ring-1 ring-white/20">
              <h3 className="mb-3 text-[0.65rem] tracking-[0.25em] text-gray-400 uppercase">
                DISPONIBILIDAD
              </h3>
              <AvailabilityCalendar bookings={bookingRows} />
            </div>

            {/* Columna derecha: Formulario */}
            <div className="rounded-2xl bg-white/80 backdrop-blur-sm p-6 shadow-xl ring-1 ring-white/20">
              <MessageForm propertyId={property.id} locale={locale} pricing={pricing} compact />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
