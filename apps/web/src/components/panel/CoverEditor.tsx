'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import Image from 'next/image';
import type { PanelResources } from '@/lib/panel-resources';
import { panelRequest, buttonClass } from './request';

export default function CoverEditor({ propertyId, photos }: { propertyId: string; photos: PanelResources['media'] }) {
  const t = useTranslations('coverEditor'), panel = useTranslations('panel'), router = useRouter();
  const [selected, setSelected] = useState(() => photos.filter(photo => photo.isCover).sort((a, b) => (a.coverOrder ?? 0) - (b.coverOrder ?? 0) || a.id.localeCompare(b.id)).slice(0, 5).map(photo => photo.id));
  const [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  function move(index: number, direction: number) {
    setMessage(''); setSelected(current => {
      const result = [...current], destination = index + direction;
      [result[index], result[destination]] = [result[destination], result[index]];
      return result;
    });
  }
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage('');
    try { await panelRequest(`/api/properties/${encodeURIComponent(propertyId)}/cover`, 'PUT', { mediaIds: selected }); setMessage('saved'); router.refresh(); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'error'); }
    finally { setBusy(false); }
  }
  return <section className="space-y-4 rounded-2xl border bg-white dark:bg-gray-900 p-6 shadow-sm dark:border-gray-700">
    <h2 className="text-xl font-semibold">{t('title')}</h2><p className="text-sm text-gray-600 dark:text-gray-300">{t('hint')}</p>
    <form onSubmit={save} className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{photos.map((photo, index) => <label key={photo.id} className="min-w-0 rounded-lg border p-2 dark:border-gray-700">
        <Image src={photo.url} alt={t('photo', { number: index + 1 })} width={160} height={100} unoptimized className="h-24 w-full rounded object-cover" />
        <span className="flex items-center gap-2 text-sm"><input type="checkbox" checked={selected.includes(photo.id)} disabled={busy || (selected.length >= 5 && !selected.includes(photo.id))}
          onChange={() => { setMessage(''); setSelected(current => current.includes(photo.id) ? current.filter(id => id !== photo.id) : current.length < 5 ? [...current, photo.id] : current); }} />{t('select')}</span>
      </label>)}</div>
      {!photos.length && <p>{t('empty')}</p>}
      <ol className="space-y-2">{selected.map((id, index) => {
        const photo = photos.find(item => item.id === id);
        return <li key={id} className="flex flex-wrap items-center gap-3"><span>{index + 1}</span>
          {photo && <Image src={photo.url} alt={t('photo', { number: index + 1 })} width={64} height={48} unoptimized className="h-12 w-16 rounded object-cover" />}
          <button type="button" disabled={busy || index === 0} onClick={() => move(index, -1)} className={buttonClass} aria-label={t('upPhoto', { number: index + 1 })}>{t('up')}</button>
          <button type="button" disabled={busy || index === selected.length - 1} onClick={() => move(index, 1)} className={buttonClass} aria-label={t('downPhoto', { number: index + 1 })}>{t('down')}</button>
        </li>;
      })}</ol>
      <button disabled={busy} className={buttonClass}>{panel(busy ? 'saving' : 'save')}</button>
      {message && <p role={message === 'saved' ? 'status' : 'alert'}>{panel(message)}</p>}
    </form>
  </section>;
}
