import PropertyHeroVideo from '@/components/PropertyHeroVideo';
import { propertySectionLabels, sectionTitle, type PropertySectionKey } from '@/lib/property-presentation';
import { propertyLocation } from '@/lib/destinations';
// apps/web/src/app/[locale]/casas/[slug]/page.tsx
import { db, properties, media, bookings, seasonRates, propertySections } from '@portal/db';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import MessageForm from '@/components/MessageForm';
import { PropertyWhatsAppLink } from '@/components/SiteAnalytics';
import AvailabilityCalendar from '@/components/AvailabilityCalendar';
import ReservationDatesProvider from '@/components/ReservationDatesProvider';
import PropertyGallery from '@/components/PropertyGallery';
import SectionBackground from '@/components/SectionBackground';
import CategorySection from '@/components/CategorySection';
import LocationMap from '@/components/LocationMap';
import PropertyShareButton from '@/components/PropertyShareButton';
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

// Experimento conservado, pero desactivado: rueda y touch usan scroll nativo.
const DETAIL_FULLPAGE_ENABLED = false;

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
  const property = await readPublishedProperty(slug);
  if (!property) notFound();

  const isAnnual = property.rentalType === 'anual';
  const [mediaList, sectionRows, bookingRows, blockRows, rateRows, t] = await Promise.all([
    db.select().from(media).where(eq(media.propertyId, property.id)).orderBy(media.order),
    db.select().from(propertySections).where(eq(propertySections.propertyId, property.id)),
    isAnnual ? Promise.resolve<{ startDate: string; endDate: string }[]>([]) : db.select({ startDate: bookings.startDate, endDate: bookings.endDate })
      .from(bookings).where(eq(bookings.propertyId, property.id)).orderBy(bookings.startDate),
    isAnnual ? Promise.resolve([]) : propertyBlocks(property.id),
    isAnnual ? Promise.resolve([]) : db.select().from(seasonRates).where(eq(seasonRates.propertyId, property.id)),
    getTranslations({ locale }),
  ]);
  const titleFor = (section: PropertySectionKey) => sectionTitle(property.sectionTitles?.titles, section, locale, t('details.' + propertySectionLabels[section]));
  bookingRows.push(...blockRows);
  const editorial = editorialPresentation(property.id, locale, sectionRows, mediaList)
    .map(slide => locale === 'fr' ? { ...slide, description: publicFrenchText(slide.description) } : slide)
    .filter(slide => Boolean(slide.description || slide.photos.length))
    // Fondos descontinuados en UI; heroMediaId permanece intacto en BD.
    .map(slide => ({ ...slide, hero: undefined, title: titleFor(slide.section) }));
  const warnings = sectionRows.find(row => row.section === 'advertencias');
  const warningDescription = locale === 'fr' ? publicFrenchText(warnings?.descriptionFr) : (locale === 'en' ? warnings?.descriptionEn : warnings?.descriptionEs)?.trim() || '';
  const hasWarnings = Boolean(warningDescription);
  const hasMap = property.lat != null && property.lng != null;
  const hasEditorial = (name: string) => editorial.some(slide => slide.section === name);

  const pricing = isAnnual ? undefined : {
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
  const destination = propertyLocation(property);
  const location = [property.address?.trim(), destination].filter(Boolean).join(', ');

  // Agrupar medias por categoría
  const porCategoria = (cat: string) =>
    mediaList.filter((m) => m.category === cat);

  const principal = porCategoria('principal').length > 0
    ? porCategoria('principal')
    : mediaList; // fallback: si nada tiene categoría, todo es principal

  return (
    <PropertyDetailScroll key={property.id}>
      <DetailSectionTransitions className="detail-editorial detail-independent detail-snap-container detail-fullpage public-paper detail-zigzag" tabIndex={0} data-detail-flow data-fullpage-enabled={String(DETAIL_FULLPAGE_ENABLED)}>
{/* ===== GALERÍA PRINCIPAL: mosaico con lightbox ===== */}
      <SectionBackground url={null} name="gallery" className="detail-screen px-3 py-8 md:px-6">
        <div className="property-detail-hero" data-hero-video={property.sectionTitles?.heroVideoUrl ? 'true' : undefined}>
        {property.sectionTitles?.heroVideoUrl && <PropertyHeroVideo src={property.sectionTitles?.heroVideoUrl} poster={principal.find(item => item.type === 'PHOTO')?.url} />}
        <Reveal className="relative mb-6 rounded-2xl p-6 pr-16 text-center">
          <PropertyShareButton title={title} lat={property.lat} lng={property.lng} address={property.address} city={destination} />
          <h1 className="break-words text-3xl font-bold tracking-[0.3em] text-white dark:text-gray-100 max-md:text-2xl max-md:tracking-[0.15em] md:text-5xl">
            {title.toUpperCase()}
          </h1>
          {editorial.length > 0 && location && <p className="mt-3 break-words text-sm text-white/80">{location}</p>}
          <p className="mt-4 text-[0.65rem] tracking-[0.25em] text-white/80 dark:text-gray-200">
            {destination} · {property.maxGuests} {t('details.guests')} · {property.bedrooms} {t('details.bedrooms')} · {property.bathrooms} {t('details.bathrooms')}
          </p>
        </Reveal>
        </div>
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
                {titleFor('destino')}
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
      <div className="mt-8"><Reveal as="h2" className="mb-6 text-center text-2xl font-semibold">{titleFor('amenidades')}</Reveal><CategorySection
        label={titleFor('amenidades')}
        slides={porCategoria('amenidades')}
        items={[]}
      /></div>
      )}

      {/* ===== HABITACIONES: imagen + info (invertido) ===== */}
      {porCategoria('habitaciones').length > 0 && (!hasEditorial('habitaciones') || porCategoria('habitaciones').some(item => item.type === 'VIDEO')) && (
      <div className="mt-8"><Reveal as="h2" className="mb-6 text-center text-2xl font-semibold">{titleFor('habitaciones')}</Reveal><CategorySection
        label={titleFor('habitaciones')}
        slides={porCategoria('habitaciones')}
        reverse
        items={[]}
      /></div>
      )}


      </SectionBackground>
      {editorial.map(slide => <EditorialPresentation key={slide.section} slides={[slide]} />)}
      {(hasMap || hasWarnings) && (
<SectionBackground url={null} name="location" className="detail-screen px-4 py-16 md:px-6" label={titleFor('mapa')}>
        {hasMap && <Reveal as="h2" className="detail-lateral-reveal detail-from-right mb-8 text-center text-2xl font-semibold">{titleFor('mapa')}</Reveal>}
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 lg:grid-cols-2">
          {hasMap && <div className="detail-location-map min-w-0">
            <LocationMap lat={property.lat!} lng={property.lng!} address={property.address} propertyTitle={title} city={destination} />
          </div>}
          {hasWarnings && <Reveal className="detail-lateral-reveal detail-from-left glass-panel min-w-0 rounded-2xl p-6 shadow-xl ring-1 ring-white/40 dark:ring-gray-700/50 text-gray-900 dark:text-gray-100">
            <h2 className="mb-4 text-2xl font-light tracking-wide">{titleFor('advertencias')}</h2>
            {warningDescription && <p className="whitespace-pre-wrap break-words leading-relaxed">{warningDescription}</p>}
          </Reveal>}
        </div>
      </SectionBackground>
      )}
<SectionBackground url={null} id="reservar" name="reservation" className="detail-screen px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <Reveal as="h2" className="mb-10 text-center text-3xl font-light tracking-[0.35em] text-gray-900 dark:text-gray-100 md:text-4xl">
            {isAnnual ? t('details.annualContactTitle') : titleFor('reserva')}
          </Reveal>
          {isAnnual ? <ReservationDatesProvider key={property.id}>
            <div className={`grid grid-cols-1 gap-8${property.whatsapp || property.contactEmail ? ' lg:grid-cols-2' : ''}`}>
              <Reveal className="detail-reservation-form detail-lateral-reveal detail-from-left glass-panel min-w-0 rounded-2xl p-6 shadow-xl ring-1 ring-white/20 dark:ring-gray-700/50">
                <MessageForm propertyId={property.id} propertySlug={property.slug} locale={locale} mode="annual" compact />
              </Reveal>
              {(property.whatsapp || property.contactEmail) && <Reveal className="detail-lateral-reveal detail-from-right glass-panel min-w-0 rounded-2xl p-6 shadow-xl ring-1 ring-white/20 dark:ring-gray-700/50">
                <h3 className="mb-4 text-xl font-semibold">{t('details.contactTitle')}</h3>
                <div className="space-y-4">
                  {property.whatsapp && <PropertyWhatsAppLink propertySlug={property.slug} href={`https://wa.me/${property.whatsapp}?text=${encodeURIComponent(t('details.whatsappMessage', { propertyName: title }))}`} target="_blank" rel="noopener noreferrer"
                    className="flex min-h-11 min-w-11 items-center gap-3 rounded-lg border border-current px-4 py-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current">
                    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6 shrink-0"><path d="M21 11.5a9 9 0 0 1-13.3 7.9L3 21l1.6-4.7A9 9 0 1 1 21 11.5Z" /><path d="m8 7 2 3-1 1c1 2 2 3 4 4l1-1 3 2c-1 2-3 2-5 1-3-2-5-4-6-7 0-1 1-3 2-3Z" /></svg>
                    <span className="min-w-0 break-words"><span className="block">{t('details.contactWhatsapp')}</span>+{property.whatsapp}</span>
                  </PropertyWhatsAppLink>}
                  {property.contactEmail && <a href={`mailto:${property.contactEmail}`} className="flex min-h-11 min-w-11 items-center gap-3 rounded-lg border border-current px-4 py-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current">
                    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6 shrink-0"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 6 9 7 9-7" /></svg>
                    <span className="min-w-0 break-all"><span className="block">{t('details.contactEmail')}</span>{property.contactEmail}</span>
                  </a>}
                </div>
              </Reveal>}
            </div>
          </ReservationDatesProvider> : <ReservationDatesProvider key={property.id}>
          <div className="detail-booking-columns grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* Móvil: calendario arriba; desktop a la derecha. */}
            <Reveal className="detail-calendar detail-lateral-reveal detail-from-right glass-panel rounded-2xl p-6 shadow-xl ring-1 ring-white/20 dark:ring-gray-700/50 lg:order-2">
              <h3 className="mb-3 text-[0.65rem] tracking-[0.25em] text-gray-400 dark:text-gray-300 uppercase">
                {titleFor('disponibilidad')}
              </h3>
              <AvailabilityCalendar bookings={bookingRows} />
            </Reveal>

            {/* Desktop: formulario a la izquierda; móvil debajo del calendario. */}
            <Reveal className="detail-reservation-form detail-lateral-reveal detail-from-left glass-panel rounded-2xl p-6 shadow-xl ring-1 ring-white/20 dark:ring-gray-700/50 lg:order-1">
              <MessageForm propertyId={property.id} propertySlug={property.slug} locale={locale} pricing={pricing!} maxGuests={property.maxGuests} compact />
              {property.whatsapp && <PropertyWhatsAppLink propertySlug={property.slug} href={`https://wa.me/${property.whatsapp}?text=${encodeURIComponent(t('details.whatsappMessage', { propertyName: title }))}`} target="_blank" rel="noopener noreferrer"
                className="mt-3 block w-full rounded-lg border border-green-700 px-4 py-3 text-center text-sm font-medium text-green-800 transition hover:bg-green-50 dark:border-green-400 dark:text-green-300 dark:hover:bg-green-950">{t('details.whatsappButton')}</PropertyWhatsAppLink>}
            </Reveal>
          </div>
          </ReservationDatesProvider>}
        </div>
      </SectionBackground>
      </DetailSectionTransitions>
      {editorial.length > 0 && <a href="#reservar" className="fixed bottom-6 left-6 z-40 hidden rounded-full bg-green-700 px-6 py-3 font-semibold text-white shadow-lg hover:bg-green-800 lg:flex">{isAnnual ? t('details.annualContactTitle') : t('details.reservar')}</a>}
      <DetailFooterFlow><Footer inDetail /></DetailFooterFlow>
    </PropertyDetailScroll>
  );
}
