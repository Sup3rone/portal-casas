'use client';
import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { useRouter } from '@/i18n/navigation';
import type { SiteContentValues } from '@/lib/site-content';
import { panelRequest, panelResponseError, panelErrorKey, inputClass, buttonClass } from './request';
import { optimizePhoto, photoMetadata, photoTypes, photoCompression, PhotoUploadError, type PhotoType } from '@/lib/photo-upload';

export default function SiteContentEditor({ content, properties }: { content: SiteContentValues; properties: { id: string; label: string; city: string }[] }) {
  const t = useTranslations('siteContent'), panel = useTranslations('panel'), router = useRouter();
  const [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  const uploader = useTranslations('photoUpload');
  const [imageUrl, setImageUrl] = useState(content.listing_background_image);
  const [uploading, setUploading] = useState(false), [uploadStatus, setUploadStatus] = useState('');
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null), lock = useRef(false), controllerRef = useRef<AbortController | null>(null);
  useEffect(() => () => controllerRef.current?.abort(), []);
  async function upload(files: FileList | null) {
    if (!files?.length || busy || lock.current) return;
    lock.current = true; setUploading(true); setUploadErrors([]);
    const controller = new AbortController(); controllerRef.current = controller;
    const batch = Array.from(files);
    try {
      for (const [index, file] of batch.entries()) {
        if (controller.signal.aborted) return;
        try {
          if (!photoTypes.includes(file.type as PhotoType)) throw new PhotoUploadError('INVALID_FILE_TYPE');
          setUploadStatus(uploader(file.size > photoCompression.thresholdBytes ? 'optimizing' : 'uploading') + ' · ' + uploader('queueProgress', { current: index + 1, total: batch.length, name: file.name }));
          const optimized = await optimizePhoto(file);
          if (controller.signal.aborted) return;
          photoMetadata(optimized.file.type, optimized.file.size);
          const data = new FormData(); data.set('file', optimized.file);
          const response = await fetch('/api/panel/site-content/upload', { method: 'POST', body: data, signal: controller.signal });
          const payload = await response.json().catch(() => ({}));
          if (controller.signal.aborted) return;
          if (!response.ok) throw panelResponseError(response.status, payload);
          if (typeof payload.url !== 'string' || !payload.url.startsWith('https://')) throw new Error('error');
          setImageUrl(payload.url);
          setUploadStatus(t('assetUploaded') + (optimized.optimized ? ' · ' + uploader('optimizedSize', { original: Math.round(file.size / 100_000) / 10, final: Math.round(optimized.file.size / 1000) }) : ''));
        } catch (error) {
          if (controller.signal.aborted) return;
          const message = error instanceof PhotoUploadError ? uploader(error.code === 'INVALID_FILE_SIZE' ? 'sizeError' : 'typeError') : panel(panelErrorKey(error));
          setUploadErrors(current => [...current, file.name + ': ' + message]);
        }
      }
    } finally { controllerRef.current = null; lock.current = false; setUploading(false); if (fileRef.current) fileRef.current.value = ''; }
  }
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage('');
    const form = new FormData(event.currentTarget);
    try {
      await panelRequest('/api/panel/site-content', 'PUT', Object.fromEntries(Object.keys(content).map(key => [key, form.get(key)])));
      setMessage('saved'); router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : 'error'); }
    finally { setBusy(false); }
  }
  return <form onSubmit={save} className="space-y-6 rounded-2xl border bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
    <p className="text-sm text-gray-600 dark:text-gray-300">{t('hint')}</p>
    <fieldset disabled={busy || uploading} className="space-y-4">
      {(['about_es', 'about_en', 'about_fr'] as const).map(key => <label key={key} className="block text-sm">{t(key)}
        <textarea name={key} rows={5} maxLength={2000} defaultValue={content[key]} className={inputClass} />
      </label>)}
      {(['social_instagram', 'social_facebook'] as const).map(key => <label key={key} className="block text-sm">{t(key)}
        <input name={key} type="url" pattern="https://.+" title={t('socialHint')} maxLength={2048} defaultValue={content[key]} className={inputClass} />
      </label>)}
      <p className="text-sm text-gray-600 dark:text-gray-300">{t('socialHint')}</p>
      <label className="block text-sm">{t('contactWhatsappLabel')}
        <input name="contact_whatsapp" type="tel" inputMode="numeric" pattern="[0-9]{8,15}" minLength={8} maxLength={15} title={t('contactWhatsappHint')} defaultValue={content.contact_whatsapp} className={inputClass} />
      </label>
      <p className="text-sm text-gray-600 dark:text-gray-300">{t('contactWhatsappHint')}</p>
      <label className="block text-sm">{t('featuredLabel')}
        <select name="featured_property_id" defaultValue={content.featured_property_id} className={inputClass}>
          <option value="">{t('featuredNone')}</option>
          {content.featured_property_id && !properties.some(property=>property.id===content.featured_property_id) && <option value={content.featured_property_id} disabled>{t('featuredUnavailable')}</option>}
          {properties.map(property=><option key={property.id} value={property.id}>{property.label} · {property.city}</option>)}
        </select>
      </label>
      <p className="text-sm text-gray-600 dark:text-gray-300">{t('featuredHint')}</p>
      <label className="block text-sm">{t('videoLabel')}
        <input name="home_background_video" type="url" pattern="https://.+" maxLength={2048} defaultValue={content.home_background_video} className={inputClass} />
      </label>
      <p className="text-sm text-gray-600 dark:text-gray-300">{t('videoHint')}</p>
      <label className="block text-sm">{t('listingImageLabel')}
        <input name="listing_background_image" type="url" readOnly value={imageUrl} className={inputClass} />
      </label>
      {imageUrl && <><Image src={imageUrl} alt={t('listingImageLabel')} width={192} height={128} unoptimized className="h-32 w-48 rounded-lg object-cover" />
        <button type="button" className={buttonClass} onClick={() => setImageUrl('')}>{t('assetClear')}</button></>}
    </fieldset>
    <div onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); void upload(event.dataTransfer.files); }} className="rounded-xl border border-dashed p-4 dark:border-gray-700" aria-busy={uploading}>
      <p>{t('listingImageHint')}</p><p className="text-sm">{t('imageLimits')}</p>
      <input ref={fileRef} type="file" multiple accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={busy || uploading} onChange={event => { void upload(event.currentTarget.files); }} />
      <button type="button" className={buttonClass} disabled={busy || uploading} onClick={() => fileRef.current?.click()}>{uploader(uploading ? 'uploading' : 'choose')}</button>
      {uploading && <progress className="w-full accent-green-700" aria-label={uploader('uploading')} />}
      {uploadStatus && <p role="status">{uploadStatus}</p>}
      {uploadErrors.length > 0 && <ul role="alert" className="space-y-2 break-words text-sm">{uploadErrors.map((error, index) => <li key={index}>{error}</li>)}</ul>}
    </div>
    {message && <p role={message === 'saved' ? 'status' : 'alert'}>{panel(message)}</p>}
    <button disabled={busy || uploading} className={buttonClass}>{panel(busy ? 'saving' : 'save')}</button>
  </form>;
}
