'use client';
// T-4739 (añadido): calendarios externos (iCal) de la propiedad — pegar el enlace de Airbnb, Booking, VRBO o
// Google, editarlo, quitarlo y sincronizar. La sincronización es la de T-4680 (POST /api/ical/sync).
import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { panelRequest, inputClass, buttonClass } from './request';

export type IcalFeedRow = { id: string; url: string; source: string; imported: number; lastSyncedAt?: string | null; lastAttemptAt?: string | null; lastError?: string | null };
/** Más de 36 h sin sincronizar con éxito (el cron es diario): se avisa. */
export const STALE_MS = 36 * 60 * 60 * 1000;
export function feedHealth(feed: IcalFeedRow, now = Date.now()) {
  if (feed.lastError) return 'error' as const;
  if (!feed.lastSyncedAt) return 'never' as const;
  return now - Date.parse(feed.lastSyncedAt) > STALE_MS ? 'stale' as const : 'ok' as const;
}
const sources = ['airbnb', 'booking', 'vrbo', 'google', 'other'] as const;
const secondary = 'min-h-11 rounded-lg border border-green-700 px-3 text-green-800 disabled:opacity-50 dark:border-green-400 dark:text-green-300';

/** El enlace lleva un token privado: se muestra recortado (host + final), completo solo al editar. */
export function maskIcalUrl(value: string) {
  try { const url = new URL(value); const tail = (url.pathname + url.search).slice(-6); return `${url.host}/…${tail}`; }
  catch { return '…'; }
}

const notices = ['synced', 'syncFailed', 'feedFailed'] as const;

export default function IcalFeedsEditor({ propertyId, feeds, notice }: { propertyId: string; feeds: IcalFeedRow[]; notice?: string }) {
  const t = useTranslations('icalFeeds'), errors = useTranslations('panel'), router = useRouter(), locale = useLocale();
  const stamp = (value: string) => new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Mexico_City' }).format(new Date(value));
  const [url, setUrl] = useState(''), [source, setSource] = useState<string>('airbnb');
  const [editing, setEditing] = useState<{ id: string; url: string; source: string } | null>(null);
  const [busy, setBusy] = useState(false), [status, setStatus] = useState(''), [error, setError] = useState('');
  const base = `/api/properties/${encodeURIComponent(propertyId)}/ical-feeds`;
  async function run(action: () => Promise<string>) {
    setBusy(true); setStatus(''); setError('');
    try { setStatus(await action()); router.refresh(); }
    catch (failure) { setError(failure instanceof Error ? failure.message : 'error'); }
    finally { setBusy(false); }
  }
  const sourceSelect = (value: string, onChange: (value: string) => void) => <select value={value} onChange={event => onChange(event.target.value)} className={inputClass}>
    {sources.map(option => <option key={option} value={option}>{t(`sources.${option}`)}</option>)}</select>;

  return <section className="space-y-4 rounded-lg border p-4 dark:border-gray-700">
    <div className="space-y-1"><h2 className="text-xl font-semibold">{t('title')}</h2><p className="text-sm">{t('intro')}</p>
      <p className="text-sm text-gray-600 dark:text-gray-300">{t('autoSync')}</p></div>
    {notices.includes(notice as typeof notices[number]) && <p role={notice === 'synced' ? 'status' : 'alert'} className="rounded-lg border border-green-700 p-3 text-sm">
      {t(`created.${notice as typeof notices[number]}`)}</p>}
    {!feeds.length && <p>{t('empty')}</p>}
    <ul className="space-y-3">{feeds.map(feed => <li key={feed.id} className="space-y-2 rounded-lg border p-3 dark:border-gray-700">
      {editing?.id === feed.id ? <form className="grid gap-3 sm:grid-cols-[1fr_12rem]" onSubmit={event => {
        event.preventDefault();
        run(async () => { await panelRequest(`${base}/${encodeURIComponent(feed.id)}`, 'PATCH', { url: editing.url, source: editing.source }); setEditing(null); return t('saved'); });
      }}>
        <label className="block space-y-1"><span>{t('url')}</span><input type="url" required value={editing.url} className={inputClass}
          onChange={event => setEditing({ ...editing, url: event.target.value })} /></label>
        <label className="block space-y-1"><span>{t('source')}</span>{sourceSelect(editing.source, value => setEditing({ ...editing, source: value }))}</label>
        <div className="flex flex-wrap gap-3 sm:col-span-2"><button type="submit" disabled={busy} className={buttonClass}>{t('save')}</button>
          <button type="button" className={secondary} onClick={() => setEditing(null)}>{t('cancel')}</button></div>
      </form> : <>
        <p className="break-all"><span className="font-semibold">{t(`sources.${sources.includes(feed.source as typeof sources[number]) ? feed.source : 'other'}`)}</span> · <code>{maskIcalUrl(feed.url)}</code></p>
        <p className="text-sm text-gray-600 dark:text-gray-300">{t('imported', { count: feed.imported })} · {feed.lastSyncedAt ? t('lastSynced', { when: stamp(feed.lastSyncedAt) }) : t('neverSynced')}</p>
        {feedHealth(feed) === 'error' && <p role="alert" className="text-sm text-red-800 dark:text-red-300">{t('lastFailed', { when: feed.lastAttemptAt ? stamp(feed.lastAttemptAt) : '—', error: t(`errors.${['TIMEOUT', 'NOT_A_CALENDAR'].includes(feed.lastError ?? '') ? feed.lastError : 'FETCH_FAILED'}`) })}</p>}
        {feedHealth(feed) === 'stale' && <p role="alert" className="text-sm text-amber-800 dark:text-amber-300">{t('stale')}</p>}
        <div className="flex flex-wrap gap-3">
          <button type="button" disabled={busy} className={secondary} onClick={() => setEditing({ id: feed.id, url: feed.url, source: sources.includes(feed.source as typeof sources[number]) ? feed.source : 'other' })}>{t('edit')}</button>
          <button type="button" disabled={busy} className={secondary} onClick={() => {
            if (!window.confirm(t('confirmRemove', { count: feed.imported }))) return;
            run(async () => { const result = await panelRequest(`${base}/${encodeURIComponent(feed.id)}`, 'DELETE'); return t('removed', { count: result.removedDates ?? 0 }); })
              .then(() => undefined);
          }}>{t('remove')}</button>
        </div>
      </>}
    </li>)}</ul>
    <form className="grid gap-3 sm:grid-cols-[1fr_12rem]" onSubmit={event => {
      event.preventDefault();
      run(async () => { await panelRequest(base, 'POST', { url, source }); setUrl(''); return t('added'); });
    }}>
      <label className="block space-y-1"><span>{t('url')}</span><input type="url" required placeholder="https://www.airbnb.mx/calendar/ical/….ics" value={url} className={inputClass}
        onChange={event => setUrl(event.target.value)} /></label>
      <label className="block space-y-1"><span>{t('source')}</span>{sourceSelect(source, setSource)}</label>
      <p className="text-sm text-gray-600 sm:col-span-2 dark:text-gray-300">{t('urlHelp')}</p>
      <div className="flex flex-wrap gap-3 sm:col-span-2">
        <button type="submit" disabled={busy || !url.trim()} className={buttonClass}>{t('add')}</button>
        <button type="button" disabled={busy || !feeds.length} className={secondary} onClick={() => run(async () => {
          const response = await fetch('/api/ical/sync', { method: 'POST' });
          const payload = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(response.status === 502 ? 'syncFailed' : 'error');
          return payload.failedFeeds > 0 ? t('syncedPartial', { count: payload.failedFeeds }) : t('synced', { count: payload.synced ?? 0 });
        })}>{t('syncNow')}</button>
      </div>
    </form>
    {status && <p role="status">{status}</p>}
    {error && <p role="alert">{error === 'syncFailed' ? t('syncFailed') : error === 'conflict' ? t('conflict') : errors(error)}</p>}
  </section>;
}
