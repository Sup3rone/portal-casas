// T-5201 (app del vendedor, pantalla 1): delante del cliente, ¿qué casa está libre en estas fechas y cuánto cuesta?
// Solo casas que gestiona quien consulta (ADMIN todas, COLLABORATOR las suyas); permisos en availableForVendor.
import { getTranslations } from 'next-intl/server';
import { panelManager } from '@/lib/panel-server';
import { propertySearch, type PropertySearchParams } from '@/lib/property-search';
import { inquiryToday } from '@/lib/inquiry-validation';
import { formatMoney } from '@/lib/booking-breakdown';
import { availableForVendor, managedDestinations } from '@/lib/vendor-availability';
import SearchForm from '@/components/panel/vendor/SearchForm';
import VendorCard from '@/components/panel/vendor/VendorCard';

export default async function VendorPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams?: Promise<PropertySearchParams> }) {
  const { locale } = await params;
  const manager = await panelManager(locale);
  const t = await getTranslations({ locale, namespace: 'vendor' });
  const filters = propertySearch(await searchParams ?? {});
  const lang = locale === 'en' || locale === 'fr' ? locale : 'es';
  const ready = !filters.invalid && Boolean(filters.start && filters.end);
  const [destinations, cards] = await Promise.all([
    managedDestinations(manager),
    ready ? availableForVendor({ start: filters.start, end: filters.end, guests: filters.guests, state: filters.state, destinationCity: filters.destinationCity }, manager, lang) : [],
  ]);
  const query = new URLSearchParams({ start: filters.start, end: filters.end, ...(filters.guests ? { guests: String(filters.guests) } : {}) }).toString();
  const notice = filters.invalid ? t('invalid') : !ready ? t('pickDates') : !cards.length ? t('empty') : null;
  return <section className="space-y-5">
    <div className="space-y-1">
      <h1 className="text-2xl font-semibold md:text-3xl">{t('title')}</h1>
      <p className="text-sm text-gray-600 dark:text-gray-300">{t('intro')}</p>
    </div>
    <SearchForm key={query + filters.state + filters.destinationCity} today={inquiryToday()} destinations={destinations}
      initial={{ start: filters.start, end: filters.end, guests: filters.guests, state: filters.state, destinationCity: filters.destinationCity }} />
    {notice ? <p role="status" className="rounded-xl bg-gray-100 p-4 text-center dark:bg-gray-800">{notice}</p> : <>
      <p role="status" className="font-semibold">{t('count', { count: cards.length })}</p>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(card => <VendorCard key={card.id} card={card} href={`/panel/vender/${card.id}?${query}`} labels={{
          free: t('free'), draft: t('draft'),
          specs: t('specs', { bedrooms: card.bedrooms, bathrooms: card.bathrooms, maxGuests: card.maxGuests }),
          nights: t('nights', { count: card.nights }),
          total: card.total == null ? t('noPrice') : formatMoney(String(card.total), locale),
        }} />)}
      </ul>
    </>}
  </section>;
}
