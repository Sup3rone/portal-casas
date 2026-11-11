// T-4738: lista privada de reservas con su desglose (renta, aseo, impuestos, comisión). ADMIN ve todas; el
// colaborador, las de sus propiedades. Cada fila abre /panel/reservas/[id] para capturar el desglose.
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { panelManager } from '@/lib/panel-server';
import { listManagedBookings } from '@/lib/booking-details';
import { commissionAmount, formatMoney } from '@/lib/booking-breakdown';

export default async function BookingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const manager = await panelManager(locale);
  const t = await getTranslations({ locale, namespace: 'bookingDetail' });
  const rows = await listManagedBookings(manager);
  const date = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'UTC' });
  const day = (value: string) => date.format(new Date(`${value}T00:00:00Z`));
  return <section className="space-y-6">
    <div className="space-y-2"><h1 className="text-3xl font-semibold">{t('listTitle')}</h1><p>{t('listIntro')}</p></div>
    {!rows.length ? <p>{t('listEmpty')}</p> : <div className="overflow-x-auto"><table className="w-full text-left text-sm">
      <thead><tr>{(['property', 'dates', 'referral', 'rentAmount', 'cleaningCost', 'taxes', 'commissionAmount'] as const)
        .map(key => <th key={key} scope="col" className="p-2 align-bottom">{t(key)}</th>)}<th scope="col" className="p-2"><span className="sr-only">{t('open')}</span></th></tr></thead>
      <tbody>{rows.map(row => {
        const title = (locale === 'en' ? row.titleEn : locale === 'fr' ? row.titleFr : row.titleEs) || row.slug;
        const commission = row.commissionPercent == null ? null : commissionAmount(row.rentAmount, row.commissionPercent);
        return <tr key={row.id} className="border-t dark:border-gray-700">
          <td className="p-2 break-words">{title}</td>
          <td className="p-2 whitespace-nowrap">{day(row.startDate)} – {day(row.endDate)}</td>
          <td className="p-2">{row.referredBy ? `${row.referredBy} (${row.commissionPercent} %)` : '—'}</td>
          <td className="p-2 whitespace-nowrap">{formatMoney(row.rentAmount, locale)}</td>
          <td className="p-2 whitespace-nowrap">{formatMoney(row.cleaningCost, locale)}</td>
          <td className="p-2 whitespace-nowrap">{formatMoney(row.taxes, locale)}</td>
          <td className="p-2 whitespace-nowrap">{formatMoney(commission, locale)}</td>
          <td className="p-2"><Link href={`/panel/reservas/${row.id}`} className="inline-flex min-h-11 items-center text-green-700 underline dark:text-green-400">{t('edit')}</Link></td>
        </tr>;
      })}</tbody>
    </table></div>}
  </section>;
}
