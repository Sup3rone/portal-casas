// src/components/Navbar.tsx
'use client';

import { Link } from '@/i18n/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useSession, signOut } from 'next-auth/react';
import LocaleSwitcher from './LocaleSwitcher';

export default function Navbar() {
  const locale = useLocale();
  const t = useTranslations('nav');
  const { data: session, status } = useSession();
  const isAdmin = (session?.user as { role?: string } | undefined)?.role === 'ADMIN';

  return (
    <nav className="relative z-50 border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-6 py-4">
        <div className="flex items-center justify-between">
          {/* LOGO — izquierda */}
          <Link href="/" className="text-xl font-semibold tracking-widest text-gray-900">
            ALIA<span className="ml-1 text-gray-500">FOR</span>RENT
          </Link>

          {/* NAV LINKS + ACTIONS — derecha */}
          <div className="flex items-center gap-6">
            <Link
              href={`/casas`}
              className="text-sm font-medium tracking-wide text-gray-900 transition-colors hover:text-gray-600"
            >
              PROPIEDADES
            </Link>

            <LocaleSwitcher />

            {status === 'loading' ? null : status === 'authenticated' ? (
              <>
                {isAdmin && (
                  <div className="relative group">
                    <button className="text-sm font-medium tracking-wide text-gray-900 transition-colors hover:text-gray-600">
                      ADMIN ▾
                    </button>
                    <div className="invisible absolute right-0 top-full z-50 w-48 pt-2 opacity-0 transition-all group-hover:visible group-hover:opacity-100">
                      <div className="overflow-hidden rounded-lg bg-white shadow-lg ring-1 ring-gray-200">
                        <Link
                          href="/admin/mensajes"
                          className="block px-4 py-3 text-sm font-medium tracking-wide text-gray-900 transition-colors hover:bg-gray-50"
                        >
                          MENSAJES
                        </Link>
                        <Link
                          href="/admin/tarifas"
                          className="block px-4 py-3 text-sm font-medium tracking-wide text-gray-900 transition-colors hover:bg-gray-50"
                        >
                          TARIFAS
                        </Link>
                        <Link
                          href="/admin/calendario"
                          className="block px-4 py-3 text-sm font-medium tracking-wide text-gray-900 transition-colors hover:bg-gray-50"
                        >
                          CALENDARIO
                        </Link>
                      </div>
                    </div>
                  </div>
                )}

                <Link
                  href="/mi-cuenta"
                  className="text-sm font-medium tracking-wide text-gray-900 transition-colors hover:text-gray-600"
                >
                  MI CUENTA
                </Link>

                <button
                  onClick={() => signOut({ callbackUrl: `/${locale}` })}
                  className="text-sm font-medium tracking-wide text-gray-600 transition-colors hover:text-gray-900"
                >
                  SALIR
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium tracking-wide text-gray-900 transition-colors hover:text-gray-600"
                >
                  LOGIN
                </Link>
                <Link
                  href="/registro"
                  className="rounded-full bg-gray-900 px-6 py-2 text-sm font-semibold tracking-wide text-white transition-colors hover:bg-gray-800"
                >
                  REGISTRARSE
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
