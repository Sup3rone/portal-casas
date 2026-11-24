// T-5210: entrada de la app instalada (la PWA de la Task 8 abre aquí). Quien tiene panel abre en su último modo
// (cookie alia_mode del switch; por defecto, vendedor); cualquier otro va a la portada.
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { panelManager } from '@/lib/panel-server';
import { MODE_COOKIE } from '@/lib/vendor-mode';
import { privateMetadata } from '@/lib/seo';

export const metadata = privateMetadata;
export const dynamic = 'force-dynamic';

export default async function AppEntry({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  await panelManager(locale); // sin panel → redirect a /{locale}
  const mode = (await cookies()).get(MODE_COOKIE)?.value;
  redirect(mode === 'user' ? `/${locale}` : `/${locale}/panel/vender`);
}
