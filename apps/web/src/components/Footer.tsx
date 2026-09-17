'use client';

import { useTranslations } from 'next-intl';

export default function Footer() {
  const t = useTranslations('footer');

  return (
    <footer className="mt-20 border-t border-gray-200 bg-white py-12">
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Portal Casas</h3>
            <p className="text-sm text-gray-600">{t('descripcion')}</p>
          </div>
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-900 mb-4">{t('navegacion')}</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><a href="/es/casas" className="hover:text-purple-600">Casas</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-900 mb-4">{t('contacto')}</h4>
            <p className="text-sm text-gray-600">hola@portalcasas.com</p>
          </div>
        </div>
        <div className="mt-8 border-t border-gray-200 pt-8 text-center text-sm text-gray-500">
          {t('derechos', { year: new Date().getFullYear() })}
        </div>
      </div>
    </footer>
  );
}
