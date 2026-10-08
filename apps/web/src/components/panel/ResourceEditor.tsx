'use client';
import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import type { PanelResources } from '@/lib/panel-resources';
import { panelRequest, inputClass, buttonClass } from './request';
import { photoMetadata, PhotoUploadError } from '@/lib/photo-upload';
import CoverEditor from './CoverEditor';

type Item = PanelResources['rates'][number] | PanelResources['media'][number];
export default function ResourceEditor({ propertyId, resource, items }: { propertyId: string; resource: 'rates' | 'media'; items: Item[] }) {
  const t = useTranslations('panel'), router = useRouter();
  const [editing, setEditing] = useState<Item | null>(null), [message, setMessage] = useState(''), [busy, setBusy] = useState(false);
  const uploader = useTranslations('photoUpload');
  const formRef = useRef<HTMLFormElement>(null), fileRef = useRef<HTMLInputElement>(null), uploadLock = useRef(false);
  const [uploading, setUploading] = useState(false), [uploadMessage, setUploadMessage] = useState('');
  const [uploadedUrl, setUploadedUrl] = useState('');
  const uploadRequest = useRef<AbortController | null>(null);
  useEffect(() => () => { uploadRequest.current?.abort(); }, [propertyId, resource]);
  async function uploadPhoto(files: FileList | null) {
    if (!files?.length || uploadLock.current || busy || editing) return;
    if (files.length !== 1) { setUploadMessage('oneFile'); return; }
    const file = files[0];
    try { photoMetadata(file.type, file.size); }
    catch (error) { setUploadMessage(error instanceof PhotoUploadError && error.code === 'INVALID_FILE_SIZE' ? 'sizeError' : 'typeError'); return; }
    const form = new FormData(formRef.current!);
    const category = String(form.get('category') || 'principal'), order = Number(form.get('order'));
    if (!Number.isSafeInteger(order) || order < 0 || order > 2147483647) { setUploadMessage('orderError'); return; }
    uploadLock.current = true; setUploading(true); setUploadMessage(''); setUploadedUrl('');
    const controller = new AbortController(); uploadRequest.current = controller;
    try {
      const data = new FormData(); data.set('file', file);
      const response = await fetch(`/api/properties/${encodeURIComponent(propertyId)}/upload`, { method: 'POST', body: data, signal: controller.signal });
      const blob = await response.json().catch(() => ({}));
      if (controller.signal.aborted) return;
      if (!response.ok || typeof blob.url !== 'string') throw new Error(response.status === 401 || response.status === 403 || response.status === 404 ? 'forbidden' : 'error');
      setUploadedUrl(blob.url);
      const urlField = formRef.current?.elements.namedItem('url');
      if (urlField instanceof HTMLInputElement) urlField.value = blob.url;
      await panelRequest(`/api/properties/${encodeURIComponent(propertyId)}/media`, 'POST', { url: blob.url, category, order });
      if (urlField instanceof HTMLInputElement) urlField.value = '';
      setUploadMessage('success'); router.refresh();
    } catch (error) { if (!controller.signal.aborted) setUploadMessage(error instanceof Error && ['forbidden', 'notFound'].includes(error.message) ? 'accessError' : 'uploadError'); }
    finally { uploadRequest.current = null; uploadLock.current = false; setUploading(false); if (fileRef.current) fileRef.current.value = ''; }
  }
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
  const photos = items.filter((item): item is PanelResources['media'][number] => 'url' in item && item.type === 'PHOTO');
  return <><section className="space-y-4 rounded-2xl border bg-white dark:bg-gray-900 p-6 shadow-sm dark:border-gray-700">
    <h2 className="text-xl font-semibold">{t(resource === 'rates' ? 'rates' : 'photos')}</h2>
    {resource === 'media' && <p className="text-sm text-gray-600 dark:text-gray-300">{t('photoHint')}</p>}
    {!items.length && <p>{t(resource === 'rates' ? 'emptyRates' : 'emptyPhotos')}</p>}
    <ul className="space-y-3">{items.map(item => <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 dark:border-gray-700">
      <span className="min-w-0 break-all">{'name' in item ? `${item.name} · ${item.startDate} → ${item.endDate} · ${item.weekdayPrice}/${item.weekendPrice} MXN` : item.url}</span>
      <div className="flex gap-3"><button type="button" disabled={busy || uploading} onClick={() => { setEditing(item); setMessage(''); }} className="underline">{t('edit')}</button>
        <button type="button" disabled={busy || uploading} onClick={() => remove(item.id)} className="underline">{t('remove')}</button></div>
    </li>)}</ul>
    <form ref={formRef} key={editing?.id ?? 'new'} onSubmit={submit} className="grid gap-4 md:grid-cols-2">
      {fields.map(field => <label key={field} className="block text-sm">{t(field === 'url' ? 'photoUrl' : field)}
        {field === 'category' ? <select name={field} disabled={busy || uploading} defaultValue={initial(field)} className={inputClass}>{['principal', 'habitaciones', 'amenidades', 'lugar'].map(value => <option key={value} value={value}>{t(value)}</option>)}</select>
          : <input name={field} required type={['startDate', 'endDate'].includes(field) ? 'date' : ['weekdayPrice', 'weekendPrice', 'priority', 'order'].includes(field) ? 'number' : 'text'}
            disabled={busy || uploading} min={['weekdayPrice', 'weekendPrice', 'order'].includes(field) ? 0 : undefined} step={1} defaultValue={initial(field)} className={inputClass} />}
      </label>)}
      <div className="flex gap-3"><button disabled={busy || uploading} className={buttonClass}>{t(busy ? 'saving' : editing ? 'save' : resource === 'rates' ? 'addRate' : 'addPhoto')}</button>
        {editing && <button type="button" disabled={busy || uploading} onClick={() => setEditing(null)}>{t('cancel')}</button>}</div>
    </form>
    {resource === 'media' && !editing && <div className="space-y-3 rounded-xl border-2 border-dashed border-gray-300 p-4 dark:border-gray-600"
      onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); void uploadPhoto(event.dataTransfer.files); }} aria-busy={uploading}>
      <p className="font-medium">{uploader('drop')}</p><p className="text-sm text-gray-600 dark:text-gray-300">{uploader('hint')}</p>
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" tabIndex={-1} disabled={busy || uploading}
        onChange={event => { void uploadPhoto(event.currentTarget.files); }} aria-label={uploader('choose')} />
      <button type="button" disabled={busy || uploading} onClick={() => fileRef.current?.click()} className={buttonClass}>{uploader(uploading ? 'uploading' : 'choose')}</button>
      {uploading && <div role="status"><label htmlFor={`upload-${propertyId}`}>{uploader('uploading')}</label><progress id={`upload-${propertyId}`} className="w-full accent-green-700" /></div>}
      {uploadMessage && <p role={uploadMessage === 'success' ? 'status' : 'alert'}>{uploader(uploadMessage)}</p>}
      {uploadedUrl && <p className="break-all text-sm">{uploader('uploadedUrl')} <a href={uploadedUrl} target="_blank" rel="noreferrer" className="underline">{uploadedUrl}</a></p>}
    </div>}
    {message && <p role="status">{t(message)}</p>}
  </section>
    {resource === 'media' && <CoverEditor key={`${propertyId}:${JSON.stringify(photos.map(photo => [photo.id, photo.isCover, photo.coverOrder]))}`} propertyId={propertyId} photos={photos} />}
  </>;
}
