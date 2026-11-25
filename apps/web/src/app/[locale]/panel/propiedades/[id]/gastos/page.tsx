// T-5248: mantenimientos y gastos de una casa. Mismo corte que la ficha: panelProperty → 404 si no es suya.
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { panelProperty } from '@/lib/panel-server';
import { loadPropertyExpenses } from '@/lib/property-expenses';
import { inquiryToday } from '@/lib/inquiry-validation';
import { attachmentsEnabled } from '@/lib/expense-attachments';
import PropertyExpenses from '@/components/panel/PropertyExpenses';

export default async function PropertyExpensesPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params, { manager, property } = await panelProperty(id, locale);
  const data = await loadPropertyExpenses(id, manager);
  const t = await getTranslations({ locale, namespace: 'expenses' });
  const title = locale === 'en' ? property.titleEn : locale === 'fr' ? property.titleFr : property.titleEs;
  return <section className="space-y-6">
    <Link href={`/panel/propiedades/${id}`} className="text-green-700 dark:text-green-400 underline">{t('backToProperty')}</Link>
    <div className="space-y-1"><h1 className="text-3xl font-semibold">{t('title')}</h1><p className="text-gray-600 dark:text-gray-300">{title}</p></div>
    <PropertyExpenses propertyId={id} data={data} today={inquiryToday()} isAdmin={manager.role === 'ADMIN'} attachmentsEnabled={attachmentsEnabled()} />
  </section>;
}
