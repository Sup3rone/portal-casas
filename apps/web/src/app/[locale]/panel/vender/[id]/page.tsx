// T-5205 (app del vendedor, pantalla 2): la casa, para enseñarla delante del cliente. Fotos, datos, un mes de
// calendario con lo ocupado tachado, tarifas y la temporada que tocan las fechas elegidas; de aquí se cotiza (Task 5).
// Permisos en el servidor: panelProperty da 404 si la casa no la gestiona quien consulta (COLLABORATOR ajeno).
import { getTranslations } from 'next-intl/server';
import { asc, desc, eq } from 'drizzle-orm';
import { db, bookings, media, seasonRates } from '@portal/db';
import { Link } from '@/i18n/navigation';
import { panelProperty } from '@/lib/panel-server';
import { propertyBlocks } from '@/lib/occupation-calendar';
import { propertySearch } from '@/lib/property-search';
import { inquiryToday } from '@/lib/inquiry-validation';
import { quoteStay } from '@/lib/stay-quote';
import { formatMoney } from '@/lib/booking-breakdown';
import PropertyGallery from '@/components/PropertyGallery';
import MonthAvailability, { monthCells } from '@/components/panel/vendor/MonthAvailability';
import ShareListing from '@/components/panel/vendor/ShareListing';
import { stayTooLong } from '@/lib/vendor-quote';
import { propertyHolds } from '@/lib/vendor-hold';
import ReleaseHoldButton from '@/components/panel/vendor/ReleaseHoldButton';

type Query = { start?: string | string[]; end?: string | string[]; guests?: string | string[]; month?: string | string[] };

const MONTH = /^(\d{4})-(0[1-9]|1[0-2])$/;
const shift = (year: number, month: number, by: number) => {
  const date = new Date(Date.UTC(year, month - 1 + by, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
};

export default async function VendorPropertyPage({ params, searchParams }: { params: Promise<{ locale: string; id: string }>; searchParams?: Promise<Query> }) {
  const { locale, id } = await params;
  const { manager, property } = await panelProperty(id, locale);
  const query = await searchParams ?? {};
  const t = await getTranslations({ locale, namespace: 'vendor' });
  const filters = propertySearch({ start: query.start, end: query.end, guests: query.guests });
  // T-5208: más de un año de estancia no se calcula aquí (tope de CPU/memoria); se trata como fechas inválidas.
  const tooLong = !filters.invalid && Boolean(filters.start && filters.end) && stayTooLong(filters.start, filters.end);
  const chosen = !filters.invalid && !tooLong && Boolean(filters.start && filters.end);

  const isAnnual = property.rentalType === 'anual';
  const [mediaRows, bookingRows, blockRows, rateRows, holds] = await Promise.all([
    db.select({ url: media.url, type: media.type }).from(media).where(eq(media.propertyId, property.id)).orderBy(desc(media.isCover), asc(media.order), asc(media.id)),
    db.select({ startDate: bookings.startDate, endDate: bookings.endDate }).from(bookings).where(eq(bookings.propertyId, property.id)),
    propertyBlocks(property.id),
    isAnnual ? Promise.resolve([]) : db.select().from(seasonRates).where(eq(seasonRates.propertyId, property.id)),
    propertyHolds(property.id, manager),
  ]);
  const occupied = [...bookingRows, ...blockRows].map(row => ({ start: String(row.startDate), end: String(row.endDate) }));
  const seasons = rateRows.map(rate => ({ name: rate.name, start: String(rate.startDate), end: String(rate.endDate), weekday: Number(rate.weekdayPrice), weekend: Number(rate.weekendPrice), priority: Number(rate.priority) }));
  const base = { weekday: property.baseWeekdayPrice == null ? null : Number(property.baseWeekdayPrice), weekend: property.baseWeekendPrice == null ? null : Number(property.baseWeekendPrice) };
  const quote = chosen ? quoteStay(filters.start, filters.end, { base, seasons, booked: occupied }) : null;
  // Temporadas (inicio y fin inclusivos) que tocan alguna noche de [start, end).
  const touching = chosen ? seasons.filter(season => season.start < filters.end && season.end >= filters.start) : [];

  // Mes a enseñar: ?month=YYYY-MM, si no el de la llegada elegida, si no el de hoy (CDMX).
  const requested = typeof query.month === 'string' ? MONTH.exec(query.month) : null;
  const [year, month] = (requested ? [requested[1], requested[2]] : (chosen ? filters.start : inquiryToday()).split('-')).map(Number);
  const cells = monthCells(year, month, occupied, chosen ? { start: filters.start, end: filters.end } : undefined);
  const search = new URLSearchParams(chosen ? { start: filters.start, end: filters.end, ...(filters.guests ? { guests: String(filters.guests) } : {}) } : {}).toString();
  const monthHref = (value: string) => `/panel/vender/${property.id}?${new URLSearchParams({ month: value, ...Object.fromEntries(new URLSearchParams(search)) })}`;
  const dateLabel = (value: string) => new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(value + 'T00:00:00Z'));
  const weekdays = Array.from({ length: 7 }, (_, index) => new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' }).format(new Date(Date.UTC(2024, 0, 1 + index))));

  const title = locale === 'en' ? property.titleEn : locale === 'fr' ? property.titleFr : property.titleEs;
  const money = (value: number | null) => value == null ? t('noPrice') : formatMoney(String(value), locale);
  const slides = mediaRows.map(row => ({ url: row.url, type: row.type === 'VIDEO' ? 'VIDEO' as const : 'PHOTO' as const }));
  const notice = filters.invalid || tooLong ? t('invalid') : !chosen ? t('pickStay') : quote?.overlap ? t('occupied') : null;
  const chip = 'rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold dark:bg-gray-800';

  return <section className="space-y-5">
    <Link href={search ? `/panel/vender?${search}` : '/panel/vender'} className="inline-flex min-h-11 items-center text-sm font-semibold text-green-800 dark:text-green-300">‹ {t('back')}</Link>
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold break-words md:text-3xl">{title}</h1>
      <ul className="flex flex-wrap gap-2">
        <li className={chip}>{t('specs', { bedrooms: Number(property.bedrooms), bathrooms: Number(property.bathrooms), maxGuests: Number(property.maxGuests) })}</li>
        {[property.destinationCity, property.state].filter(Boolean).length > 0 && <li className={chip}>{[property.destinationCity, property.state].filter(Boolean).join(', ')}</li>}
        {!property.published && <li className="rounded-full bg-gray-900 px-3 py-1 text-sm font-semibold text-white dark:bg-gray-100 dark:text-gray-900">{t('draft')}</li>}
      </ul>
    </div>
    {slides.length > 0 && <PropertyGallery slides={slides} />}
    <div className="grid gap-5 md:grid-cols-2">
      <MonthAvailability cells={cells} prevHref={monthHref(shift(year, month, -1))} nextHref={monthHref(shift(year, month, 1))} labels={{
        title: new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(year, month - 1, 1))),
        weekdays, prev: t('prevMonth'), next: t('nextMonth'),
        legend: { free: t('legendFree'), occupied: t('legendOccupied'), selected: t('legendSelected'), checkout: t('legendCheckout') },
      }} />
      <div className="space-y-4">
        <section className="space-y-2 rounded-2xl border border-gray-200 p-4 dark:border-gray-700">
          <h2 className="text-lg font-semibold">{t('rates')}</h2>
          <p className="flex justify-between gap-3"><span>{t('weekday')}</span><span className="font-semibold">{money(base.weekday)}</span></p>
          <p className="flex justify-between gap-3"><span>{t('weekend')}</span><span className="font-semibold">{money(base.weekend)}</span></p>
          {touching.map(season => <p key={season.name + season.start} role="note" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-100">
            {t('season', { name: season.name, start: dateLabel(season.start), end: dateLabel(season.end) })}
          </p>)}
        </section>
        {notice ? <p role="status" className="rounded-xl bg-gray-100 p-4 text-center dark:bg-gray-800">{notice}</p>
          : quote && <div className="space-y-3 rounded-2xl border border-green-700 p-4">
            <p className="flex items-baseline justify-between gap-3">
              <span className="text-sm text-gray-600 dark:text-gray-300">{t('nights', { count: quote.nights })}</span>
              <span className="text-2xl font-semibold">{money(quote.total)}</span>
            </p>
            <Link href={`/panel/vender/${property.id}/cotizar?${search}`} className="flex min-h-12 items-center justify-center rounded-lg bg-green-700 px-6 text-base font-semibold text-white hover:bg-green-600">
              {t('quote', { start: dateLabel(filters.start), end: dateLabel(filters.end) })}
            </Link>
          </div>}
        {/* T-5209: apartados del vendedor (bloqueo + consulta) con «Liberar»; los bloqueos manuales no salen aquí. */}
        {holds.length > 0 && <section aria-label={t('holdsTitle')} className="space-y-2 rounded-2xl border border-gray-200 p-4 dark:border-gray-700">
          <h2 className="text-lg font-semibold">{t('holdsTitle')}</h2>
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {holds.map(hold => <li key={hold.blockId} className="flex flex-wrap items-center justify-between gap-3 py-2">
              <span><span className="block font-semibold">{hold.name}</span>
                <span className="text-sm text-gray-600 dark:text-gray-300">{dateLabel(String(hold.start))} → {dateLabel(String(hold.end))}</span></span>
              <ReleaseHoldButton blockId={hold.blockId} />
            </li>)}
          </ul>
        </section>}
        {Boolean(property.published) && <ShareListing path={`/${locale}/casas/${property.slug}`} title={title} label={t('share')} copied={t('copied')} />}
      </div>
    </div>
  </section>;
}
