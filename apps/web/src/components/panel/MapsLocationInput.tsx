'use client';
import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { parseMapsUrl } from '@/lib/panel-maps-url';
import { inputClass } from './request';

export default function MapsLocationInput({ lat: initialLat, lng: initialLng }: { lat?: number | null; lng?: number | null }) {
  const t = useTranslations('panelLocation');
  const [lat, setLat] = useState(initialLat == null ? '' : String(initialLat));
  const [lng, setLng] = useState(initialLng == null ? '' : String(initialLng));
  const [link, setLink] = useState(initialLat != null && initialLng != null ? `https://www.google.com/maps?q=${initialLat},${initialLng}` : '');
  const [error, setError] = useState(''); const urlInput = useRef<HTMLInputElement>(null);
  function parse(value: string) {
    setLink(value);
    if (!value.trim()) { setLat(''); setLng(''); setError(''); urlInput.current?.setCustomValidity(''); return; }
    const result = parseMapsUrl(value);
    setError(result.error || ''); urlInput.current?.setCustomValidity(result.error ? t(result.error) : '');
    if (result.location) { setLat(String(result.location.lat)); setLng(String(result.location.lng)); }
  }
  function manual(name: 'lat' | 'lng', value: string) {
    const nextLat = name === 'lat' ? value : lat, nextLng = name === 'lng' ? value : lng;
    setLat(nextLat); setLng(nextLng); setError(''); urlInput.current?.setCustomValidity('');
    setLink(nextLat && nextLng ? `https://www.google.com/maps?q=${nextLat},${nextLng}` : '');
  }
  const valid = lat !== '' && lng !== '' && Number.isFinite(Number(lat)) && Number.isFinite(Number(lng)) && Math.abs(Number(lat)) <= 90 && Math.abs(Number(lng)) <= 180;
  return <div className="space-y-3 md:col-span-2">
    <label className="block text-sm">{t('label')}
      <input ref={urlInput} type="text" value={link} onChange={event => parse(event.target.value)} onBlur={event => parse(event.target.value)} aria-invalid={Boolean(error)} aria-describedby={error ? 'maps-link-error' : 'maps-link-hint'} className={inputClass} />
    </label>
    <p id="maps-link-hint" className="text-xs text-gray-600 dark:text-gray-300">{t('hint')}</p>
    {error ? <p id="maps-link-error" role="alert" className="text-sm text-red-700 dark:text-red-300">{t(error)}</p> : valid && <p role="status" className="text-sm text-green-800 dark:text-green-300">{t('detected', { lat, lng })}</p>}
    {valid && <a href={`https://www.google.com/maps?q=${lat},${lng}`} target="_blank" rel="noopener noreferrer" className="inline-block text-sm text-green-800 underline dark:text-green-300">{t('view')}</a>}
    <details><summary className="cursor-pointer text-sm">{t('advanced')}</summary>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <label>{t('lat')}<input name="lat" type="number" value={lat} min={-90} max={90} step="any" onChange={event => manual('lat', event.target.value)} className={inputClass} /></label>
        <label>{t('lng')}<input name="lng" type="number" value={lng} min={-180} max={180} step="any" onChange={event => manual('lng', event.target.value)} className={inputClass} /></label>
      </div>
    </details>
  </div>;
}
