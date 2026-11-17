import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { requireAdmin, AccessError } from '@/lib/property-access';
import { readSiteContent, featuredPropertyOptions } from '@/lib/site-content';
import SiteContentEditor from '@/components/panel/SiteContentEditor';
import PageContentEditor from '@/components/panel/PageContentEditor';
import { pageContentLocales, pageContentPages, pageFields, type PageContentLocale } from '@/lib/page-content';
import { readPageContent } from '@/lib/page-content-store';

export default async function ContentPage({ params }: { params: Promise<{ locale: string }> }) {
  try { await requireAdmin(); }
  catch (error) { if (error instanceof AccessError) notFound(); throw error; }
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'siteContent' });
  const pages = await getTranslations({ locale, namespace: 'panelPages' });
  const [content, rows, about, join] = await Promise.all([readSiteContent(), featuredPropertyOptions(), readPageContent('about'), readPageContent('join')]);
  const options = rows.map(row => ({ id: row.id, label: (locale === 'en' ? row.titleEn : locale === 'fr' ? row.titleFr : row.titleEs).trim() || row.titleEs, city: row.city }));
  // T-4944: texto por defecto de cada campo editable en los 3 idiomas (se muestra en gris en el editor).
  const keys = pageContentPages.flatMap(page => pageFields(page).map(field => field.key));
  const defaults = Object.fromEntries(await Promise.all(pageContentLocales.map(async language => {
    const messages = await getTranslations({ locale: language });
    return [language, Object.fromEntries(keys.map(key => [key, String(messages.raw(key as Parameters<typeof messages.raw>[0]) ?? '')]))];
  }))) as Record<PageContentLocale, Record<string, string>>;
  return <section className="space-y-6"><h1 className="text-3xl font-semibold">{t('title')}</h1><SiteContentEditor content={content} properties={options} />
    {/* T-4944: textos e imágenes de /nosotros y /unete. */}
    <section aria-labelledby="page-content-title" className="space-y-4">
      <h2 id="page-content-title" className="text-2xl font-semibold">{pages('title')}</h2>
      <p className="text-sm text-gray-600 dark:text-gray-300">{pages('intro')}</p>
      {pageContentPages.map(page => <details key={page} className="rounded-2xl border bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <summary className="flex min-h-11 cursor-pointer items-center px-6 py-3 font-medium">{pages(`pages.${page}`)}</summary>
        <div className="border-t p-2 dark:border-gray-700"><PageContentEditor page={page} initial={page === 'about' ? about : join} defaults={defaults} /></div>
      </details>)}
    </section>
  </section>;
}
