'use client';
import { useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import type { PanelProperty, PanelResources } from '@/lib/panel-resources';
import { panelRequest, buttonClass } from './request';

const fields = ['sectionBgInicio', 'sectionBgMapa', 'sectionBgReserva'] as const;
export default function SectionBackgroundEditor({ property, media }: { property: PanelProperty; media: PanelResources['media'] }) {
  const t = useTranslations('sectionBackgrounds');
  return <section className="space-y-6 rounded-2xl border bg-white dark:bg-gray-900 p-6 shadow-sm dark:border-gray-700">
    <h2 className="text-xl font-semibold">{t('title')}</h2><p className="text-sm text-gray-600 dark:text-gray-300">{t('hint')}</p>
    {fields.map(field => <BackgroundPicker key={`${property.id}:${field}:${property[field] ?? ''}`} propertyId={property.id} field={field}
      initial={property[field]} photos={media.filter(photo => photo.type === 'PHOTO')} />)}
  </section>;
}

function BackgroundPicker({ propertyId, field, initial, photos }: {
  propertyId: string; field: typeof fields[number]; initial: string | null; photos: PanelResources['media'];
}) {
  const t = useTranslations('sectionBackgrounds'), panel = useTranslations('panel'), router = useRouter();
  const [selected, setSelected] = useState(initial ?? ''), [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage('');
    try { await panelRequest(`/api/properties/${encodeURIComponent(propertyId)}`, 'PATCH', { [field]: selected || null }); setMessage('saved'); router.refresh(); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'error'); }
    finally { setBusy(false); }
  }
  return <form onSubmit={save} className="space-y-3"><fieldset disabled={busy}>
    <legend className="mb-3 font-semibold">{t(field)}</legend>
    <label className="mb-3 flex items-center gap-2 text-sm"><input type="radio" name={field} value="" checked={!selected}
      onChange={() => { setSelected(''); setMessage(''); }} />{t('none')}</label>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{photos.map((photo, index) => <label key={photo.id} className="min-w-0 rounded-lg border p-2 dark:border-gray-700">
      <Image src={photo.url} alt={t('photo', { number: index + 1 })} width={160} height={100} unoptimized className="h-24 w-full rounded object-cover" />
      <span className="flex items-center gap-2 text-sm"><input type="radio" name={field} value={photo.url} checked={selected === photo.url}
        onChange={() => { setSelected(photo.url); setMessage(''); }} />{t('select')}</span>
    </label>)}</div>
    {!photos.length && <p className="text-sm">{t('empty')}</p>}
    {selected && !photos.some(photo => photo.url === selected) && <p className="text-sm">{t('snapshot')}</p>}
  </fieldset><button disabled={busy} className={buttonClass}>{panel(busy ? 'saving' : 'save')}</button>
    {message && <p role={message === 'saved' ? 'status' : 'alert'}>{panel(message)}</p>}
  </form>;
}
