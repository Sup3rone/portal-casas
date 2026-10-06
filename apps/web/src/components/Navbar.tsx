// src/components/Navbar.tsx
'use client';

import { Link } from '@/i18n/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useSession, signOut } from 'next-auth/react';
import LocaleSwitcher from './LocaleSwitcher';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  const locale = useLocale();
  const t = useTranslations('nav');
  const { data: session, status } = useSession();
  const isAdmin = (session?.user as { role?: string } | undefined)?.role === 'ADMIN';
  const isManager = isAdmin || (session?.user as { role?: string } | undefined)?.role === 'COLLABORATOR';

  return (
    <nav className="relative z-50 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-6 py-4">
        <div className="flex items-center justify-between max-md:flex-wrap max-md:gap-4">
          {/* LOGO — izquierda */}
          <Link href="/" className="text-xl font-semibold tracking-widest text-gray-900 dark:text-gray-100">
            ALIA<span className="ml-1 text-gray-500 dark:text-gray-400">FOR</span>RENT
          </Link>

          {/* NAV LINKS + ACTIONS — derecha */}
          <div className="flex items-center gap-6 max-md:w-full max-md:flex-wrap max-md:gap-4">
            <Link
              href={`/casas`}
              className="text-sm font-medium tracking-wide text-gray-900 dark:text-gray-100 transition-colors hover:text-gray-600 dark:hover:text-gray-300"
            >
              {t('casas')}
            </Link>

            <LocaleSwitcher />
            <ThemeToggle />

            {status === 'loading' ? null : status === 'authenticated' ? (
              <>
                {isManager && <Link href="/panel" className="text-sm font-medium tracking-wide text-green-700 dark:text-green-400">{t(isAdmin ? 'panelAdmin' : 'panelCollaborator')}</Link>}

                <Link
                  href="/mi-cuenta"
                  className="text-sm font-medium tracking-wide text-gray-900 dark:text-gray-100 transition-colors hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {t('cuenta').toUpperCase()}
                </Link>

                <button
                  onClick={() => signOut({ callbackUrl: `/${locale}` })}
                  className="text-sm font-medium tracking-wide text-gray-600 dark:text-gray-300 transition-colors hover:text-gray-900 dark:hover:text-gray-100"
                >
                  {t('salir').toUpperCase()}
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium tracking-wide text-gray-900 dark:text-gray-100 transition-colors hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {t('login').toUpperCase()}
                </Link>
                <Link
                  href="/registro"
                  className="rounded-full bg-gray-900 dark:bg-green-700 px-6 py-2 text-sm font-semibold tracking-wide text-white dark:text-gray-100 transition-colors hover:bg-gray-800 dark:hover:bg-green-600"
                >
                  {t('registro').toUpperCase()}
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
