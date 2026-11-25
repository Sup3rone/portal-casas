import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { panelManager } from '@/lib/panel-server';
import { privateMetadata } from '@/lib/seo';
import RegisterServiceWorker from '@/components/panel/RegisterServiceWorker';

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
  const vendor = await getTranslations({ locale, namespace: 'vendor' });
  const emails = await getTranslations({ locale, namespace: 'emailLog' });
  // T-5201: la misma lista de enlaces va en el menú de escritorio (md+) y dentro de «Más» de la barra móvil.
  const links = <>
      <Link href="/panel/vender" className="font-semibold text-green-700 dark:text-green-400">{vendor('navSell')}</Link>
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
      {/* T-5310: bitácora de correos enviados (solo ADMIN). */}
      {manager.role === 'ADMIN' && <Link href="/panel/correos" className="text-green-700 dark:text-green-400">{emails('navTitle')}</Link>}
      {/* T-4767: el ADMIN ve todos los referidores; el dueño (COLLABORATOR) administra los suyos. */}
      <Link href="/panel/referidos" className="text-green-700 dark:text-green-400">{referrals(manager.role === 'ADMIN' ? 'title' : 'ownerTitle')}</Link>
      {manager.role === 'ADMIN' && <>
        <Link href="/admin/calendario" className="text-green-700 dark:text-green-400">{nav('calendario')}</Link>
      </>}
  </>;
  // T-5201: en el teléfono, una barra fija con los accesos del vendedor; el resto, en «Más». El ADMIN no tiene
  // «Consultas» en el panel, así que su tercer acceso es Reservas.
  const quick = [
    { href: '/panel/vender', label: vendor('navSell') },
    { href: manager.role === 'ADMIN' ? '/admin/calendario' : '/panel/calendario', label: nav('calendario') },
    manager.role === 'ADMIN' ? { href: '/panel/reservas', label: t('bookings') } : { href: '/panel/consultas', label: t('messages') },
  ];
  const tab = 'flex min-h-14 items-center justify-center px-1 text-center text-sm font-semibold text-green-800 dark:text-green-300';
  return <main data-panel-palette="paper" className="panel-skin mx-auto max-w-6xl space-y-6 px-4 pb-28 pt-6 md:space-y-8 md:py-10">
    <nav aria-label={t('title')} className="hidden md:flex flex-wrap gap-6 border-b pb-4 dark:border-gray-700">
      {links}
    </nav>
    {children}
    {/* T-5213: la app instalada (PWA/TWA) necesita el service worker; se registra desde el panel. */}
    <RegisterServiceWorker />
    <nav data-mobile-nav="" aria-label={vendor('mobileNav')} className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden dark:border-gray-700 dark:bg-gray-900/95">
      <ul className="grid grid-cols-4">
        {quick.map(item => <li key={item.href}><Link href={item.href} className={tab}>{item.label}</Link></li>)}
        <li>
          <details className="group relative">
            <summary className={`${tab} cursor-pointer list-none [&::-webkit-details-marker]:hidden`}>{vendor('more')}</summary>
            <div className="absolute bottom-full right-2 mb-2 flex w-64 flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-xl dark:border-gray-700 dark:bg-gray-900">
              {links}
            </div>
          </details>
        </li>
      </ul>
    </nav>
  </main>;
}
