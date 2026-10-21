'use client';
import { useId, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { DestinationState } from '@/lib/destinations';
import type { PublishedDestinationGroup } from '@/lib/published-destinations';

export default function PropertySearchForm({ initial = {}, boldLabels = false, destinations = [] }: { destinations?: PublishedDestinationGroup[]; boldLabels?: boolean; initial?: { state?: DestinationState; destinationCity?: string; start?: string; end?: string; guests?: number } }) {
  const locale = useLocale(), t = useTranslations('home'), id = useId();
  const fields = useTranslations('panel.fields');
  const [state, setState] = useState<DestinationState | ''>(initial.state || '');
  const [city, setCity] = useState(initial.destinationCity || '');
  // Catálogo completo descontinuado en UI; sigue vivo para validar los filtros.
  // Un filtro activo sin publicadas permanece visible hasta que el usuario lo cambie.
  const publishedStates = destinations.map(group => group.state);
  const states = [...publishedStates, ...(state && !publishedStates.includes(state) ? [state] : [])].sort((a, b) => a.localeCompare(b, 'es'));
  const publishedCities = destinations.find(group => group.state === state)?.cities || [];
  const cities = [...publishedCities, ...(city && !publishedCities.includes(city) ? [city] : [])].sort((a, b) => a.localeCompare(b, 'es'));
  const guests = Number.isInteger(initial.guests) && Number(initial.guests) > 0 ? initial.guests : undefined;
  const locationClass = 'min-h-11 w-full min-w-0 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100';
  return (
<form
            action={`/${locale}/casas`}
            method="GET"
            aria-label={t('buscar')} className="glass-panel flex flex-wrap items-end justify-center gap-4 rounded-2xl p-6 shadow-2xl"
          >
            <div className="w-full min-w-0 text-left sm:w-48">
              <label htmlFor={id + '-state'} className="mb-1 block text-xs tracking-widest text-gray-600 dark:text-gray-300">{fields('state')}</label>
              <select id={id + '-state'} name="state" value={state} onChange={event => { setState(event.target.value as DestinationState | ''); setCity(''); }} className={locationClass}>
                <option value="">{t('allStates')}</option>
                {states.map(name => <option key={name} value={name}>{name}</option>)}
              </select>
            </div>
            <div className="w-full min-w-0 text-left sm:w-48">
              <label htmlFor={id + '-city'} className="mb-1 block text-xs tracking-widest text-gray-600 dark:text-gray-300">{fields('city')}</label>
              <select id={id + '-city'} name="destinationCity" value={city} disabled={!state} onChange={event => setCity(event.target.value)} className={locationClass}>
                <option value="">{t('allCities')}</option>
                {state && cities.map(name => <option key={name} value={name}>{name}</option>)}
              </select>
            </div>
            <div className="w-full text-left sm:w-auto">
              <label htmlFor={id + '-start'} className={`mb-1 block text-xs tracking-widest text-gray-600 dark:text-gray-300${boldLabels ? ' font-bold' : ''}`}>
                {t('llegada')}
              </label>
              <input id={id + '-start'} type="date" name="start" defaultValue={initial.start}
                className="min-h-11 w-full rounded-lg sm:w-40 border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:border-gray-900 dark:focus:border-green-500 focus:outline-none dark:bg-gray-800 dark:text-gray-100"
              />
            </div>

            <div className="w-full text-left sm:w-auto">
              <label htmlFor={id + '-end'} className={`mb-1 block text-xs tracking-widest text-gray-600 dark:text-gray-300${boldLabels ? ' font-bold' : ''}`}>
                {t('salida')}
              </label>
              <input id={id + '-end'} type="date" name="end" defaultValue={initial.end}
                className="min-h-11 w-full rounded-lg sm:w-40 border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:border-gray-900 dark:focus:border-green-500 focus:outline-none dark:bg-gray-800 dark:text-gray-100"
              />
            </div>

            <div className="w-full text-left sm:w-auto">
              <label htmlFor={id + '-guests'} className={`mb-1 block text-xs tracking-widest text-gray-600 dark:text-gray-300${boldLabels ? ' font-bold' : ''}`}>
                {t('huespedes')}
              </label>
              <select id={id + '-guests'} name="guests" defaultValue={guests ?? ''}
                className="min-h-11 w-full rounded-lg sm:w-32 border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:border-gray-900 dark:focus:border-green-500 focus:outline-none dark:bg-gray-800 dark:text-gray-100"
              >
                <option value="">{t('cualquiera')}</option>
                {[...new Set([1, 2, 3, 4, 6, 8, 10, ...(guests ? [guests] : [])])].sort((a, b) => a - b).map((n) => (
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
