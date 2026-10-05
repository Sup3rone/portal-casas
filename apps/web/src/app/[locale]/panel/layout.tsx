import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { panelManager } from '@/lib/panel-server';

export const dynamic = 'force-dynamic';
export default async function PanelLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  await panelManager(locale);
  const t = await getTranslations({ locale, namespace: 'panel' });
  return <main className="mx-auto max-w-6xl space-y-8 px-4 py-10">
    <nav aria-label={t('title')} className="flex flex-wrap gap-6 border-b pb-4">
      <Link href="/panel" className="font-semibold text-green-700">{t('properties')}</Link>
      <Link href="/panel/nueva" className="text-green-700">{t('newProperty')}</Link>
      <Link href="/panel/consultas" className="text-green-700">{t('messages')}</Link>
    </nav>
    {children}
  </main>;
}
