'use client';
// T-4944: editor de una página informativa (/nosotros o /unete) en Panel → Contenido → Páginas. Solo ADMIN.
// Pestañas por idioma; cada campo vacío muestra en gris el texto por defecto (messages/*.json), que es lo que se
// publica mientras no se escriba otro. Las imágenes suben por /api/panel/site-content/upload y se guardan al pulsar Guardar.
import { useEffect, useId, useRef, useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { closablePages, pageContentGroups, pageContentImages, pageContentLocales, pageFields, pageTextLimit, type PageContentLocale, type PageContentPage, type PageContentValue, type PageField } from '@/lib/page-content';
import { optimizePhoto, photoMetadata, photoTypes, photoCompression, PhotoUploadError, type PhotoType } from '@/lib/photo-upload';
import { panelRequest, panelResponseError, panelErrorKey, inputClass, buttonClass } from './request';

type Props = { page: PageContentPage; initial: PageContentValue; defaults: Record<PageContentLocale, Record<string, string>> };

export default function PageContentEditor({ page, initial, defaults }: Props) {
  const t = useTranslations('panelPages'), panel = useTranslations('panel'), uploader = useTranslations('photoUpload'), site = useTranslations('siteContent'), router = useRouter();
  const id = useId();
  const [locale, setLocale] = useState<PageContentLocale>('es');
  const [images, setImages] = useState<Record<string, string>>(initial.images);
  const closable = closablePages.includes(page);
  const [closed, setClosed] = useState(initial.closed), [savedClosed, setSavedClosed] = useState(initial.closed);
  const [edited, setEdited] = useState(() => Object.fromEntries(pageContentLocales.map(language => [language, Object.keys(initial.texts[language]).length])) as Record<PageContentLocale, number>);
  const [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  const [uploading, setUploading] = useState<string | null>(null), [uploadStatus, setUploadStatus] = useState('');
  const fileRef = useRef<HTMLInputElement>(null), target = useRef(''), controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  const total = pageFields(page).length;

  function collect(form: HTMLFormElement) {
    const data = new FormData(form);
    const texts = Object.fromEntries(pageContentLocales.map(language => [language, {} as Record<string, string>])) as PageContentValue['texts'];
    for (const language of pageContentLocales) for (const field of pageFields(page)) {
      const value = data.get(`${language}:${field.key}`);
      if (typeof value === 'string' && value.trim()) texts[language][field.key] = value.trim();
    }
    return texts;
  }
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage('');
    try {
      const texts = collect(event.currentTarget);
      await panelRequest('/api/panel/page-content', 'PUT', { page, texts, images, ...(closable ? { closed } : {}) });
      setSavedClosed(closed);
      setEdited(Object.fromEntries(pageContentLocales.map(language => [language, Object.keys(texts[language]).length])) as Record<PageContentLocale, number>);
      setMessage('saved'); router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : 'error'); }
    finally { setBusy(false); }
  }
  async function upload(file: File | undefined) {
    const name = target.current;
    if (!file || !name || busy || uploading) return;
    setUploading(name); setUploadStatus('');
    const abort = new AbortController(); controller.current = abort;
    try {
      if (!photoTypes.includes(file.type as PhotoType)) throw new PhotoUploadError('INVALID_FILE_TYPE');
      setUploadStatus(uploader(file.size > photoCompression.thresholdBytes ? 'optimizing' : 'uploading'));
      const optimized = await optimizePhoto(file);
      photoMetadata(optimized.file.type, optimized.file.size);
      const data = new FormData(); data.set('file', optimized.file);
      const response = await fetch('/api/panel/site-content/upload', { method: 'POST', body: data, signal: abort.signal });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw panelResponseError(response.status, payload);
      if (typeof payload.url !== 'string' || !payload.url.startsWith('https://')) throw new Error('error');
      setImages(current => ({ ...current, [name]: payload.url }));
      setUploadStatus(site('assetUploaded'));
    } catch (error) {
      if (abort.signal.aborted) return;
      setUploadStatus(error instanceof PhotoUploadError ? uploader(error.code === 'INVALID_FILE_SIZE' ? 'sizeError' : 'typeError') : panel(panelErrorKey(error)));
    } finally { controller.current = null; setUploading(null); if (fileRef.current) fileRef.current.value = ''; }
  }
  const label = (field: PageField) => field.role === 'option' && !field.n ? t('roles.optionOther') : t(`roles.${field.role}`, { n: field.n ?? '' });

  return <form onSubmit={save} data-page-editor={page} className="space-y-6 rounded-2xl border bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
    <fieldset disabled={busy || Boolean(uploading)} className="space-y-6">
      {/* T-4944: cierre temporal de /unete; se aplica al guardar. */}
      {closable && <div className={`rounded-xl border p-4 ${closed ? 'border-amber-500 bg-amber-50 dark:border-amber-400 dark:bg-amber-950/40' : 'border-gray-200 dark:border-gray-700'}`}>
        <label className="flex min-h-11 cursor-pointer items-center gap-3 font-medium">
          <input type="checkbox" name="closed" checked={closed} onChange={event => setClosed(event.target.checked)} className="h-5 w-5 accent-green-700" />
          {t('closedLabel')}
        </label>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{t('closedHint')}</p>
        {savedClosed && <p role="status" className="mt-2 text-sm font-medium text-amber-800 dark:text-amber-300">{t('closedOn')}</p>}
      </div>}
      <div className="space-y-4">
        <h3 className="font-medium">{t('imagesTitle')}</h3>
        {pageContentImages[page].map(name => <div key={name} className="space-y-2 rounded-xl border border-dashed border-gray-300 p-4 dark:border-gray-700">
          <p className="font-medium">{t(`images.${name}`)}</p>
          <p className="text-sm text-gray-600 dark:text-gray-300">{t(`images.${name}Hint`)}</p>
          {images[name] && <Image src={images[name]} alt={t(`images.${name}`)} width={192} height={128} unoptimized className="h-32 w-48 rounded-lg object-cover" />}
          <div className="flex flex-wrap gap-2">
            <button type="button" className={buttonClass} onClick={() => { target.current = name; fileRef.current?.click(); }}>{uploader(uploading === name ? 'uploading' : 'choose')}</button>
            {images[name] && <button type="button" className={buttonClass} onClick={() => setImages(current => { const next = { ...current }; delete next[name]; return next; })}>{site('assetClear')}</button>}
          </div>
        </div>)}
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={event => { void upload(event.currentTarget.files?.[0]); }} />
        {uploadStatus && <p role="status" className="text-sm">{uploadStatus}</p>}
      </div>

      <div role="tablist" aria-label={t('languages')} className="flex flex-wrap gap-2">
        {pageContentLocales.map(language => <button key={language} type="button" role="tab" id={`${id}-${language}-tab`} aria-selected={locale === language} aria-controls={`${id}-${language}`} onClick={() => setLocale(language)}
          className={`min-h-11 rounded-full border px-4 text-sm ${locale === language ? 'border-green-700 bg-green-50 font-medium dark:border-green-400 dark:bg-green-950' : 'border-gray-300 dark:border-gray-600'}`}>
          {t(`language.${language}`)} <span className="text-xs text-gray-500 dark:text-gray-400">({edited[language]}/{total})</span>
        </button>)}
      </div>
      {/* Todos los idiomas están en el formulario (los ocultos también se envían); la pestaña solo elige cuál se ve. */}
      {pageContentLocales.map(language => <div key={language} role="tabpanel" id={`${id}-${language}`} aria-labelledby={`${id}-${language}-tab`} hidden={locale !== language} lang={language} className="space-y-5">
        <p className="text-sm text-gray-600 dark:text-gray-300">{t('customized', { count: edited[language], total })}</p>
        {pageContentGroups[page].map(group => <fieldset key={group.id} className="space-y-3 rounded-xl border border-gray-200 p-4 dark:border-gray-700">
          <legend className="px-1 font-medium">{t(`groups.${group.id}`)}</legend>
          {group.id === 'story' && <p className="text-sm text-gray-600 dark:text-gray-300">{t('storyHint')}</p>}
          {group.fields.map(field => {
            const name = `${language}:${field.key}`, fallback = defaults[language][field.key] ?? '';
            const props = { name, defaultValue: initial.texts[language][field.key] ?? '', placeholder: fallback, maxLength: pageTextLimit(field.role), className: inputClass, 'aria-description': t('defaultLabel', { text: fallback }) };
            return <label key={field.key} className="block text-sm">{label(field)}
              {pageTextLimit(field.role) > 200 ? <textarea rows={3} {...props} /> : <input {...props} />}
              {field.role === 'whatsappMessage' && <span className="mt-1 block text-xs text-gray-600 dark:text-gray-300">{t('whatsappHint', { summary: '{summary}' })}</span>}
            </label>;
          })}
        </fieldset>)}
      </div>)}
    </fieldset>
    {message && <p role={message === 'saved' ? 'status' : 'alert'}>{panel(message)}</p>}
    <button disabled={busy || Boolean(uploading)} className={buttonClass}>{panel(busy ? 'saving' : 'save')}</button>
  </form>;
}
