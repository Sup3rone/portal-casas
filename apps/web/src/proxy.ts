import NextAuth from 'next-auth';
import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import { routing } from './i18n/routing';
import { authConfig } from './auth.config';
import { adminRouteAllowed } from './lib/admin-route-access';

const intlMiddleware = createMiddleware(routing);
const { auth } = NextAuth(authConfig);

type SessionConRol = { user?: { role?: string } } | null | undefined;

export default auth(async (req) => {
  // req llega tipado por NextAuth, pero leemos auth con cast explícito
  const session = (req as typeof req & { auth?: SessionConRol }).auth;
  const pathname = req.nextUrl.pathname;
  const isAdmin = session?.user?.role === 'ADMIN';

  // 🔒 Protección de /{locale}/admin/* — ADMIN; COLLABORATOR solo en mensajes/tarifas (T-4719)
  if (adminRouteAllowed(pathname, session?.user?.role) === false) {
    const locale = pathname.split('/')[1];
    return NextResponse.redirect(new URL(`/${locale}/login?reason=admin`, req.url));
  }

  // 👋 Si ya hay sesión, no mostrar login/registro (redirect por rol)
  const authPage = pathname.match(/^\/(es|en|fr)\/(login|registro)$/);
  if (authPage && session) {
    const locale = authPage[1];
    const dest = isAdmin ? `/${locale}/admin` : `/${locale}/mi-cuenta`;
    return NextResponse.redirect(new URL(dest, req.url));
  }

  // El resto pasa por next-intl
  return intlMiddleware(req);
});

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
