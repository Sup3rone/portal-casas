'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import type { SiteContentValues } from '@/lib/site-content';
import { panelRequest, inputClass, buttonClass } from './request';

export default function SiteContentEditor({ content, properties }: { content: SiteContentValues; properties: { id: string; label: string; city: string }[] }) {
  const t = useTranslations('siteContent'), panel = useTranslations('panel'), router = useRouter();
  const [busy, setBusy] = useState(false), [message, setMessage] = useState('');
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
    <fieldset disabled={busy} className="space-y-4">
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
    </fieldset>
    {message && <p role={message === 'saved' ? 'status' : 'alert'}>{panel(message)}</p>}
    <button disabled={busy} className={buttonClass}>{panel(busy ? 'saving' : 'save')}</button>
  </form>;
}
