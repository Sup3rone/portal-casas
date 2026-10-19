'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import type { PanelProperty } from '@/lib/panel-resources';
import { propertySectionLabels, type SectionTitles } from '@/lib/property-presentation';
import { heroVideoMetadata } from '@/lib/hero-video-upload';
import { PhotoUploadError } from '@/lib/photo-upload';
import { panelRequest, panelResponseError, inputClass, buttonClass } from './request';
import type { ModuleName } from '@/lib/section-modules';

export default function PropertyPresentationEditor({ property, modules }: { property: PanelProperty; modules?: Record<ModuleName, boolean> }) {
  const t = useTranslations('panel'), details = useTranslations('details'), router = useRouter();
  const [url, setUrl] = useState(property.sectionTitles?.heroVideoUrl || '');
  const [busy, setBusy] = useState(false), [notice, setNotice] = useState('');
  async function upload(file?: File) {
    if (!file || busy) return;
    setBusy(true); setNotice('');
    try {
      heroVideoMetadata(file.type, file.size);
      const form = new FormData(); form.set('file', file); form.set('purpose', 'hero-video');
      const response = await fetch(`/api/properties/${encodeURIComponent(property.id)}/upload`, { method: 'POST', body: form });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw panelResponseError(response.status, result);
      if (typeof result.url !== 'string' || !result.url.startsWith('https://')) throw new Error('error');
      setUrl(result.url); setNotice('heroVideoUploaded');
    } catch (error) {
      setNotice(error instanceof PhotoUploadError ? error.code === 'INVALID_VIDEO_SIZE' ? 'invalidVideoSize' : 'invalidVideoType' : error instanceof TypeError ? 'networkError' : error instanceof Error ? error.message === 'uploadFailed' ? 'heroVideoUploadFailed' : error.message : 'error');
    } finally { setBusy(false); }
  }
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return;
    const form = new FormData(event.currentTarget), sectionTitles: SectionTitles = {};
    for (const section of Object.keys(propertySectionLabels) as (keyof SectionTitles)[]) {
      const row = { es: String(form.get(`${section}_es`) || '').trim(), en: String(form.get(`${section}_en`) || '').trim(), fr: String(form.get(`${section}_fr`) || '').trim() };
      if (!row.es && !row.en && !row.fr) continue;
      if (!row.es || !row.en || !row.fr) { setNotice('invalidSectionTitles'); return; }
      sectionTitles[section] = row;
    }
    setBusy(true); setNotice('');
    try { await panelRequest(`/api/properties/${encodeURIComponent(property.id)}`, 'PATCH', { sectionTitles: { heroVideoUrl: url.trim() || null, titles: sectionTitles } }); setNotice('saved'); router.refresh(); }
    catch (error) { setNotice(error instanceof Error ? error.message : 'error'); }
    finally { setBusy(false); }
  }
  return <form onSubmit={save} className="space-y-6 rounded-2xl border bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
    <h2 className="text-2xl font-semibold">{t('presentationTitle')}</h2>
    <fieldset disabled={busy} className="space-y-4">
      <label className="block text-sm">{t('heroVideoLabel')}<input type="url" value={url} onChange={event => setUrl(event.target.value)} maxLength={2048} pattern="https://.+" className={`${inputClass} min-h-11`} /></label>
      <label className="block text-sm">{t('heroVideoChoose')}<input type="file" accept="video/mp4,video/webm" className="block min-h-11 w-full" onChange={event => { void upload(event.target.files?.[0]); event.target.value = ''; }} /></label>
      <p className="text-sm">{t('heroVideoHint')}</p>
      {url && <video src={url} controls muted playsInline preload="metadata" className="max-h-64 w-full rounded-xl" />}
      <p className="text-sm">{t('sectionTitlesHint')}</p>
      {(Object.entries(propertySectionLabels) as [keyof SectionTitles, string][]).map(([section, label]) => <fieldset key={section} hidden={modules && section in modules ? !modules[section as ModuleName] : false} className={modules && section in modules && !modules[section as ModuleName] ? 'hidden' : 'grid gap-3 md:grid-cols-3'}>
        <legend className="font-semibold">{details(label)}</legend>
        {(['es', 'en', 'fr'] as const).map(language => <label key={language} className="text-sm">{language.toUpperCase()}<input name={`${section}_${language}`} maxLength={150} defaultValue={property.sectionTitles?.titles?.[section]?.[language] || ''} className={`${inputClass} min-h-11`} /></label>)}
      </fieldset>)}
    </fieldset>
    {busy && <progress aria-label={t('saving')} className="w-full" />}
    {notice && <p role={['saved', 'heroVideoUploaded'].includes(notice) ? 'status' : 'alert'}>{t(notice)}</p>}
    <button disabled={busy} className={buttonClass}>{t(busy ? 'saving' : 'save')}</button>
  </form>;
}
