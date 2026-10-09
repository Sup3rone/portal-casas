import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { panelManager } from '@/lib/panel-server';

export const dynamic = 'force-dynamic';
export default async function PanelLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const manager = await panelManager(locale);
  const t = await getTranslations({ locale, namespace: 'panel' });
  const admin = await getTranslations({ locale, namespace: 'adminUsers' });
  const nav = await getTranslations({ locale, namespace: 'nav' });
  const content = await getTranslations({ locale, namespace: 'siteContent' });
  return <main className="mx-auto max-w-6xl space-y-8 px-4 py-10">
    <nav aria-label={t('title')} className="flex flex-wrap gap-6 border-b pb-4 dark:border-gray-700">
      <Link href="/panel" className="font-semibold text-green-700 dark:text-green-400">{t('properties')}</Link>
      <Link href="/panel/nueva" className="text-green-700 dark:text-green-400">{t('newProperty')}</Link>
      <Link href="/panel/consultas" className="text-green-700 dark:text-green-400">{t('messages')}</Link>
      {manager.role === 'COLLABORATOR' && <Link href="/panel/calendario" className="text-green-700 dark:text-green-400">{nav('calendario')}</Link>}
      {manager.role === 'ADMIN' && <Link href="/panel/usuarios" className="text-green-700 dark:text-green-400">{admin('title')}</Link>}
      {manager.role === 'ADMIN' && <Link href="/panel/contenido" className="text-green-700 dark:text-green-400">{content('title')}</Link>}
      {manager.role === 'ADMIN' && <>
        <Link href="/admin/mensajes" className="text-green-700 dark:text-green-400">{nav('mensajes')}</Link>
        <Link href="/admin/tarifas" className="text-green-700 dark:text-green-400">{nav('tarifas')}</Link>
        <Link href="/admin/calendario" className="text-green-700 dark:text-green-400">{nav('calendario')}</Link>
      </>}
    </nav>
    {children}
  </main>;
}
