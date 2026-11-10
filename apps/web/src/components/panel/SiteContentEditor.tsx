'use client';
import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import TranslationDraftButton from './TranslationDraftButton';
import { useRouter } from '@/i18n/navigation';
import { parseFeaturedSelection, serializeFeaturedSelection } from '@/lib/featured-selection';
import type { SiteContentValues } from '@/lib/site-content';
import { panelRequest, panelResponseError, panelErrorKey, inputClass, buttonClass } from './request';
import { optimizePhoto, photoMetadata, photoTypes, photoCompression, PhotoUploadError, type PhotoType } from '@/lib/photo-upload';
import { heroVideoMetadata } from '@/lib/hero-video-upload';
import { parseHomeVideos, serializeHomeVideos, homeVideoDevices, maxHomeVideos, type HomeVideo, type HomeVideoDevice } from '@/lib/home-videos';

export default function SiteContentEditor({ content, properties }: { content: SiteContentValues; properties: { id: string; label: string; city: string }[] }) {
  const t = useTranslations('siteContent'), panel = useTranslations('panel'), router = useRouter();
  const [featuredIds, setFeaturedIds] = useState(() => parseFeaturedSelection(content.featured_property_id) ?? []);
  const [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  const uploader = useTranslations('photoUpload');
  const [imageUrl, setImageUrl] = useState(content.listing_background_image);
  const [aboutImageUrl, setAboutImageUrl] = useState(content.about_image);
  // Lista nueva (T-4679). home_background_video se conserva intacta como video anterior.
  const [videos, setVideos] = useState<HomeVideo[]>(() => parseHomeVideos(content.home_background_videos ?? '') ?? []);
  const [videoUrlDraft, setVideoUrlDraft] = useState('');
  const previousVideo = content.home_background_video;
  const uploadTarget = useRef<'listing_background_image' | 'about_image'>('listing_background_image');
  const [uploading, setUploading] = useState(false), [uploadStatus, setUploadStatus] = useState('');
  const [videoUploading, setVideoUploading] = useState(false), [videoStatus, setVideoStatus] = useState('');
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null), videoFileRef = useRef<HTMLInputElement>(null), lock = useRef(false), controllerRef = useRef<AbortController | null>(null);
  useEffect(() => () => controllerRef.current?.abort(), []);
  async function upload(files: FileList | null, target: 'listing_background_image' | 'about_image' = 'listing_background_image') {
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
          if (target === 'about_image') setAboutImageUrl(payload.url);
          else setImageUrl(payload.url);
          setUploadStatus(t('assetUploaded') + (optimized.optimized ? ' · ' + uploader('optimizedSize', { original: Math.round(file.size / 100_000) / 10, final: Math.round(optimized.file.size / 1000) }) : ''));
        } catch (error) {
          if (controller.signal.aborted) return;
          const message = error instanceof PhotoUploadError ? uploader(error.code === 'INVALID_FILE_SIZE' ? 'sizeError' : 'typeError') : panel(panelErrorKey(error));
          setUploadErrors(current => [...current, file.name + ': ' + message]);
        }
      }
    } finally { controllerRef.current = null; lock.current = false; setUploading(false); if (fileRef.current) fileRef.current.value = ''; }
  }
  async function uploadVideo(file?: File) {
    if (!file || busy || uploading || videoUploading) return;
    if (videos.length >= maxHomeVideos) { setVideoStatus('videoListFull'); return; }
    setVideoUploading(true); setVideoStatus('');
    try {
      heroVideoMetadata(file.type, file.size);
      const data = new FormData(); data.set('file', file); data.set('purpose', 'home-background-video');
      const response = await fetch('/api/panel/site-content/upload', { method: 'POST', body: data });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw panelResponseError(response.status, payload);
      if (typeof payload.url !== 'string' || !payload.url.startsWith('https://')) throw new Error('error');
      const uploadedUrl: string = payload.url;
      setVideos(current => current.length >= maxHomeVideos ? current : [...current, { url: uploadedUrl, device: 'all' }]); setVideoStatus('videoUploaded');
    } catch (error) {
      setVideoStatus(error instanceof PhotoUploadError ? error.code === 'INVALID_VIDEO_SIZE' ? 'invalidVideoSize' : 'invalidVideoType' : panelErrorKey(error));
    } finally {
      setVideoUploading(false); if (videoFileRef.current) videoFileRef.current.value = '';
    }
  }
  function addVideo(url: string) {
    const value = url.trim();
    if (videos.length >= maxHomeVideos) { setVideoStatus('videoListFull'); return; }
    if (parseHomeVideos(JSON.stringify([{ url: value, device: 'all' }])) === null) { setVideoStatus('videoInvalidUrl'); return; }
    setVideos(current => [...current, { url: value, device: 'all' }]); setVideoUrlDraft(''); setVideoStatus('');
  }
  function moveVideo(index: number, offset: -1 | 1) {
    setVideos(current => { const next = [...current]; const [item] = next.splice(index, 1); next.splice(index + offset, 0, item); return next; });
  }
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage('');
    const form = new FormData(event.currentTarget);
    try {
      await panelRequest('/api/panel/site-content', 'PUT', { ...Object.fromEntries(Object.keys(content).map(key => [key, form.get(key)])), home_background_videos: serializeHomeVideos(videos), featured_property_id: serializeFeaturedSelection(featuredIds) });
      setMessage('saved'); router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : 'error'); }
    finally { setBusy(false); }
  }
  return <form onSubmit={save} className="space-y-6 rounded-2xl border bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
    <p className="text-sm text-gray-600 dark:text-gray-300">{t('hint')}</p>
    <fieldset disabled={busy || uploading || videoUploading} className="space-y-4">
      {(['about_title_es', 'about_title_en', 'about_title_fr'] as const).map(key => <label key={key} className="block text-sm">{t(key)}<input name={key} maxLength={200} defaultValue={content[key]} className={inputClass} /></label>)}
      <TranslationDraftButton source="es" prefix="title" fieldNames={{ es: 'about_title_es', en: 'about_title_en', fr: 'about_title_fr' }} disabled={busy || uploading} useCentralErrors />
      <label className="block text-sm">{t('aboutImageLabel')}<input name="about_image" type="url" value={aboutImageUrl} readOnly className={inputClass} /></label>
      {aboutImageUrl && <><Image src={aboutImageUrl} alt={t('aboutImageLabel')} width={160} height={240} unoptimized className="aspect-[2/3] w-40 rounded-lg object-cover" /><button type="button" className={buttonClass} onClick={() => setAboutImageUrl('')}>{t('assetClear')}</button></>}
      <div onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); void upload(event.dataTransfer.files, 'about_image'); }} className="rounded-xl border border-dashed p-4">
        <p>{t('aboutImageHint')}</p><p className="text-sm">{t('imageLimits')}</p>
        <button type="button" className={buttonClass} disabled={busy || uploading} onClick={() => { uploadTarget.current = 'about_image'; fileRef.current?.click(); }}>{uploader(uploading ? 'uploading' : 'choose')}</button>
      </div>
      {(['about_es', 'about_en', 'about_fr'] as const).map(key => <label key={key} className="block text-sm">{t(key)}
        <textarea name={key} rows={5} maxLength={2000} defaultValue={content[key]} className={inputClass} />
      </label>)}
      <TranslationDraftButton source="es" prefix="desc" fieldNames={{ es: 'about_es', en: 'about_en', fr: 'about_fr' }} disabled={busy || uploading} useCentralErrors />
      {(['social_instagram', 'social_facebook'] as const).map(key => <label key={key} className="block text-sm">{t(key)}
        <input name={key} type="url" pattern="https://.+" title={t('socialHint')} maxLength={2048} defaultValue={content[key]} className={inputClass} />
      </label>)}
      <p className="text-sm text-gray-600 dark:text-gray-300">{t('socialHint')}</p>
      <label className="block text-sm">{t('contactWhatsappLabel')}
        <input name="contact_whatsapp" type="tel" inputMode="numeric" pattern="[0-9]{8,15}" minLength={8} maxLength={15} title={t('contactWhatsappHint')} defaultValue={content.contact_whatsapp} className={inputClass} />
      </label>
      <p className="text-sm text-gray-600 dark:text-gray-300">{t('contactWhatsappHint')}</p>
      {Array.from({ length: 4 }, (_, index) => (<label key={index} className="block text-sm">{t('featuredLabel')} {index + 1}
        <select name="featured_property_id" value={featuredIds[index] || ''} onChange={event => setFeaturedIds(current => Array.from({ length: 4 }, (_, slot) => slot === index ? event.target.value : current[slot] || ''))} className={inputClass}>
          <option value="">{t('featuredNone')}</option>
          {featuredIds[index] && !properties.some(property=>property.id===featuredIds[index]) && <option value={featuredIds[index]} disabled>{t('featuredUnavailable')}</option>}
          {properties.map(property=><option key={property.id} value={property.id} disabled={featuredIds.some((id, slot) => slot !== index && id === property.id)}>{property.label} · {property.city}</option>)}
        </select>
      </label>
      ))}
      <p className="text-sm text-gray-600 dark:text-gray-300">{t('featuredHint')}</p>
      <input name="home_background_video" type="hidden" value={previousVideo} readOnly />
      <input name="home_background_videos" type="hidden" value={serializeHomeVideos(videos)} readOnly />
      <div onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); void uploadVideo(event.dataTransfer.files?.[0]); }} className="rounded-xl border border-dashed p-4 dark:border-gray-700" aria-busy={videoUploading}>
        <p className="font-medium">{t('videoLabel')}</p>
        <p className="text-sm text-gray-600 dark:text-gray-300">{t('videoDrop')}</p>
        <p className="text-sm text-gray-600 dark:text-gray-300">{t('videoHint')}</p>
        <input ref={videoFileRef} type="file" accept="video/mp4,video/webm" className="sr-only" disabled={busy || uploading || videoUploading} onChange={event => { void uploadVideo(event.currentTarget.files?.[0]); }} />
        <button type="button" className={`${buttonClass} mt-3`} disabled={busy || uploading || videoUploading} onClick={() => videoFileRef.current?.click()}>{t(videoUploading ? 'videoUploading' : 'videoChoose')}</button>
        {videoUploading && <progress className="mt-3 w-full accent-green-700" aria-label={t('videoUploading')} />}
        {videoStatus && <p role={videoStatus === 'videoUploaded' ? 'status' : 'alert'} className="mt-3">{['videoUploaded', 'videoListFull', 'videoInvalidUrl'].includes(videoStatus) ? t(videoStatus) : panel(videoStatus)}</p>}
      </div>
      <div className="space-y-3">
        <p className="font-medium">{t('videoListTitle')}</p>
        {!videos.length && <p className="text-sm text-gray-600 dark:text-gray-300">{t('videoListEmpty')}</p>}
        <ol className="space-y-3">
          {videos.map((video, index) => <li key={video.url + index} className="space-y-2 rounded-xl border p-3 dark:border-gray-700">
            <video src={video.url} controls muted playsInline preload="metadata" className="max-h-48 w-full rounded-lg" />
            <p className="break-all text-xs text-gray-600 dark:text-gray-300">{index + 1}. {video.url}</p>
            <label className="block text-sm">{t('videoDevice')}
              <select value={video.device} className={inputClass} onChange={event => { const device = event.target.value as HomeVideoDevice; setVideos(current => current.map((item, slot) => slot === index ? { ...item, device } : item)); }}>
                {homeVideoDevices.map(device => <option key={device} value={device}>{t(device === 'all' ? 'videoDeviceAll' : device === 'mobile' ? 'videoDeviceMobile' : 'videoDeviceDesktop')}</option>)}
              </select>
            </label>
            <div className="flex flex-wrap gap-2">
              <button type="button" className={buttonClass} disabled={index === 0} onClick={() => moveVideo(index, -1)}>{t('videoUp')}</button>
              <button type="button" className={buttonClass} disabled={index === videos.length - 1} onClick={() => moveVideo(index, 1)}>{t('videoDown')}</button>
              <button type="button" className={buttonClass} onClick={() => setVideos(current => current.filter((_, slot) => slot !== index))}>{t('videoRemove')}</button>
            </div>
          </li>)}
        </ol>
        <label className="block text-sm">{t('videoUrlLabel')}
          <input type="url" value={videoUrlDraft} onChange={event => setVideoUrlDraft(event.target.value)} maxLength={2048} placeholder="https://" className={inputClass} />
        </label>
        <button type="button" className={buttonClass} disabled={!videoUrlDraft.trim() || videos.length >= maxHomeVideos} onClick={() => addVideo(videoUrlDraft)}>{t('videoAddUrl')}</button>
        {previousVideo && <div className="space-y-2 text-sm">
          <p className="text-gray-600 dark:text-gray-300">{t('videoPrevious')} <span className="break-all">{previousVideo}</span></p>
          <button type="button" className={buttonClass} disabled={videos.length >= maxHomeVideos || videos.some(video => video.url === previousVideo)} onClick={() => addVideo(previousVideo)}>{t('videoAddPrevious')}</button>
        </div>}
      </div>
      <label className="block text-sm">{t('listingImageLabel')}
        <input name="listing_background_image" type="url" readOnly value={imageUrl} className={inputClass} />
      </label>
      {imageUrl && <><Image src={imageUrl} alt={t('listingImageLabel')} width={192} height={128} unoptimized className="h-32 w-48 rounded-lg object-cover" />
        <button type="button" className={buttonClass} onClick={() => setImageUrl('')}>{t('assetClear')}</button></>}
    </fieldset>
    <div onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); void upload(event.dataTransfer.files); }} className="rounded-xl border border-dashed p-4 dark:border-gray-700" aria-busy={uploading}>
      <p>{t('listingImageHint')}</p><p className="text-sm">{t('imageLimits')}</p>
      <input ref={fileRef} type="file" multiple accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={busy || uploading} onChange={event => { void upload(event.currentTarget.files, uploadTarget.current); }} />
      <button type="button" className={buttonClass} disabled={busy || uploading} onClick={() => { uploadTarget.current = 'listing_background_image'; fileRef.current?.click(); }}>{uploader(uploading ? 'uploading' : 'choose')}</button>
      {uploading && <progress className="w-full accent-green-700" aria-label={uploader('uploading')} />}
      {uploadStatus && <p role="status">{uploadStatus}</p>}
      {uploadErrors.length > 0 && <ul role="alert" className="space-y-2 break-words text-sm">{uploadErrors.map((error, index) => <li key={index}>{error}</li>)}</ul>}
    </div>
    {message && <p role={message === 'saved' ? 'status' : 'alert'}>{panel(message)}</p>}
    <button disabled={busy || uploading} className={buttonClass}>{panel(busy ? 'saving' : 'save')}</button>
  </form>;
}
