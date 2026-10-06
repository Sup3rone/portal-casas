'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export default function Footer() {
  const t = useTranslations('footer');
  const nav = useTranslations('nav');

  return (
    <footer className="mt-20 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 py-12">
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Portal Casas</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">{t('descripcion')}</p>
          </div>
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-900 dark:text-gray-100 mb-4">{t('navegacion')}</h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <li><Link href="/casas" className="hover:text-purple-600 dark:hover:text-purple-400">{nav('casas')}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-900 dark:text-gray-100 mb-4">{t('contacto')}</h4>
            <p className="text-sm text-gray-600 dark:text-gray-300">hola@portalcasas.com</p>
          </div>
        </div>
        <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          {t('derechos', { year: new Date().getFullYear() })}
        </div>
      </div>
    </footer>
  );
}
