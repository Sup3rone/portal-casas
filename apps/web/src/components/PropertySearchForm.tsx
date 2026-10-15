'use client';
import { useId } from 'react';
import { useLocale, useTranslations } from 'next-intl';

export default function PropertySearchForm() {
  const locale = useLocale(), t = useTranslations('home'), id = useId();
  return (
<form
            action={`/${locale}/casas`}
            method="GET"
            aria-label={t('buscar')} className="glass-panel flex flex-wrap items-end justify-center gap-4 rounded-2xl p-6 shadow-2xl"
          >
            <div className="w-full text-left sm:w-auto">
              <label htmlFor={id + '-start'} className="mb-1 block text-xs tracking-widest text-gray-600 dark:text-gray-300">
                {t('llegada')}
              </label>
              <input id={id + '-start'} type="date" name="start"
                className="min-h-11 w-full rounded-lg sm:w-40 border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:border-gray-900 dark:focus:border-green-500 focus:outline-none dark:bg-gray-800 dark:text-gray-100"
              />
            </div>

            <div className="w-full text-left sm:w-auto">
              <label htmlFor={id + '-end'} className="mb-1 block text-xs tracking-widest text-gray-600 dark:text-gray-300">
                {t('salida')}
              </label>
              <input id={id + '-end'} type="date" name="end"
                className="min-h-11 w-full rounded-lg sm:w-40 border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:border-gray-900 dark:focus:border-green-500 focus:outline-none dark:bg-gray-800 dark:text-gray-100"
              />
            </div>

            <div className="w-full text-left sm:w-auto">
              <label htmlFor={id + '-guests'} className="mb-1 block text-xs tracking-widest text-gray-600 dark:text-gray-300">
                {t('huespedes')}
              </label>
              <select id={id + '-guests'} name="guests"
                className="min-h-11 w-full rounded-lg sm:w-32 border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:border-gray-900 dark:focus:border-green-500 focus:outline-none dark:bg-gray-800 dark:text-gray-100"
              >
                <option value="">{t('cualquiera')}</option>
                {[1, 2, 3, 4, 6, 8, 10].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="min-h-11 rounded-lg bg-black dark:bg-green-700 px-8 py-2.5 text-sm font-semibold tracking-widest text-white dark:text-gray-100 transition hover:bg-gray-800 dark:hover:bg-green-600"
            >
              {t('buscar')}
            </button>
          </form>
  );
}
