// apps/web/src/app/[locale]/casas/[slug]/page.tsx
import { db, properties, media, bookings, seasonRates, propertySections } from '@portal/db';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import MessageForm from '@/components/MessageForm';
import AvailabilityCalendar from '@/components/AvailabilityCalendar';
import ReservationDatesProvider from '@/components/ReservationDatesProvider';
import PropertyGallery from '@/components/PropertyGallery';
import SectionBackground from '@/components/SectionBackground';
import CategorySection from '@/components/CategorySection';
import LocationMap from '@/components/LocationMap';
import PropertyShareButton from '@/components/PropertyShareButton';
import Image from 'next/image';
import EditorialPresentation, { DetailSectionTransitions } from '@/components/EditorialPresentation';
import { editorialPresentation } from '@/lib/editorial-presentation';
import { propertyBlocks } from '@/lib/occupation-calendar';
import Reveal from '@/components/Reveal';
import PropertyDetailScroll from '@/components/PropertyDetailScroll';
import Footer from '@/components/Footer';
import DetailFooterFlow from '@/components/DetailFooterFlow';
import { descriptionExcerpt, pageMetadata } from '@/lib/seo';
import { propertySeoPhoto, readPublishedProperty } from '@/lib/seo-property';
import { publicFrenchText } from '@/i18n/public-french-text';

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const property = await readPublishedProperty(slug);
  if (!property) notFound();
  const title = (locale === 'en' ? property.titleEn : locale === 'fr' ? property.titleFr : property.titleEs).trim() || property.titleEs;
  const description = locale === 'en' ? property.descEn : locale === 'fr' ? property.descFr : property.descEs;
  return pageMetadata(locale, `/casas/${encodeURIComponent(slug)}`, title, descriptionExcerpt(description || ''), await propertySeoPhoto(property.id));
}

export async function generateStaticParams() {
  const props = await db.select({ slug: properties.slug }).from(properties).where(eq(properties.published, true));
  return props.map((p) => ({ slug: p.slug }));
}

export default async function PropertyPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale });

  const property = await readPublishedProperty(slug);
  if (!property) notFound();

  const mediaList = await db
    .select()
    .from(media)
    .where(eq(media.propertyId, property.id))
    .orderBy(media.order);
  const sectionRows = await db.select().from(propertySections).where(eq(propertySections.propertyId, property.id));
  const editorial = editorialPresentation(property.id, locale, sectionRows, mediaList)
    .map(slide => locale === 'fr' ? { ...slide, description: publicFrenchText(slide.description) } : slide)
    .filter(slide => Boolean(slide.description || slide.hero || slide.photos.length));
  const warnings = sectionRows.find(row => row.section === 'advertencias');
  const warningDescription = locale === 'fr' ? publicFrenchText(warnings?.descriptionFr) : (locale === 'en' ? warnings?.descriptionEn : warnings?.descriptionEs)?.trim() || '';
  const warningHero = mediaList.find(item => item.id === warnings?.heroMediaId && item.type === 'PHOTO');
  const hasWarnings = Boolean(warningDescription || warningHero);
  const hasMap = property.lat != null && property.lng != null;
  const hasEditorial = (name: string) => editorial.some(slide => slide.section === name);

  const bookingRows = await db
    .select({ startDate: bookings.startDate, endDate: bookings.endDate })
    .from(bookings)
    .where(eq(bookings.propertyId, property.id))
    .orderBy(bookings.startDate);
  bookingRows.push(...await propertyBlocks(property.id));

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
  const { title, desc } = localeMap[locale] ?? localeMap.es;
  const description = locale === 'fr' ? publicFrenchText(desc) : desc?.trim() || '';
  const location = [property.address?.trim(), property.city?.trim()].filter(Boolean).join(', ');

  // Agrupar medias por categoría
  const porCategoria = (cat: string) =>
    mediaList.filter((m) => m.category === cat);

  const principal = porCategoria('principal').length > 0
    ? porCategoria('principal')
    : mediaList; // fallback: si nada tiene categoría, todo es principal

  return (
    <PropertyDetailScroll key={property.id}>
      {[...new Set([property.sectionBgInicio || principal.find(item => item.type === 'PHOTO')?.url, ...editorial.map(slide => slide.hero?.url), property.sectionBgMapa, property.sectionBgReserva].filter((url): url is string => Boolean(url)))].map(url => <link key={url} rel="preload" as="image" href={url} />)}
      <DetailSectionTransitions className="detail-editorial detail-independent detail-snap-container detail-fullpage" tabIndex={0} data-detail-flow>
{/* ===== GALERÍA PRINCIPAL: mosaico con lightbox ===== */}
      <SectionBackground url={property.sectionBgInicio || principal.find(item => item.type === 'PHOTO')?.url} name="gallery" className="detail-screen px-3 py-8 md:px-6">
        <Reveal className={`relative mb-6 rounded-2xl ${property.sectionBgInicio ? 'detail-image-heading' : 'bg-black/30 dark:bg-black/50'} p-6 pr-16 text-center`}>
          <PropertyShareButton title={title} lat={property.lat} lng={property.lng} address={property.address} city={property.city} />
          <h1 className="break-words text-3xl font-light tracking-[0.3em] text-white dark:text-gray-100 max-md:text-2xl max-md:tracking-[0.15em] md:text-5xl">
            {title.toUpperCase()}
          </h1>
          {editorial.length > 0 && location && <p className="mt-3 break-words text-sm text-white/80">{location}</p>}
          <p className="mt-4 text-[0.65rem] tracking-[0.25em] text-white/80 dark:text-gray-200">
            {property.city.toUpperCase()} · {property.maxGuests} {t('details.guests')} · {property.bedrooms} {t('details.bedrooms')} · {property.bathrooms} {t('details.bathrooms')}
          </p>
        </Reveal>
        <PropertyGallery slides={principal} />
      {/* ===== PEQUEÑA DESCRIPCIÓN ===== */}
      {description && <Reveal as="div" className=" mx-auto max-w-2xl px-6 py-16 text-center">
        <div className="rounded-2xl bg-white/85 dark:bg-gray-900/85 backdrop-blur-md p-6 shadow-xl ring-1 ring-white/40 dark:ring-gray-700/50">
          <p className="whitespace-pre-wrap leading-relaxed text-gray-700 dark:text-gray-200 font-light">
            {description}
          </p>
        </div>
      </Reveal>}

      {/* ===== EL DESTINO — ubicación guardada ===== */}
      {editorial.length === 0 && location && (
      <div className="px-6 py-16">
        <div className="mx-auto max-w-7xl">

          {/* Ubicación real, sin listas genéricas */}
          <div className="grid grid-cols-1 gap-8">

            {/* Widget 1: EL DESTINO — título arriba, mapa ABAJO */}
            {editorial.length === 0 && (
            <Reveal className="rounded-2xl bg-white/85 dark:bg-gray-900/85 backdrop-blur-md p-6 shadow-xl ring-1 ring-white/40 dark:ring-gray-700/50">
              <h2 className="mb-4 text-center text-2xl font-light tracking-[0.3em] text-gray-900 dark:text-gray-100">
                {t('details.destino')}
              </h2>
              <p className="mb-6 text-center text-sm font-light leading-relaxed text-gray-600 dark:text-gray-300">
                {location}
              </p>

            </Reveal>

            )}

          </div>
        </div>
      </div>
      )}

      {/* ===== AMENIDADES: info + imagen ===== */}
      {porCategoria('amenidades').length > 0 && (!hasEditorial('amenidades') || porCategoria('amenidades').some(item => item.type === 'VIDEO')) && (
      <div className="mt-8"><CategorySection
        label={t('details.amenidades')}
        slides={porCategoria('amenidades')}
        items={[]}
      /></div>
      )}

      {/* ===== HABITACIONES: imagen + info (invertido) ===== */}
      {porCategoria('habitaciones').length > 0 && (!hasEditorial('habitaciones') || porCategoria('habitaciones').some(item => item.type === 'VIDEO')) && (
      <div className="mt-8"><CategorySection
        label={t('details.habitaciones')}
        slides={porCategoria('habitaciones')}
        reverse
        items={[]}
      /></div>
      )}


      </SectionBackground>
      {editorial.map(slide => <EditorialPresentation key={slide.section} slides={[slide]} />)}
      {(hasMap || hasWarnings) && (
<SectionBackground url={property.sectionBgMapa} name="location" className="detail-screen px-4 py-16 md:px-6" label={t('details.mapWarnings')}>
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 lg:grid-cols-2">
          {hasMap && <div className="detail-location-map min-w-0">
            <LocationMap lat={property.lat!} lng={property.lng!} address={property.address} propertyTitle={title} city={property.city} />
          </div>}
          {hasWarnings && <Reveal className="glass-panel min-w-0 rounded-2xl p-6 shadow-xl ring-1 ring-white/40 dark:ring-gray-700/50 text-gray-900 dark:text-gray-100">
            <h2 className="mb-4 text-2xl font-light tracking-wide">{t('details.advertencias')}</h2>
            {warningHero && <Image src={warningHero.url} alt={t('details.advertencias')} width={600} height={400} unoptimized className="mb-4 h-auto w-full rounded-lg object-cover" />}
            {warningDescription && <p className="whitespace-pre-wrap break-words leading-relaxed">{warningDescription}</p>}
          </Reveal>}
        </div>
      </SectionBackground>
      )}
<SectionBackground url={property.sectionBgReserva} id="reservar" name="reservation" className="detail-screen px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <Reveal as="h2" className={`mb-10 text-center text-3xl font-light tracking-[0.35em] text-gray-900 dark:text-gray-100 md:text-4xl${property.sectionBgReserva ? ' detail-image-heading' : ''}`}>
            {t('details.reservar')}
          </Reveal>
          <ReservationDatesProvider key={property.id}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* Columna izquierda: Calendario */}
            <Reveal className="glass-panel rounded-2xl p-6 shadow-xl ring-1 ring-white/20 dark:ring-gray-700/50">
              <h3 className="mb-3 text-[0.65rem] tracking-[0.25em] text-gray-400 dark:text-gray-300 uppercase">
                {t('details.disponibilidad').toUpperCase()}
              </h3>
              <AvailabilityCalendar bookings={bookingRows} />
            </Reveal>

            {/* Columna derecha: Formulario */}
            <Reveal className="glass-panel rounded-2xl p-6 shadow-xl ring-1 ring-white/20 dark:ring-gray-700/50">
              <MessageForm propertyId={property.id} locale={locale} pricing={pricing} maxGuests={property.maxGuests} compact />
              {property.whatsapp && <a href={`https://wa.me/${property.whatsapp}?text=${encodeURIComponent(t('details.whatsappMessage', { propertyName: title }))}`} target="_blank" rel="noopener noreferrer"
                className="mt-3 block w-full rounded-lg border border-green-700 px-4 py-3 text-center text-sm font-medium text-green-800 transition hover:bg-green-50 dark:border-green-400 dark:text-green-300 dark:hover:bg-green-950">{t('details.whatsappButton')}</a>}
            </Reveal>
          </div>
          </ReservationDatesProvider>
        </div>
      </SectionBackground>
      </DetailSectionTransitions>
      {editorial.length > 0 && <a href="#reservar" className="fixed bottom-6 left-6 z-40 hidden rounded-full bg-green-700 px-6 py-3 font-semibold text-white shadow-lg hover:bg-green-800 lg:flex">{t('details.reservar')}</a>}
      <DetailFooterFlow><Footer inDetail /></DetailFooterFlow>
    </PropertyDetailScroll>
  );
}
