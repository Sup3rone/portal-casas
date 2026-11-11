// T-4736: el COLLABORATOR con permiso ve y crea SUS enlaces (generales o de sus propiedades) y sus reservas
// atribuidas con el % congelado. No ve a otros colaboradores ni puede cambiar su %. Sin permiso: 404.
import { getTranslations } from 'next-intl/server';
import { myReferralsPage, ownReferralPropertyOptions } from '@/lib/referrals';
import ReferralSections from '@/components/panel/ReferralSections';

export default async function MyReferralsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { manager, partner } = await myReferralsPage();
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'referrals' });
  return <section className="space-y-8">
    <div className="space-y-2">
      <h1 className="text-3xl font-semibold">{t('myTitle')}</h1>
      <p>{t('myIntro')}</p>
      <p>{t('commission')}: {partner.commissionPercent}%</p>
      {!partner.active && <p role="status">{t('myInactive')}</p>}
    </div>
    <ReferralSections locale={locale} partnerId={partner.id} propertyOptions={await ownReferralPropertyOptions(manager)}
      endpoint="/api/panel/my-referrals/links" canCreate={partner.active} />
  </section>;
}
