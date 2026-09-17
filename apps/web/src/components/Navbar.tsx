'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import LocaleSwitcher from './LocaleSwitcher';

export default function Navbar() {
  const locale = useLocale();
  const t = useTranslations('nav');

  return (
    <nav className="border-b border-gray-100 bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href={`/${locale}`} className="flex items-center gap-2">
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Portal Casas
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href={`/${locale}/casas`}
              className="text-sm font-medium text-gray-700 transition-colors hover:text-purple-600"
            >
              {t('casas')}
            </Link>
            <LocaleSwitcher />
            <Link
              href={`/${locale}/admin/mensajes`}
              className="rounded-full bg-purple-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-purple-700"
            >
              {t('admin')}
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
