// apps/web/src/app/[locale]/casas/[slug]/page.tsx
import { db, properties, media, bookings, seasonRates } from '@portal/db';
import { eq, and } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import MessageForm from '@/components/MessageForm';
import AvailabilityCalendar from '@/components/AvailabilityCalendar';
import ReservationDatesProvider from '@/components/ReservationDatesProvider';
import PropertyGallery from '@/components/PropertyGallery';
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
    principal: t('details.lugar'),
    habitaciones: t('details.habitaciones'),
    amenidades: t('details.amenidades'),
    lugar: t('details.enLugar'),
  };

  // Datos para los 4 cuadros con popup
  const categoryData = {
    mapEmbedUrl:
      property.lat != null && property.lng != null
        ? `https://maps.google.com/maps?q=${property.lat},${property.lng}&z=15&output=embed`
        : null,
    amenities: [
      { icon: '📶', label: t('details.amenities.wifiRapido') },
      { icon: '🍳', label: t('details.amenities.cocinaEquipada') },
      { icon: '❄️', label: t('details.amenities.aire') },
      { icon: '🏊', label: t('details.amenities.piscina') },
      { icon: '🅿️', label: t('details.amenities.estacionamiento') },
      { icon: '📺', label: t('details.amenities.smartTV') },
      { icon: '🌊', label: t('details.amenities.frenteMar') },
      { icon: '🧺', label: t('details.amenities.lavadora') },
    ],
    roomSlides: mediaList.filter((m) => m.category === 'habitaciones'),
    placeOffers: [
      { icon: '🌿', label: t('details.amenities.terraza') },
      { icon: '🛗', label: t('details.amenities.ascensor') },
      { icon: '🔒', label: t('details.amenities.seguridad') },
      { icon: '🧹', label: t('details.amenities.limpieza') },
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
      {/* ===== GALERÍA PRINCIPAL: mosaico con lightbox ===== */}
      <section className="mx-auto max-w-7xl px-3 py-8 md:px-6">
        <div className="mb-6 rounded-2xl bg-black/30 p-6 text-center">
          <h1 className="break-words text-3xl font-light tracking-[0.3em] text-white max-md:text-2xl max-md:tracking-[0.15em] md:text-5xl">
            {title.toUpperCase()}
          </h1>
          <p className="mt-4 text-[0.65rem] tracking-[0.25em] text-white/80">
            {property.city.toUpperCase()} · {property.maxGuests} {t('details.guests')} · {property.bedrooms} {t('details.bedrooms')} · {property.bathrooms} {t('details.bathrooms')}
          </p>
        </div>
        <PropertyGallery slides={principal} />
      </section>

      {/* ===== PEQUEÑA DESCRIPCIÓN ===== */}
      <section className="mx-auto max-w-2xl px-6 py-16 text-center">
        <div className="rounded-2xl bg-white/85 backdrop-blur-md p-6 shadow-xl ring-1 ring-white/40">
          <p className="whitespace-pre-wrap leading-relaxed text-gray-700 font-light">
            {description}
          </p>
        </div>
      </section>

      {/* ===== EL DESTINO + LO QUE OFRECE — widgets flotantes ===== */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-7xl">

          {/* Fila de widgets: destino+mapa | lo que ofrece */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* Widget 1: EL DESTINO — título arriba, mapa ABAJO */}
            <div className="rounded-2xl bg-white/85 backdrop-blur-md p-6 shadow-xl ring-1 ring-white/40">
              <h2 className="mb-4 text-center text-2xl font-light tracking-[0.3em] text-gray-900">
                {t('details.destino')}
              </h2>
              <p className="mb-6 text-center text-sm font-light leading-relaxed text-gray-600">
                {property.address}, {property.city}
              </p>
              {/* Mapa adentro del cuadro, debajo de las letras */}
              <div className="overflow-hidden rounded-lg">
                {property.lat != null && property.lng != null && (
                  <LocationMap lat={property.lat} lng={property.lng} address={property.address} propertyTitle={title} />
                )}
              </div>
            </div>

            {/* Widget 2: LO QUE OFRECE ESTE LUGAR */}
            <div className="rounded-2xl bg-white/85 backdrop-blur-md p-6 shadow-xl ring-1 ring-white/40">
              <h2 className="mb-6 text-center text-2xl font-light tracking-[0.3em] text-gray-900">
                {t('details.ofrece')}
              </h2>
              <ul className="space-y-4">
                {[
                  { icon: '🌊', label: t('details.amenities.vistaMar') },
                  { icon: '🏊', label: t('details.amenities.accesoPlaya') },
                  { icon: '📶', label: t('details.amenities.wifi') },
                  { icon: '🅿️', label: t('details.amenities.estacionamiento') },
                  { icon: '🍳', label: t('details.amenities.cocina') },
                  { icon: '📺', label: t('details.amenities.television') },
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-4 border-b border-gray-100 pb-3 last:border-0">
                    <span className="text-lg">{item.icon}</span>
                    <span className="text-sm font-light tracking-wide text-gray-700">{item.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ===== AMENIDADES: info + imagen ===== */}
      <CategorySection
        label={t('details.amenidades')}
        slides={porCategoria('amenidades')}
        items={[
          { icon: '📶', label: t('details.amenities.wifiRapido') },
          { icon: '🍳', label: t('details.amenities.cocinaEquipada') },
          { icon: '❄️', label: t('details.amenities.aire') },
          { icon: '🏊', label: t('details.amenities.piscina') },
          { icon: '🅿️', label: t('details.amenities.estacionamiento') },
        ]}
      />

      {/* ===== HABITACIONES: imagen + info (invertido) ===== */}
      <CategorySection
        label={t('details.habitaciones')}
        slides={porCategoria('habitaciones')}
        reverse
        items={[
          { icon: '🛏️', label: t('details.amenities.ropaCama') },
          { icon: '🛁', label: t('details.amenities.banos') },
        ]}
      />

      {/* ===== RESERVAR: calendario izquierda, formulario derecha ===== */}
      <section id="reservar" className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-10 text-center text-3xl font-light tracking-[0.35em] text-gray-900 md:text-4xl">
            {t('details.reservar')}
          </h2>
          <ReservationDatesProvider key={property.id}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* Columna izquierda: Calendario */}
            <div className="glass-panel rounded-2xl p-6 shadow-xl ring-1 ring-white/20">
              <h3 className="mb-3 text-[0.65rem] tracking-[0.25em] text-gray-400 uppercase">
                {t('details.disponibilidad').toUpperCase()}
              </h3>
              <AvailabilityCalendar bookings={bookingRows} />
            </div>

            {/* Columna derecha: Formulario */}
            <div className="glass-panel rounded-2xl p-6 shadow-xl ring-1 ring-white/20">
              <MessageForm propertyId={property.id} locale={locale} pricing={pricing} maxGuests={property.maxGuests} compact />
            </div>
          </div>
          </ReservationDatesProvider>
        </div>
      </section>
    </main>
  );
}
