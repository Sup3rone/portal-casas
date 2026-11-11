// T-4736/T-4767: ficha del referidor — datos, cuenta ligada, activar/desactivar, enlaces y reservas atribuidas.
// ADMIN cualquiera; el dueño solo los suyos (ajeno = 404) y solo ve reservas de sus casas.
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { AccessError } from '@/lib/property-access';
import { getPartner, referralPropertyOptions, referralsPage } from '@/lib/referrals';
import { PartnerForm, PartnerStatusButton } from '@/components/panel/Referrals';
import ReferralSections from '@/components/panel/ReferralSections';

export default async function PartnerPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const manager = await referralsPage();
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: 'referrals' });
  let partner;
  try { partner = await getPartner(id, manager); }
  catch (error) { if (error instanceof AccessError && error.status === 404) notFound(); throw error; }
  return <section className="space-y-8">
    <Link href="/panel/referidos" className="text-green-700 underline dark:text-green-400">{t('back')}</Link>
    <div className="space-y-2">
      <h1 className="break-words text-3xl font-semibold">{partner.name}</h1>
      <p>{t('status')}: {t(partner.active ? 'active' : 'inactive')} · {t('commission')}: {partner.commissionPercent}%</p>
      {partner.userEmail && <p className="break-all">{t(partner.ownerId ? 'referrerAccount' : 'linkedUser')}: {partner.userEmail}</p>}
      {!partner.active && <p role="status">{t('inactiveNotice')}</p>}
    </div>
    <section className="space-y-4 rounded-lg border p-4 dark:border-gray-700">
      <h2 className="text-xl font-semibold">{t('edit')}</h2>
      <PartnerForm partner={partner} />
      <PartnerStatusButton id={partner.id} active={partner.active} />
    </section>
    <ReferralSections locale={locale} partnerId={partner.id} propertyOptions={await referralPropertyOptions(manager)} scope={manager} />
  </section>;
}
