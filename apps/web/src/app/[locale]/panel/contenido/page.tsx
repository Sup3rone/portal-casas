import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { requireAdmin, AccessError } from '@/lib/property-access';
import { readSiteContent, featuredPropertyOptions } from '@/lib/site-content';
import SiteContentEditor from '@/components/panel/SiteContentEditor';

export default async function ContentPage({ params }: { params: Promise<{ locale: string }> }) {
  try { await requireAdmin(); }
  catch (error) { if (error instanceof AccessError) notFound(); throw error; }
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'siteContent' });
  const [content, rows] = await Promise.all([readSiteContent(), featuredPropertyOptions()]);
  const options = rows.map(row => ({ id: row.id, label: (locale === 'en' ? row.titleEn : locale === 'fr' ? row.titleFr : row.titleEs).trim() || row.titleEs, city: row.city }));
  return <section className="space-y-6"><h1 className="text-3xl font-semibold">{t('title')}</h1><SiteContentEditor content={content} properties={options} /></section>;
}
