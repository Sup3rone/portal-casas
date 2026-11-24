// T-5210: entrada de la APP INSTALADA (start_url de la PWA/APK, Task 8). Marca este navegador como «la app» (cookie
// alia_app, para que aparezca el switch de modo) y abre: quien tiene panel, en su último modo (alia_mode; por defecto
// vendedor → «¿Qué está libre?»); cualquier otro, en la portada. Los permisos del panel siguen en el servidor.
import { NextResponse } from 'next/server';
import { AccessError, requirePropertyManager } from '@/lib/property-access';
import { APP_COOKIE, MODE_COOKIE } from '@/lib/vendor-mode';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, context: { params: Promise<{ locale: string }> }) {
  const requested = (await context.params).locale;
  const locale = ['es', 'en', 'fr'].includes(requested) ? requested : 'es';
  let manager = false;
  try { await requirePropertyManager(); manager = true; }
  catch (error) { if (!(error instanceof AccessError)) throw error; }
  const mode = request.headers.get('cookie')?.split(';').map(part => part.trim()).find(part => part.startsWith(MODE_COOKIE + '='))?.slice(MODE_COOKIE.length + 1);
  const target = manager && mode !== 'user' ? `/${locale}/panel/vender` : `/${locale}`;
  const response = NextResponse.redirect(new URL(target, request.url), 307);
  response.cookies.set(APP_COOKIE, '1', { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
  return response;
}
