'use client';
// T-5201: buscador del vendedor (/panel/vender). GET a la misma página: la URL guarda la búsqueda y se puede compartir.
import { useId, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { PublishedDestinationGroup } from '@/lib/published-destinations';

type Initial = { start?: string; end?: string; guests?: number; state?: string; destinationCity?: string };

const field = 'min-h-11 w-full min-w-0 rounded-lg border border-gray-300 bg-white px-3 py-2 text-base text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100';
const label = 'mb-1 block text-xs font-semibold uppercase tracking-widest text-gray-600 dark:text-gray-300';

export default function SearchForm({ initial, destinations, today }: { initial: Initial; destinations: PublishedDestinationGroup[]; today: string }) {
  const locale = useLocale(), t = useTranslations('vendor'), id = useId();
  const [guests, setGuests] = useState(initial.guests && initial.guests > 0 ? initial.guests : 1);
  const [state, setState] = useState(initial.state ?? '');
  const [city, setCity] = useState(initial.destinationCity ?? '');
  const cities = destinations.find(group => group.state === state)?.cities ?? [];
  const step = 'flex h-11 w-11 items-center justify-center rounded-full border border-gray-300 text-xl font-semibold disabled:opacity-40 dark:border-gray-600';
  return <form action={`/${locale}/panel/vender`} method="GET" aria-label={t('search')}
    className="grid grid-cols-2 gap-3 rounded-2xl border border-gray-200 p-4 dark:border-gray-700 md:grid-cols-6 md:items-end">
    <div className="min-w-0 md:col-span-1">
      <label htmlFor={id + '-start'} className={label}>{t('start')}</label>
      <input id={id + '-start'} type="date" name="start" required min={today} defaultValue={initial.start} className={field} />
    </div>
    <div className="min-w-0 md:col-span-1">
      <label htmlFor={id + '-end'} className={label}>{t('end')}</label>
      <input id={id + '-end'} type="date" name="end" required min={today} defaultValue={initial.end} className={field} />
    </div>
    <div className="col-span-2 md:col-span-1">
      <span id={id + '-guests'} className={label}>{t('guests')}</span>
      <div role="group" aria-labelledby={id + '-guests'} className="flex items-center justify-between gap-3">
        <button type="button" className={step} aria-label={t('fewer')} disabled={guests <= 1} onClick={() => setGuests(value => Math.max(1, value - 1))}>−</button>
        <output aria-live="polite" className="min-w-8 text-center text-lg font-semibold">{guests}</output>
        <button type="button" className={step} aria-label={t('moreGuests')} disabled={guests >= 50} onClick={() => setGuests(value => Math.min(50, value + 1))}>+</button>
        <input type="hidden" name="guests" value={guests} />
      </div>
    </div>
    {destinations.length > 0 && <>
      <div className="min-w-0 md:col-span-1">
        <label htmlFor={id + '-state'} className={label}>{t('state')}</label>
        <select id={id + '-state'} name="state" value={state} onChange={event => { setState(event.target.value); setCity(''); }} className={field}>
          <option value="">{t('anyState')}</option>
          {destinations.map(group => <option key={group.state} value={group.state}>{group.state}</option>)}
        </select>
      </div>
      <div className="min-w-0 md:col-span-1">
        <label htmlFor={id + '-city'} className={label}>{t('city')}</label>
        <select id={id + '-city'} name="destinationCity" value={city} disabled={!state} onChange={event => setCity(event.target.value)} className={field}>
          <option value="">{t('anyCity')}</option>
          {cities.map(name => <option key={name} value={name}>{name}</option>)}
        </select>
      </div>
    </>}
    <button type="submit" className="col-span-2 min-h-12 rounded-lg bg-green-700 px-6 text-base font-semibold text-white hover:bg-green-600 md:col-span-1">{t('search')}</button>
  </form>;
}
