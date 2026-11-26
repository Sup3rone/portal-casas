'use client';
// T-5324: selector del tema por temporada (Panel → Contenido). Guarda al pulsar «Aplicar tema».
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { panelRequest, PanelRequestError, buttonClass } from './request';

const seasons = ['normal', 'navidad', 'san-valentin'] as const;
// Muestras fijas (no dependen del tema activo) para que se vea qué se va a aplicar.
const swatches: Record<typeof seasons[number], string[]> = {
  normal: ['#F4F1EC', '#b5af94', '#654838'],
  navidad: ['#F6F1EA', '#c9d9c2', '#8e1f2a'],
  'san-valentin': ['#F8F0F0', '#ecc3cd', '#8a2846'],
};

export default function SeasonPicker({ initial }: { initial: string }) {
  const t = useTranslations('siteSeason'), panel = useTranslations('panel'), router = useRouter();
  const [season, setSeason] = useState(seasons.includes(initial as typeof seasons[number]) ? initial : 'normal');
  const [saved, setSaved] = useState(initial), [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  async function apply() {
    setBusy(true); setMessage('');
    try {
      await panelRequest('/api/panel/site-season', 'PUT', { season });
      setSaved(season); setMessage(t('applied'));
      router.refresh();
    } catch (error) {
      setMessage(error instanceof PanelRequestError && error.code === 'SITE_SEASON_NOT_READY' ? t('notReady') : panel(error instanceof Error ? error.message : 'error'));
    } finally { setBusy(false); }
  }
  return <fieldset data-season-picker="" className="space-y-4 px-6 py-5">
    <legend className="sr-only">{t('title')}</legend>
    <p className="text-sm text-gray-600 dark:text-gray-300">{t('intro')}</p>
    <div className="grid gap-3 sm:grid-cols-3">
      {seasons.map(value => <label key={value} className="flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border border-gray-200 p-3 has-[:checked]:border-green-700 has-[:checked]:ring-2 has-[:checked]:ring-green-700 dark:border-gray-700">
        <input type="radio" name="site_season" value={value} checked={season === value} onChange={() => setSeason(value)} className="accent-green-700" />
        <span className="flex gap-1" aria-hidden="true">{swatches[value].map(color => <span key={color} className="h-5 w-5 rounded-full border border-black/10" style={{ backgroundColor: color }} />)}</span>
        <span className="font-medium">{t(`seasons.${value}`)}{saved === value && <span className="block text-xs font-normal text-gray-600 dark:text-gray-300">{t('current')}</span>}</span>
      </label>)}
    </div>
    <div className="flex flex-wrap items-center gap-4">
      <button type="button" disabled={busy || season === saved} className={buttonClass} onClick={apply}>{t('apply')}</button>
      {message && <p role="status" className="text-sm">{message}</p>}
    </div>
  </fieldset>;
}
