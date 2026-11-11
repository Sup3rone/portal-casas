import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { panelManager } from '@/lib/panel-server';
import { privateMetadata } from '@/lib/seo';

export const metadata = privateMetadata;

export const dynamic = 'force-dynamic';
export default async function PanelLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const manager = await panelManager(locale);
  const t = await getTranslations({ locale, namespace: 'panel' });
  const admin = await getTranslations({ locale, namespace: 'adminUsers' });
  const nav = await getTranslations({ locale, namespace: 'nav' });
  const content = await getTranslations({ locale, namespace: 'siteContent' });
  const referrals = await getTranslations({ locale, namespace: 'referrals' });
  const report = await getTranslations({ locale, namespace: 'monthlyReport' });
  return <main data-panel-palette="paper" className="panel-skin mx-auto max-w-6xl space-y-8 px-4 py-10">
    <nav aria-label={t('title')} className="flex flex-wrap gap-6 border-b pb-4 dark:border-gray-700">
      {manager.role === 'COLLABORATOR' && <>
      <Link href="/panel" className="font-semibold text-green-700 dark:text-green-400">{t('properties')}</Link>
      <Link href="/panel/nueva" className="text-green-700 dark:text-green-400">{t('newProperty')}</Link>
      <Link href="/panel/consultas" className="text-green-700 dark:text-green-400">{t('messages')}</Link>
      <Link href="/admin/mensajes" className="text-green-700 dark:text-green-400">{nav('mensajes')}</Link>
      <Link href="/admin/tarifas" className="text-green-700 dark:text-green-400">{nav('tarifas')}</Link>
      </>}
      {manager.role === 'COLLABORATOR' && <Link href="/panel/calendario" className="text-green-700 dark:text-green-400">{nav('calendario')}</Link>}
      {/* T-4738: reservas con desglose de precio (ADMIN todas; colaborador las suyas). */}
      <Link href="/panel/reservas" className="text-green-700 dark:text-green-400">{t('bookings')}</Link>
      {/* T-4739: reporte mensual de comisiones, solo para el colaborador (el ADMIN administra funcionalidades). */}
      {manager.role === 'COLLABORATOR' && <Link href="/panel/reporte" className="text-green-700 dark:text-green-400">{report('navTitle')}</Link>}
      {/* T-4767: «Mis referidos» (T-4736) descontinuado en UI; el dueño usa «Mis referidores». */}
      {manager.role === 'ADMIN' && <Link href="/panel/usuarios" className="text-green-700 dark:text-green-400">{admin('title')}</Link>}
      {manager.role === 'ADMIN' && <Link href="/panel/contenido" className="text-green-700 dark:text-green-400">{content('title')}</Link>}
      {/* T-4767: el ADMIN ve todos los referidores; el dueño (COLLABORATOR) administra los suyos. */}
      <Link href="/panel/referidos" className="text-green-700 dark:text-green-400">{referrals(manager.role === 'ADMIN' ? 'title' : 'ownerTitle')}</Link>
      {manager.role === 'ADMIN' && <>
        <Link href="/admin/calendario" className="text-green-700 dark:text-green-400">{nav('calendario')}</Link>
      </>}
    </nav>
    {children}
  </main>;
}
