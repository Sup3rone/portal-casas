import { db, properties } from '@portal/db';
import { asc } from 'drizzle-orm';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { managedProperties } from '@/lib/property-access';
import { panelManager } from '@/lib/panel-server';
import PublicationButton from '@/components/panel/PublicationButton';

export default async function PanelPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params, manager = await panelManager(locale);
  const t = await getTranslations({ locale, namespace: 'panel' });
  const rows = await db.select().from(properties).where(managedProperties(manager)).orderBy(asc(properties.slug));
  return <section className="space-y-6">
    <h1 className="text-3xl font-semibold">{t(manager.role === 'ADMIN' ? 'allProperties' : 'properties')}</h1>
    {!rows.length && <p>{t('emptyProperties')}</p>}
    {rows.map(property => <article key={property.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-white p-6 shadow-sm">
      <div><h2 className="text-xl font-semibold">{locale === 'en' ? property.titleEn : locale === 'fr' ? property.titleFr : property.titleEs}</h2>
        <p className="text-gray-600">{property.city} · {t(property.published ? 'published' : 'draft')}</p></div>
      <div className="flex flex-wrap items-center gap-4"><Link href={`/panel/propiedades/${property.id}`} className="text-green-700 underline">{t('edit')}</Link>
        <PublicationButton id={property.id} published={property.published} admin={manager.role === 'ADMIN'} /></div>
    </article>)}
  </section>;
}
