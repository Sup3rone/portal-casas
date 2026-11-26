import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { requireContentEditor, AccessError } from '@/lib/property-access';
import { readSiteContent, featuredPropertyOptions } from '@/lib/site-content';
import SiteContentEditor from '@/components/panel/SiteContentEditor';
import PageContentEditor from '@/components/panel/PageContentEditor';
import SeasonPicker from '@/components/panel/SeasonPicker';
import { readSiteSeason } from '@/lib/site-season';
import { pageContentLocales, pageContentPages, pageFields, type PageContentLocale } from '@/lib/page-content';
import { readPageContent } from '@/lib/page-content-store';
import { readAutoTranslated } from '@/lib/auto-translation';
import { fieldNameForKey, pageGroups, siteGroups } from '@/lib/translation-groups';

const sections = ['season', 'home', ...pageContentPages] as const;

export default async function ContentPage({ params }: { params: Promise<{ locale: string }> }) {
  try { await requireContentEditor(); } // T-5322: ADMIN o diseñador.
  catch (error) { if (error instanceof AccessError) notFound(); throw error; }
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'siteContent' });
  const pages = await getTranslations({ locale, namespace: 'panelPages' });
  const [content, rows, about, join, season] = await Promise.all([readSiteContent(), featuredPropertyOptions(), readPageContent('about'), readPageContent('join'), readSiteSeason()]);
  const options = rows.map(row => ({ id: row.id, label: (locale === 'en' ? row.titleEn : locale === 'fr' ? row.titleFr : row.titleEs).trim() || row.titleEs, city: row.city }));
  // T-4944: texto por defecto de cada campo editable en los 3 idiomas (se muestra en gris en el editor).
  const keys = pageContentPages.flatMap(page => pageFields(page).map(field => field.key));
  const defaults = Object.fromEntries(await Promise.all(pageContentLocales.map(async language => {
    const messages = await getTranslations({ locale: language });
    return [language, Object.fromEntries(keys.map(key => [key, String(messages.raw(key as Parameters<typeof messages.raw>[0]) ?? '')]))];
  }))) as Record<PageContentLocale, Record<string, string>>;
  // T-5072: campos en/fr que hoy muestran la traducción automática (etiqueta en cada editor).
  const auto = [...await readAutoTranslated([...siteGroups(content), ...pageGroups('about', about.texts), ...pageGroups('join', join.texts)])];
  const autoFor = (prefix: string) => auto.filter(key => key.startsWith(prefix)).map(fieldNameForKey);
  // T-4944: tres desplegables, uno abierto a la vez (details con el mismo name), para no apilar todo en una sola página.
  return <section className="space-y-6">
    <h1 className="text-3xl font-semibold">{t('title')}</h1>
    <div className="space-y-3">
      {sections.map(section => <details key={section} name="content-section" data-content-section={section} className="group rounded-2xl border border-gray-200 bg-white shadow-sm open:shadow-md dark:border-gray-700 dark:bg-gray-900">
        <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 rounded-2xl px-6 py-4 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700 dark:hover:bg-gray-800 [&::-webkit-details-marker]:hidden">
          <span className="min-w-0">
            <span className="block font-medium">{pages(`pages.${section}`)}</span>
            <span className="block text-sm text-gray-600 dark:text-gray-300">{pages(`pageDescriptions.${section}`)}</span>
          </span>
          <span aria-hidden="true" className="shrink-0 text-xl leading-none transition-transform group-open:rotate-45">+</span>
        </summary>
        {/* El formulario trae su propia tarjeta; dentro del desplegable se aplana para no anidar cajas. */}
        <div className="border-t border-gray-200 dark:border-gray-700 [&>form]:rounded-none [&>form]:rounded-b-2xl [&>form]:border-0 [&>form]:shadow-none">
          {section === 'season' ? <SeasonPicker initial={season} /> : section === 'home'
            ? <SiteContentEditor content={content} properties={options} autoTranslated={autoFor('site:')} />
            : <><p className="px-6 pt-5 text-sm text-gray-600 dark:text-gray-300">{pages('intro')}</p><PageContentEditor page={section} initial={section === 'about' ? about : join} defaults={defaults} autoTranslated={autoFor(`page:${section}:`)} /></>}
        </div>
      </details>)}
    </div>
  </section>;
}
