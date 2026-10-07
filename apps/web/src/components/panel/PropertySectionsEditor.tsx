'use client';
import { useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import type { EditorialSection, SectionName } from '@/lib/property-sections';
import { panelRequest, buttonClass, inputClass } from './request';

type Photo = { id: string; url: string; order: number; type: string };
const names = ['destino', 'amenidades', 'habitaciones', 'lugar', 'advertencias'] as const;
const titles = { destino: 'destino', amenidades: 'amenidades', habitaciones: 'habitaciones', lugar: 'enLugar', advertencias: 'advertencias' } as const;

function SectionForm({ propertyId, name, value, photos }: { propertyId: string; name: SectionName; value?: EditorialSection; photos: Photo[] }) {
  const t = useTranslations('panelSections'), details = useTranslations('details'), panel = useTranslations('panel'), router = useRouter();
  const [hero, setHero] = useState(value?.heroMediaId || ''), [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  const selected = photos.find(photo => photo.id === hero);
  const [photoIds, setPhotoIds] = useState<string[]>(value?.photoMediaIds || []);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    setBusy(true); setMessage('');
    try {
      const body = { descriptionEs: String(form.get('descriptionEs') || '').trim() || null,
        descriptionEn: String(form.get('descriptionEn') || '').trim() || null,
        descriptionFr: String(form.get('descriptionFr') || '').trim() || null, heroMediaId: hero || null, photoMediaIds: photoIds.length ? photoIds : null };
      await panelRequest(`/api/properties/${encodeURIComponent(propertyId)}/sections/${name}`, 'PUT', body);
      setMessage('saved'); router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : 'error'); }
    finally { setBusy(false); }
  }
  return <form onSubmit={submit} className="space-y-4 rounded-2xl border bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
    <h3 className="text-xl font-semibold">{details(titles[name])}</h3>
    <div className="grid gap-4 md:grid-cols-3">{(['descriptionEs', 'descriptionEn', 'descriptionFr'] as const).map(field =>
      <label key={field} className="block text-sm">{t(field)}<textarea name={field} maxLength={10000} rows={5} defaultValue={value?.[field] || ''} disabled={busy} className={inputClass} /></label>)}</div>
    <label className="block text-sm">{t('hero')}<select value={hero} onChange={event => setHero(event.target.value)} disabled={busy} className={inputClass}>
      <option value="">{t('noImage')}</option>
      {hero && !selected && <option value={hero}>{t('unavailable')}</option>}
      {photos.map(photo => <option key={photo.id} value={photo.id}>{t('photoOrder', { order: photo.order })} · {photo.id}</option>)}
    </select></label>
    {selected && <Image src={selected.url} alt={t('preview')} width={200} height={140} unoptimized className="h-36 w-52 max-w-full rounded-lg object-cover" />}
    <div className="flex flex-wrap gap-3">{photos.map(photo => <button key={photo.id} type="button" disabled={busy}
      aria-pressed={hero === photo.id} onClick={() => setHero(photo.id)} className="rounded-lg border p-2 dark:border-gray-700">
      <Image src={photo.url} alt={t('photoOrder', { order: photo.order })} width={80} height={56} unoptimized className="h-14 w-20 rounded object-cover" />
      <span className="text-sm">{t('photoOrder', { order: photo.order })}</span>
    </button>)}</div>
    {!photos.length && <p className="text-sm text-gray-600 dark:text-gray-300">{t('noPhotos')}</p>}
    <fieldset disabled={busy} className="space-y-3">
      <legend>{t('sectionPhotos')}</legend><p className="text-sm">{t('sectionPhotosHint')}</p>
      <button type="button" onClick={() => setPhotoIds([])} className={buttonClass}>{t('clearPhotos')}</button>
      <div className="flex flex-wrap gap-3">{photos.map(photo => <label key={photo.id} className="rounded-lg border p-2 dark:border-gray-700">
        <input type="checkbox" checked={photoIds.includes(photo.id)} disabled={!photoIds.includes(photo.id) && photoIds.length >= 2}
          onChange={event => setPhotoIds(ids => event.target.checked ? [...ids, photo.id] : ids.filter(id => id !== photo.id))} />
        <Image src={photo.url} alt={t('photoOrder', { order: photo.order })} width={80} height={56} unoptimized className="h-14 w-20 rounded object-cover" />
        <span className="text-sm">{t('photoOrder', { order: photo.order })}{photoIds.includes(photo.id) ? ` · ${photoIds.indexOf(photo.id) + 1}` : ''}</span>
      </label>)}</div>
    </fieldset>
    <button type="submit" disabled={busy} className={buttonClass}>{panel(busy ? 'saving' : 'save')}</button>
    {message && <p role={message === 'saved' ? 'status' : 'alert'}>{panel(message)}</p>}
  </form>;
}

export default function PropertySectionsEditor({ propertyId, sections, media }: { propertyId: string; sections: EditorialSection[]; media: Photo[] }) {
  const t = useTranslations('panelSections');
  const photos = media.filter(photo => photo.type === 'PHOTO');
  return <section className="space-y-4"><h2 className="text-2xl font-semibold">{t('title')}</h2><p>{t('clearHint')}</p>
    {names.map(name => <SectionForm key={name} name={name} propertyId={propertyId} value={sections.find(section => section.section === name)} photos={photos} />)}
  </section>;
}
