import { getTranslations } from 'next-intl/server';
import { panelManager } from '@/lib/panel-server';
import PropertyForm from '@/components/panel/PropertyForm';
import PropertyRentalType from '@/components/panel/PropertyRentalType';

export default async function NewPropertyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  await panelManager(locale);
  const t = await getTranslations({ locale, namespace: 'panel' });
  return <section className="space-y-6"><h1 className="text-3xl font-semibold">{t('newProperty')}</h1>{/* T-4739: el proveedor oculta el calendario iCal si se elige renta anual. */}<PropertyRentalType initial="nocturna"><PropertyForm /></PropertyRentalType></section>;
}
