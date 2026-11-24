'use client';
// T-5209: «Apartar estas fechas» desde la cotización. Crea la consulta y bloquea el calendario en una operación
// (/api/panel/vender/apartar). Si otro vendedor ganó la carrera, lo dice sin dejar nada a medias.
import { useId, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { panelErrorKey, panelRequest } from '@/components/panel/request';

const field = 'min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-base text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100';

export default function HoldForm({ propertyId, start, end, guests }: { propertyId: string; start: string; end: string; guests: number }) {
  const t = useTranslations('vendor'), router = useRouter(), id = useId();
  const [status, setStatus] = useState<'idle' | 'busy' | 'held' | 'taken' | 'error'>('idle');
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setStatus('busy');
    try {
      await panelRequest('/api/panel/vender/apartar', 'POST', { propertyId, start, end, guests,
        name: form.get('name'), phone: form.get('phone'), email: form.get('email'), note: form.get('note') });
      setStatus('held');
      router.refresh();
    } catch (error) { setStatus(panelErrorKey(error) === 'conflict' ? 'taken' : 'error'); }
  }
  if (status === 'held') return <div role="status" className="space-y-2 rounded-2xl border border-green-700 p-4">
    <p className="font-semibold">{t('held')}</p>
    <Link href={`/panel/vender/${propertyId}`} className="inline-flex min-h-11 items-center font-semibold text-green-800 dark:text-green-300">{t('holdsTitle')} ›</Link>
  </div>;
  return <form onSubmit={submit} aria-label={t('hold')} className="space-y-3 rounded-2xl border border-gray-200 p-4 dark:border-gray-700">
    <h2 className="text-lg font-semibold">{t('hold')}</h2>
    <p className="text-sm text-gray-600 dark:text-gray-300">{t('holdIntro')}</p>
    <label htmlFor={id + '-name'} className="block text-sm font-semibold">{t('clientName')}</label>
    <input id={id + '-name'} name="name" required maxLength={100} autoComplete="off" className={field} />
    <label htmlFor={id + '-phone'} className="block text-sm font-semibold">{t('clientPhone')}</label>
    <input id={id + '-phone'} name="phone" type="tel" inputMode="tel" maxLength={30} className={field} />
    <label htmlFor={id + '-email'} className="block text-sm font-semibold">{t('clientEmail')}</label>
    <input id={id + '-email'} name="email" type="email" maxLength={254} className={field} />
    <label htmlFor={id + '-note'} className="block text-sm font-semibold">{t('clientNote')}</label>
    <textarea id={id + '-note'} name="note" rows={2} maxLength={1000} className={field} />
    {(status === 'taken' || status === 'error') && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">{t(status === 'taken' ? 'holdTaken' : 'holdError')}</p>}
    <button type="submit" disabled={status === 'busy'} className="min-h-12 w-full rounded-lg bg-gray-900 px-6 text-base font-semibold text-white disabled:opacity-50 dark:bg-gray-100 dark:text-gray-900">
      {t(status === 'busy' ? 'holding' : 'hold')}
    </button>
  </form>;
}
