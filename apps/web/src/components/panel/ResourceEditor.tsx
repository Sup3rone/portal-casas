'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import type { PanelResources } from '@/lib/panel-resources';
import { panelRequest, inputClass, buttonClass } from './request';

type Item = PanelResources['rates'][number] | PanelResources['media'][number];
export default function ResourceEditor({ propertyId, resource, items }: { propertyId: string; resource: 'rates' | 'media'; items: Item[] }) {
  const t = useTranslations('panel'), router = useRouter();
  const [editing, setEditing] = useState<Item | null>(null), [message, setMessage] = useState(''), [busy, setBusy] = useState(false);
  const fields = resource === 'rates' ? ['name', 'startDate', 'endDate', 'weekdayPrice', 'weekendPrice', 'priority'] : ['url', 'category', 'order'];
  function initial(field: string) {
    const value = (editing as unknown as Record<string, unknown> | null)?.[field];
    return typeof value === 'string' || typeof value === 'number' ? value : ['order', 'priority'].includes(field) ? 0 : field === 'category' ? 'principal' : '';
  }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); const element = event.currentTarget, form = new FormData(element);
    const body = Object.fromEntries(fields.map(field => [field, ['weekdayPrice', 'weekendPrice', 'priority', 'order'].includes(field) ? Number(form.get(field)) : form.get(field)]));
    setBusy(true); setMessage('');
    try {
      await panelRequest(`/api/properties/${propertyId}/${resource}${editing ? `/${editing.id}` : ''}`, editing ? 'PATCH' : 'POST', body);
      setEditing(null); element.reset(); setMessage('saved'); router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : 'error'); }
    finally { setBusy(false); }
  }
  async function remove(id: string) {
    if (!window.confirm(t('removeConfirm'))) return;
    setBusy(true); setMessage('');
    try { await panelRequest(`/api/properties/${propertyId}/${resource}/${id}`, 'DELETE'); setEditing(null); setMessage('saved'); router.refresh(); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'error'); }
    finally { setBusy(false); }
  }
  return <section className="space-y-4 rounded-2xl border bg-white p-6 shadow-sm">
    <h2 className="text-xl font-semibold">{t(resource === 'rates' ? 'rates' : 'photos')}</h2>
    {resource === 'media' && <p className="text-sm text-gray-600">{t('photoHint')}</p>}
    {!items.length && <p>{t(resource === 'rates' ? 'emptyRates' : 'emptyPhotos')}</p>}
    <ul className="space-y-3">{items.map(item => <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
      <span className="min-w-0 break-all">{'name' in item ? `${item.name} · ${item.startDate} → ${item.endDate} · ${item.weekdayPrice}/${item.weekendPrice} MXN` : item.url}</span>
      <div className="flex gap-3"><button type="button" disabled={busy} onClick={() => { setEditing(item); setMessage(''); }} className="underline">{t('edit')}</button>
        <button type="button" disabled={busy} onClick={() => remove(item.id)} className="underline">{t('remove')}</button></div>
    </li>)}</ul>
    <form key={editing?.id ?? 'new'} onSubmit={submit} className="grid gap-4 md:grid-cols-2">
      {fields.map(field => <label key={field} className="block text-sm">{t(field === 'url' ? 'photoUrl' : field)}
        {field === 'category' ? <select name={field} defaultValue={initial(field)} className={inputClass}>{['principal', 'habitaciones', 'amenidades', 'lugar'].map(value => <option key={value} value={value}>{t(value)}</option>)}</select>
          : <input name={field} required type={['startDate', 'endDate'].includes(field) ? 'date' : ['weekdayPrice', 'weekendPrice', 'priority', 'order'].includes(field) ? 'number' : 'text'}
            min={['weekdayPrice', 'weekendPrice', 'order'].includes(field) ? 0 : undefined} step={1} defaultValue={initial(field)} className={inputClass} />}
      </label>)}
      <div className="flex gap-3"><button disabled={busy} className={buttonClass}>{t(busy ? 'saving' : editing ? 'save' : resource === 'rates' ? 'addRate' : 'addPhoto')}</button>
        {editing && <button type="button" onClick={() => setEditing(null)}>{t('cancel')}</button>}</div>
    </form>
    {message && <p role="status">{t(message)}</p>}
  </section>;
}
