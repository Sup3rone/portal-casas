// T-4739: «Reporte mensual» del COLABORADOR — reservas del mes de sus propiedades, agrupadas por propiedad,
// con desglose y comisión; descarga Excel; destinatarios del envío automático y bitácora de envíos.
// Otros roles (ADMIN incluido: solo administra funcionalidades) → 404. Sin paginación: la consulta ya está
// acotada a un mes y a las propiedades del colaborador.
import { getTranslations } from 'next-intl/server';
import { inquiryToday } from '@/lib/inquiry-validation';
import { isMonth, previousMonth } from '@/lib/monthly-report';
import { getReportEmails, listDeliveries, loadMonthlyReport, reportPage, reportPartnerOptions } from '@/lib/monthly-report-service';
import { formatMoney } from '@/lib/booking-breakdown';
import { inputClass, buttonClass } from '@/components/panel/request';
import { ReportRecipientsForm, SendReportButton } from '@/components/panel/MonthlyReportControls';

export default async function MonthlyReportPage({ params, searchParams }: {
  params: Promise<{ locale: string }>; searchParams: Promise<{ month?: string; partner?: string }>;
}) {
  const manager = await reportPage();
  const { locale } = await params, query = await searchParams;
  const t = await getTranslations({ locale, namespace: 'monthlyReport' });
  const month = isMonth(query.month) ? query.month : previousMonth(inquiryToday());
  const partnerOptions = await reportPartnerOptions(manager);
  const partner = partnerOptions.some(option => option.id === query.partner) ? query.partner! : null;
  const [report, recipients, deliveries] = await Promise.all([
    loadMonthlyReport(manager, month, partner, locale), getReportEmails(manager.id), listDeliveries(manager.id)]);
  const money = (value: string | null) => formatMoney(value, locale);
  const date = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'UTC' });
  const day = (value: string) => date.format(new Date(`${value}T00:00:00Z`));
  const stamp = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Mexico_City' });
  const download = `/api/panel/reports/monthly?${new URLSearchParams({ month, locale, ...(partner ? { partner } : {}) })}`;
  const lastFailure = deliveries.find(delivery => delivery.status === 'failed');
  const failedLatest = deliveries[0]?.status === 'failed';
  const columns = ['checkIn', 'guest', 'referredBy', 'rent', 'cleaning', 'taxes', 'total', 'percent', 'commission'] as const;

  return <section className="space-y-8">
    <div className="space-y-2"><h1 className="text-3xl font-semibold">{t('title')}</h1><p>{t('intro')}</p></div>
    {failedLatest && lastFailure && <p role="alert" className="rounded-lg border border-red-700 p-3 text-red-800 dark:border-red-400 dark:text-red-300">
      {t('lastFailed', { month: lastFailure.month, error: lastFailure.error ?? '' })}</p>}

    <form className="flex flex-wrap items-end gap-4" method="get">
      <label className="block space-y-1"><span>{t('month')}</span><input type="month" name="month" defaultValue={month} required className={inputClass} /></label>
      <label className="block space-y-1"><span>{t('partnerFilter')}</span>
        <select name="partner" defaultValue={partner ?? ''} className={inputClass}><option value="">{t('allPartners')}</option>
          {partnerOptions.map(option => <option key={option.id} value={option.id}>{option.name}</option>)}</select></label>
      <button type="submit" className={buttonClass}>{t('apply')}</button>
      <a href={download} className={`${buttonClass} inline-flex items-center`} download>{t('download')}</a>
    </form>

    <dl className="grid gap-4 rounded-lg border p-4 sm:grid-cols-4 dark:border-gray-700">
      {([['bookingsCount', String(report.totals.bookings)], ['total', money(report.totals.total)], ['taxes', money(report.totals.taxes)], ['commission', money(report.totals.commission)]] as const)
        .map(([key, value]) => <div key={key}><dt className="text-sm text-gray-600 dark:text-gray-300">{t(key)}</dt><dd className="text-lg font-semibold" data-testid={`total-${key}`}>{value}</dd></div>)}
    </dl>

    {!report.groups.length && <p>{t('empty', { month })}</p>}
    {report.groups.map(group => <section key={group.propertyId} className="space-y-2">
      <h2 className="break-words text-xl font-semibold">{group.propertyTitle}</h2>
      <div className="overflow-x-auto"><table className="w-full min-w-[56rem] text-left text-sm">
        <thead><tr>{columns.map(key => <th key={key} scope="col" className="p-2 align-bottom">{t(key)}</th>)}</tr></thead>
        <tbody>
          {group.lines.map(line => <tr key={`${line.id}-${line.kind}`} className="border-t align-top dark:border-gray-700">
            <td className="p-2 whitespace-nowrap">{day(line.startDate)} – {day(line.endDate)}
              <span className="block text-xs text-gray-600 dark:text-gray-300">{t('nightsLabel', { here: line.nightsThisMonth, total: line.nights })}</span>
              {line.kind === 'continuation'
                ? <span className="mt-1 block rounded bg-amber-100 px-1 text-xs text-amber-900 dark:bg-amber-900/40 dark:text-amber-200">{t('continuation', { month: line.countedIn })}</span>
                : line.nightsOtherMonths > 0 && <span className="mt-1 block rounded bg-amber-100 px-1 text-xs text-amber-900 dark:bg-amber-900/40 dark:text-amber-200">
                  {t('crossesNext', { here: line.nightsThisMonth, total: line.nights, next: line.nightsOtherMonths })}</span>}
            </td>
            <td className="p-2 break-words">{line.guestName ?? '—'}</td>
            <td className="p-2 break-words">{line.referredBy ?? '—'}</td>
            <td className="p-2 whitespace-nowrap">{money(line.rentAmount)}</td>
            <td className="p-2 whitespace-nowrap">{money(line.cleaningCost)}</td>
            <td className="p-2 whitespace-nowrap">{money(line.taxes)}</td>
            <td className="p-2 whitespace-nowrap">{money(line.total)}</td>
            <td className="p-2 whitespace-nowrap">{line.kind === 'entry' && line.commissionPercent != null ? `${line.commissionPercent} %` : '—'}</td>
            <td className="p-2 whitespace-nowrap">{money(line.commission)}</td>
          </tr>)}
          <tr className="border-t font-semibold dark:border-gray-700">
            <td className="p-2" colSpan={3}>{t('subtotal', { property: group.propertyTitle })}</td>
            <td className="p-2 whitespace-nowrap">{money(group.totals.rentAmount)}</td><td className="p-2 whitespace-nowrap">{money(group.totals.cleaningCost)}</td>
            <td className="p-2 whitespace-nowrap">{money(group.totals.taxes)}</td><td className="p-2 whitespace-nowrap">{money(group.totals.total)}</td>
            <td className="p-2" /><td className="p-2 whitespace-nowrap">{money(group.totals.commission)}</td>
          </tr>
        </tbody>
      </table></div>
    </section>)}

    <section className="space-y-4 rounded-lg border p-4 dark:border-gray-700">
      <h2 className="text-xl font-semibold">{t('autoTitle')}</h2>
      <p>{t('autoIntro')}</p>
      <ReportRecipientsForm initial={recipients} />
      <SendReportButton month={month} disabled={!recipients.length} />
      {!recipients.length && <p className="text-sm">{t('noRecipients')}</p>}
    </section>

    <section className="space-y-2">
      <h2 className="text-xl font-semibold">{t('deliveriesTitle')}</h2>
      {!deliveries.length ? <p>{t('noDeliveries')}</p> : <div className="overflow-x-auto"><table className="w-full text-left text-sm">
        <thead><tr>{(['when', 'month', 'trigger', 'status', 'recipients'] as const).map(key => <th key={key} scope="col" className="p-2">{t(`delivery.${key}`)}</th>)}</tr></thead>
        <tbody>{deliveries.map(delivery => <tr key={delivery.id} className="border-t dark:border-gray-700">
          <td className="p-2 whitespace-nowrap">{stamp.format(new Date(delivery.createdAt))}</td><td className="p-2">{delivery.month}</td>
          <td className="p-2">{t(`delivery.${delivery.trigger}`)}</td>
          <td className={`p-2 ${delivery.status === 'failed' ? 'text-red-800 dark:text-red-300' : ''}`}>{t(`delivery.${delivery.status}`)}{delivery.error ? ` · ${delivery.error}` : ''}</td>
          <td className="p-2 break-all">{(delivery.recipients ?? []).join(', ') || '—'}</td>
        </tr>)}</tbody>
      </table></div>}
    </section>
  </section>;
}
