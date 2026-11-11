// T-4736/T-4767: lista de referidores — ADMIN todos; el dueño (COLLABORATOR) solo los suyos. Otros roles: 404.
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { listPartners, referralsPage } from '@/lib/referrals';
import { PartnerForm } from '@/components/panel/Referrals';

export default async function ReferralsPage({ params }: { params: Promise<{ locale: string }> }) {
  const manager = await referralsPage();
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'referrals' });
  const rows = await listPartners(manager), owner = manager.role === 'COLLABORATOR';
  return <section className="space-y-8">
    <div className="space-y-2"><h1 className="text-3xl font-semibold">{t(owner ? 'ownerTitle' : 'title')}</h1><p>{t(owner ? 'ownerIntro' : 'intro')}</p></div>
    <div className="overflow-x-auto"><table className="w-full text-left">
      <thead><tr>{(['name', 'commission', 'status', 'links', 'bookings'] as const).map(key => <th key={key} scope="col" className="p-2">{t(key)}</th>)}</tr></thead>
      <tbody>{rows.map(partner => <tr key={partner.id} className="border-t dark:border-gray-700">
        <td className="p-2"><Link className="break-words text-green-700 underline dark:text-green-400" href={`/panel/referidos/${partner.id}`}>{partner.name}</Link></td>
        <td className="p-2">{partner.commissionPercent}%</td>
        <td className="p-2">{t(partner.active ? 'active' : 'inactive')}</td>
        <td className="p-2">{partner.linkCount}</td><td className="p-2">{partner.bookingCount}</td>
      </tr>)}</tbody>
    </table></div>
    {!rows.length && <p>{t('empty')}</p>}
    <section className="space-y-4 rounded-lg border p-4 dark:border-gray-700">
      <h2 className="text-xl font-semibold">{t('newPartner')}</h2>
      <PartnerForm />
    </section>
  </section>;
}
