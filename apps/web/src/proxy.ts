import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

// Genera el token de sesión con Web Crypto (compatible con Edge Runtime)
async function generarToken(password: string | undefined): Promise<string> {
  if (!password) return 'sin-password-configurada';
  const data = new TextEncoder().encode(`${password}::portal-casas-salt`);
  const buffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 🔒 Protección de rutas /{locale}/admin/*
  const adminMatch = pathname.match(/^\/(es|en|fr)\/admin(\/.*)?$/);
  if (adminMatch) {
    const locale = adminMatch[1];
    const esLogin = pathname.endsWith('/admin/login');
    const tokenValido = await generarToken(process.env.ADMIN_PASSWORD);
    const cookieSession = req.cookies.get('admin_session')?.value;

    if (cookieSession !== tokenValido && !esLogin) {
      return NextResponse.redirect(new URL(`/${locale}/admin/login`, req.url));
    }
  }

  // El resto de rutas pasan por next-intl
  return intlMiddleware(req);
}

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)']
};
