'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import type { PanelProperty } from '@/lib/panel-resources';
import { panelRequest, inputClass, buttonClass } from './request';

export default function PropertyForm({ property }: { property?: PanelProperty }) {
  const t = useTranslations('panel'), router = useRouter();
  const [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  const texts = ['titleEs', 'titleEn', 'titleFr', 'descEs', 'descEn', 'descFr', 'address', 'city'] as const;
  const numbers = ['maxGuests', 'bedrooms', 'bathrooms', 'lat', 'lng', 'baseWeekdayPrice', 'baseWeekendPrice'] as const;
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage('');
    const form = new FormData(event.currentTarget);
    const body: Record<string, unknown> = {};
    for (const key of texts) body[key] = form.get(key);
    for (const key of numbers) body[key] = form.get(key) === '' ? null : Number(form.get(key));
    body.rentalType = form.get('rentalType') ?? 'nocturna';
    body.contactName = form.get('contactName') || null;
    body.whatsapp = form.get('whatsapp') || null;
    try {
      const result = await panelRequest(property ? `/api/properties/${property.id}` : '/api/properties', property ? 'PATCH' : 'POST', body);
      if (!property) router.push(`/panel/propiedades/${result.id}`);
      else { setMessage('saved'); router.refresh(); }
    } catch (error) { setMessage(error instanceof Error ? error.message : 'error'); }
    finally { setBusy(false); }
  }
  return (
    <form onSubmit={submit} className="space-y-6 rounded-2xl border bg-white dark:bg-gray-900 p-6 shadow-sm dark:border-gray-700">
      <p className="text-sm text-gray-600 dark:text-gray-300">{t('approvalHint')}</p>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm">{t('fields.rentalType')}
          <select key={`rentalType:${property?.rentalType ?? 'nocturna'}`} name="rentalType" required defaultValue={property?.rentalType ?? 'nocturna'} className={inputClass}>
            <option value="nocturna">{t('rentalNocturna')}</option><option value="anual">{t('rentalAnual')}</option>
          </select>
        </label>
        <label className="block text-sm">{t('fields.contactName')}
          <input key={`contactName:${property?.contactName ?? ''}`} name="contactName" maxLength={100} defaultValue={property?.contactName ?? ''} className={inputClass} />
        </label>
        <label className="block text-sm">{t('fields.whatsapp')}
          <input key={`whatsapp:${property?.whatsapp ?? ''}`} name="whatsapp" type="tel" inputMode="numeric" pattern="[0-9]{8,15}" minLength={8} maxLength={15}
            title={t('whatsappHint')} defaultValue={property?.whatsapp ?? ''} className={inputClass}
            onInvalid={event => event.currentTarget.setCustomValidity(t('whatsappHint'))} onInput={event => event.currentTarget.setCustomValidity('')} />
          <span className="text-xs text-gray-600 dark:text-gray-300">{t('whatsappHint')}</span>
        </label>
        {texts.map(key => <label key={key} className="block text-sm">{t(`fields.${key}`)}
          {key.startsWith('desc') ? <textarea name={key} required rows={4} defaultValue={property?.[key]} className={inputClass} />
            : <input name={key} required defaultValue={property?.[key]} className={inputClass} />}
        </label>)}
        {numbers.map(key => <label key={key} className="block text-sm">{t(`fields.${key}`)}
          <input key={`${key}:${property?.[key] ?? ''}`} name={key} type="number" required={['maxGuests', 'bedrooms', 'bathrooms'].includes(key)}
            min={key === 'maxGuests' ? 1 : key === 'lat' ? -90 : key === 'lng' ? -180 : 0}
            max={key === 'lat' ? 90 : key === 'lng' ? 180 : undefined}
            step={['bathrooms', 'lat', 'lng'].includes(key) ? 'any' : 1}
            defaultValue={property?.[key] ?? (key === 'maxGuests' ? 1 : ['bedrooms', 'bathrooms'].includes(key) ? 0 : '')} className={inputClass} />
        </label>)}
      </div>
      {message && <p role="status">{t(message)}</p>}
      <button disabled={busy} className={buttonClass}>{t(busy ? 'saving' : 'save')}</button>
    </form>
  );
}
