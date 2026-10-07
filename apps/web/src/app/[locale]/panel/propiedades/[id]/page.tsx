import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { panelProperty } from '@/lib/panel-server';
import { propertyResources } from '@/lib/panel-resources';
import PropertyForm from '@/components/panel/PropertyForm';
import PublicationButton from '@/components/panel/PublicationButton';
import ResourceEditor from '@/components/panel/ResourceEditor';
import AvailabilityEditor from '@/components/panel/AvailabilityEditor';
import SectionSlider from '@/components/SectionSlider';
import PropertySectionsEditor from '@/components/panel/PropertySectionsEditor';
import { sectionsForProperty } from '@/lib/property-sections';

export default async function EditPropertyPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params, { manager, property } = await panelProperty(id, locale);
  const resources = await propertyResources(id, manager);
  const sections = await sectionsForProperty(id, manager);
  const t = await getTranslations({ locale, namespace: 'panel' });
  return <section className="space-y-8">
    <Link href="/panel" className="text-green-700 dark:text-green-400 underline">{t('back')}</Link>
    <div className="flex flex-wrap items-center justify-between gap-4"><h1 className="text-3xl font-semibold">{t('edit')}</h1>
      <span>{t(property.published ? 'published' : 'draft')}</span><PublicationButton id={id} published={property.published} admin={manager.role === 'ADMIN'} /></div>
    <PropertyForm property={property} />
    <ResourceEditor propertyId={id} resource="rates" items={resources.rates} />
    <AvailabilityEditor propertyId={id} bookings={resources.bookings} />
    {resources.media.length > 0 && <SectionSlider slides={resources.media} />}
    <ResourceEditor propertyId={id} resource="media" items={resources.media.filter(item => item.type === 'PHOTO')} />
    <PropertySectionsEditor propertyId={id} sections={sections} media={resources.media} />
  </section>;
}
