// T-4736: enlaces (con copiado) y reservas atribuidas de un colaborador. Server component compartido por
// la ficha de Referidos (/panel/referidos/[id], ADMIN o dueño) y la vista del colaborador (/panel/mis-referidos).
import { getTranslations } from 'next-intl/server';
import { siteUrl } from '@/lib/seo';
import { referralUrl } from '@/lib/referral';
import { partnerBookings, partnerLinks } from '@/lib/referrals';
import type { PropertyManager } from '@/lib/property-access';
import { CopyLinkButton, ReferralLinkCreator } from './Referrals';

type Titled = { titleEs: string | null; titleEn: string | null; titleFr: string | null };
export const referralTitle = (row: Titled, locale: string) => (locale === 'en' ? row.titleEn : locale === 'fr' ? row.titleFr : row.titleEs) ?? '';
type PropertyOption = Titled & { id: string; slug: string; published: boolean };

/** scope (T-4767): gestor que mira la ficha; con un COLLABORATOR solo se ven reservas de sus casas. */
export default async function ReferralSections({ locale, partnerId, propertyOptions, endpoint, canCreate = true, scope }: {
  locale: string; partnerId: string; propertyOptions: PropertyOption[]; endpoint?: string; canCreate?: boolean; scope?: PropertyManager;
}) {
  const t = await getTranslations({ locale, namespace: 'referrals' });
  const [links, bookings] = await Promise.all([partnerLinks(partnerId, scope), partnerBookings(partnerId, scope)]);
  const origin = siteUrl(), date = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'UTC' });
  const day = (value: string) => date.format(new Date(`${value}T00:00:00Z`));
  return <>
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">{t('linksTitle')}</h2>
      {canCreate && <div className="rounded-lg border p-4 dark:border-gray-700">
        <h3 className="mb-4 font-semibold">{t('newLink')}</h3>
        <ReferralLinkCreator partnerId={partnerId} endpoint={endpoint} properties={propertyOptions.map(property => ({
          id: property.id, label: `${referralTitle(property, locale) || property.slug}${property.published ? '' : ` (${t('draft')})`}`,
        }))} />
      </div>}
      {!links.length && <p>{t('noLinks')}</p>}
      {links.map(link => {
        const url = referralUrl(origin, link.code, link.slug);
        return <article key={link.id} className="space-y-2 rounded-lg border p-4 dark:border-gray-700">
          <p><span className="font-semibold">{t('code')}:</span> <code>{link.code}</code> · {link.propertyId ? referralTitle(link, locale) || link.slug : t('general')} · {t('bookings')}: {link.bookingCount}</p>
          <p className="break-all"><span className="sr-only">{t('url')}: </span><code data-referral-url={url} className="select-all">{url}</code></p>
          <CopyLinkButton url={url} />
        </article>;
      })}
    </section>
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">{t('bookingsTitle')}</h2>
      {!bookings.length ? <p>{t('noBookings')}</p> : <div className="overflow-x-auto"><table className="w-full text-left">
        <thead><tr>{(['property', 'dates', 'code', 'commission'] as const).map(key => <th key={key} scope="col" className="p-2">{t(key)}</th>)}</tr></thead>
        <tbody>{bookings.map(booking => <tr key={booking.id} className="border-t dark:border-gray-700">
          <td className="p-2">{referralTitle(booking, locale)}</td>
          <td className="p-2">{day(booking.startDate)} – {day(booking.endDate)}</td>
          <td className="p-2"><code>{booking.code ?? '—'}</code></td>
          <td className="p-2">{booking.commissionPercent == null ? '—' : `${booking.commissionPercent}%`}</td>
        </tr>)}</tbody>
      </table></div>}
    </section>
  </>;
}
