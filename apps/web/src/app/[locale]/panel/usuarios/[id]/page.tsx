import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { AccessError } from '@/lib/property-access';
import { adminUsersPage, getAdminUser, adminUserProperties } from '@/lib/admin-users';
import UserActions from '@/components/panel/UserActions';

export default async function UserPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const actor = await adminUsersPage(), { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: 'adminUsers' }), panel = await getTranslations({ locale, namespace: 'panel' });
  let user;
  try { user = await getAdminUser(id); }
  catch (error) { if (error instanceof AccessError && error.status === 404) notFound(); throw error; }
  const properties = await adminUserProperties(id);
  return <section className="space-y-6">
    <Link href="/panel/usuarios" className="text-green-700 dark:text-green-400 underline">{t('back')}</Link>
    <h1 className="break-all text-3xl font-semibold">{user.email}</h1><p>{t('role')}: {t(`roles.${user.role}`)}</p>
    <UserActions id={id} role={user.role} self={actor.id === id} />
    <h2 className="text-xl font-semibold">{t('properties')}</h2>
    {!properties.length && <p>{t('noProperties')}</p>}
    {properties.map(property => <article key={property.id} className="rounded-lg border p-4 dark:border-gray-700">
      <Link href={`/panel/propiedades/${property.id}`} className="text-green-700 dark:text-green-400 underline">
        {locale === 'en' ? property.titleEn : locale === 'fr' ? property.titleFr : property.titleEs}</Link>
      <p className="break-all">{property.slug}</p><p>{panel(property.published ? 'published' : 'draft')}</p>
    </article>)}
  </section>;
}
