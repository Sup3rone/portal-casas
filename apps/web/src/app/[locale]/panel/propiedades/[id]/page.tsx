import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { panelProperty } from '@/lib/panel-server';
import { propertyResources } from '@/lib/panel-resources';
import PropertyForm from '@/components/panel/PropertyForm';
import PropertyRentalType, { RentalTypeResources } from '@/components/panel/PropertyRentalType';
import PropertyPresentationEditor from '@/components/panel/PropertyPresentationEditor';
import PublicationButton from '@/components/panel/PublicationButton';
import ResourceEditor from '@/components/panel/ResourceEditor';
// Descontinuado en UI, vivo en BD: restaurar import y render para reactivar.
// import SectionBackgroundEditor from '@/components/panel/SectionBackgroundEditor';
import AvailabilityEditor from '@/components/panel/AvailabilityEditor';
import IcalFeedsEditor from '@/components/panel/IcalFeedsEditor';
import { listIcalFeeds } from '@/lib/ical-feeds';
import SectionSlider from '@/components/SectionSlider';
import PropertySectionsEditor from '@/components/panel/PropertySectionsEditor';
import { sectionsForProperty } from '@/lib/property-sections';
import { sectionModules } from '@/lib/section-modules';
import { readAutoTranslated } from '@/lib/auto-translation';
import { fieldNameForKey, propertyGroups, sectionGroup } from '@/lib/translation-groups';

export default async function EditPropertyPage({ params, searchParams }: { params: Promise<{ locale: string; id: string }>; searchParams?: Promise<{ ical?: string }> }) {
  const { locale, id } = await params, { manager, property } = await panelProperty(id, locale);
  const icalNotice = (await searchParams)?.ical; // T-4739: resultado del calendario conectado en el alta
  const resources = await propertyResources(id, manager);
  const feeds = await listIcalFeeds(id, manager); // T-4739: calendarios externos (iCal)
  const sections = await sectionsForProperty(id, manager);
  const modules = sectionModules(property, sections, resources.media);
  // T-5072: qué campos en/fr muestran hoy la traducción automática (etiqueta en el panel).
  const auto = await readAutoTranslated([...propertyGroups(id, property), ...sections.map(section => sectionGroup(id, section.section, section))]);
  const autoFor = (prefix: string) => [...auto].filter(key => key.startsWith(prefix)).map(fieldNameForKey);
  const sectionAuto = Object.fromEntries(sections.map(section => [section.section, autoFor(`section:${id}:${section.section}:`)]));
  const t = await getTranslations({ locale, namespace: 'panel' });
  return <section key={property.id} className="space-y-8">
    <div className="flex flex-wrap gap-6"><Link href="/panel" className="text-green-700 dark:text-green-400 underline">{t('back')}</Link>
      {/* T-5248: mantenimientos y gastos de esta casa. */}
      <Link href={`/panel/propiedades/${id}/gastos`} className="text-green-700 dark:text-green-400 underline">{t('expenses')}</Link></div>
    <div className="flex flex-wrap items-center justify-between gap-4"><h1 className="text-3xl font-semibold">{t('edit')}</h1>
      <span>{t(property.published ? 'published' : 'draft')}</span><PublicationButton id={id} published={property.published} canManagePublication={manager.role === 'ADMIN' || manager.canPublishProperties} /></div>
    <PropertyRentalType key={`${id}:${property.rentalType}`} initial={property.rentalType}>
    <PropertyForm property={property} autoTranslated={autoFor(`property:${id}:`)} />
    <PropertyPresentationEditor key={JSON.stringify(property.sectionTitles)} property={property} modules={modules} />
    <RentalTypeResources>
    <ResourceEditor propertyId={id} resource="rates" items={resources.rates} />
    <AvailabilityEditor propertyId={id} bookings={resources.bookings} />
    <IcalFeedsEditor propertyId={id} feeds={feeds} notice={icalNotice} />
    </RentalTypeResources>
    </PropertyRentalType>
    {resources.media.length > 0 && <SectionSlider slides={resources.media} />}
    <ResourceEditor propertyId={id} resource="media" items={resources.media.filter(item => item.type === 'PHOTO')} />
    {/* <SectionBackgroundEditor property={property} media={resources.media} /> */}
    <PropertySectionsEditor propertyId={id} sections={sections} media={resources.media} modules={modules} order={property.sectionsOrder} autoTranslated={sectionAuto} />
  </section>;
}
