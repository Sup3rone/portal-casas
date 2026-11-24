// T-5208 (app del vendedor, pantalla 3): cotización delante del cliente. Desglose, «Solo para ti» (comisión) con
// «Modo cliente» para ocultarlo, y WhatsApp con un texto que nunca lleva la comisión (vendor-share.ts).
// Permisos en el servidor: panelProperty da 404 si la casa no la gestiona quien consulta.
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { panelProperty } from '@/lib/panel-server';
import { propertySearch } from '@/lib/property-search';
import { stayTooLong, vendorQuote } from '@/lib/vendor-quote';
import { quoteWhatsappText, quoteWhatsappUrl } from '@/lib/vendor-share';
import { formatMoney } from '@/lib/booking-breakdown';
import { localizedUrl, siteUrl } from '@/lib/seo';
import { referralUrl } from '@/lib/referral';
import ClientModeToggle from '@/components/panel/vendor/ClientModeToggle';
import HoldForm from '@/components/panel/vendor/HoldForm';

type Query = { start?: string | string[]; end?: string | string[]; guests?: string | string[] };

export default async function VendorQuotePage({ params, searchParams }: { params: Promise<{ locale: string; id: string }>; searchParams?: Promise<Query> }) {
  const { locale, id } = await params;
  const { manager, property } = await panelProperty(id, locale);
  const query = await searchParams ?? {};
  const t = await getTranslations({ locale, namespace: 'vendor' });
  const lang = locale === 'en' || locale === 'fr' ? locale : 'es';
  const filters = propertySearch({ start: query.start, end: query.end, guests: query.guests });
  const tooLong = !filters.invalid && Boolean(filters.start && filters.end) && stayTooLong(filters.start, filters.end);
  const chosen = !filters.invalid && !tooLong && Boolean(filters.start && filters.end);
  const quote = chosen ? await vendorQuote(property.id, filters.start, filters.end, manager) : null;
  if (chosen && !quote) notFound();

  const search = new URLSearchParams(chosen ? { start: filters.start, end: filters.end, ...(filters.guests ? { guests: String(filters.guests) } : {}) } : {}).toString();
  const title = lang === 'en' ? property.titleEn : lang === 'fr' ? property.titleFr : property.titleEs;
  const money = (value: string | null) => value == null ? t('noPrice') : formatMoney(value, locale);
  const dateLabel = (value: string) => new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(value + 'T00:00:00Z'));
  const notice = filters.invalid || tooLong ? t('invalid') : !chosen ? t('pickStay') : quote?.overlap ? t('occupied') : null;
  const row = 'flex items-baseline justify-between gap-3 py-2';

  return <section className="space-y-5">
    <Link href={`/panel/vender/${property.id}${search ? '?' + search : ''}`} className="inline-flex min-h-11 items-center text-sm font-semibold text-green-800 dark:text-green-300">‹ {t('backHouse')}</Link>
    <div className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-widest text-gray-600 dark:text-gray-300">{t('quoteTitle')}</p>
      <h1 className="text-2xl font-semibold break-words md:text-3xl">{title}</h1>
      {chosen && <p className="text-sm text-gray-600 dark:text-gray-300">{dateLabel(filters.start)} → {dateLabel(filters.end)}</p>}
    </div>
    {notice || !quote ? <p role="status" className="rounded-xl bg-gray-100 p-4 text-center dark:bg-gray-800">{notice}</p> : <div className="grid gap-5 md:grid-cols-2">
      <section className="rounded-2xl border border-gray-200 p-4 dark:border-gray-700">
        <ul className="divide-y divide-gray-200 text-sm dark:divide-gray-700">
          {quote.lines.map(line => <li key={`${line.season}:${line.weekend}:${line.price}`} className={row}>
            <span>{line.season == null
              ? t('lineBase', { count: line.nights, weekend: String(line.weekend), price: formatMoney(String(line.price), locale) })
              : t('lineSeason', { season: line.season, count: line.nights, weekend: String(line.weekend), price: formatMoney(String(line.price), locale) })}</span>
            <span className="whitespace-nowrap">{formatMoney(String(line.price * line.nights), locale)}</span>
          </li>)}
        </ul>
        <dl className="divide-y divide-gray-200 border-t border-gray-200 dark:divide-gray-700 dark:border-gray-700">
          <div className={row}><dt>{t('rent')} · {t('nights', { count: quote.nights })}</dt><dd className="font-semibold">{money(quote.rent)}</dd></div>
          <div className={row}><dt>{t('cleaning')}</dt><dd className="font-semibold">{quote.cleaning == null ? t('cleaningPending') : money(quote.cleaning)}</dd></div>
          {quote.taxes != null && <div className={row}><dt>{t('taxes')}</dt><dd className="font-semibold">{money(quote.taxes)}</dd></div>}
          <div className={`${row} text-xl`}><dt className="font-semibold">{t('total')}</dt><dd className="font-semibold">{money(quote.total)}</dd></div>
        </dl>
      </section>
      <div className="space-y-4">
        <a href={quoteWhatsappUrl(quoteWhatsappText(quote, { title, publicUrl: !property.published ? null
          : quote.referralCode ? referralUrl(siteUrl(), quote.referralCode, property.slug) : localizedUrl(locale, `/casas/${property.slug}`) }, { start: filters.start, end: filters.end }, lang))}
          target="_blank" rel="noopener noreferrer"
          className="flex min-h-12 items-center justify-center rounded-lg bg-green-700 px-6 text-base font-semibold text-white hover:bg-green-600">{t('whatsapp')}</a>
        {/* T-5209: apartar = consulta + bloqueo; solo si las fechas siguen libres (este bloque no se pinta si hay traslape). */}
        <HoldForm propertyId={property.id} start={filters.start} end={filters.end} guests={filters.guests ?? 1} />
        {quote.commission && <ClientModeToggle label={t('clientMode')} hint={t('clientModeHint')}>
          <section aria-label={t('onlyYou')} className="space-y-1 rounded-2xl border border-dashed border-amber-500 bg-amber-50 p-4 dark:bg-amber-950">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-amber-900 dark:text-amber-100">{t('onlyYou')}</h2>
            <p className="flex items-baseline justify-between gap-3 text-amber-950 dark:text-amber-50">
              <span>{t('commission', { percent: quote.commission.percent })}</span>
              <span className="text-lg font-semibold">{formatMoney(quote.commission.amount, locale)}</span>
            </p>
            {!quote.referralCode && <p className="text-sm text-amber-900 dark:text-amber-100">{t('noReferralLink')}</p>}
          </section>
        </ClientModeToggle>}
      </div>
    </div>}
  </section>;
}
