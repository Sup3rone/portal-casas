'use client';
import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import Image from 'next/image';
import MessageModal, { type MessageData } from '@/components/MessageModal';
import { panelRequest, panelErrorKey, inputClass } from './request';

export type Inquiry = { id: string; name: string; email: string; phone: string | null; body: string; read: boolean; createdAt: string; propertyId: string; title: string; startDate: string | null; endDate: string | null;
  isPast?: boolean; userId?: string | null; slug?: string; photoUrl?: string | null; rentalType?: string; weekdayPrice?: number | null; weekendPrice?: number | null; seasonalPrice?: boolean };

function dateOnly(value: string | null) {
  const day = value?.match(/^(\d{4}-\d{2}-\d{2})(?:$|T| )/)?.[1];
  if (!day) return null;
  const date = new Date(day + 'T00:00:00Z');
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === day ? date : null;
}
export function inquiryEstimate(row: Inquiry) {
  const start = dateOnly(row.startDate), end = dateOnly(row.endDate);
  const nights = start && end ? (end.getTime() - start.getTime()) / 86_400_000 : 0;
  if (nights <= 0) return { start, end, nights: null, total: null };
  // Solo tarifa nocturna uniforme y sin temporada en el rango; no recrear cotización.
  const price = row.weekdayPrice;
  const total = row.rentalType === 'nocturna' && !row.seasonalPrice && typeof price === 'number'
    && Number.isFinite(price) && price >= 0 && price === row.weekendPrice ? nights * price : null;
  return { start, end, nights, total };
}
export default function Inquiries({ rows }: { rows: Inquiry[] }) {
  const t = useTranslations('panel'), locale = useLocale(), router = useRouter();
  const [property, setProperty] = useState(''), [status, setStatus] = useState(''), [error, setError] = useState(''), [busy, setBusy] = useState<string | null>(null);
  const [selected, setSelected] = useState<MessageData | null>(null);
  useEffect(() => {
    if (!selected) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setSelected(null);
    }
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [selected]);
  function open(row: Inquiry) {
    setSelected({ ...row, propertyName: row.title, propertySlug: row.slug ?? '', userId: row.userId ?? null });
  }
  function complete() { setSelected(null); router.refresh(); }
  const properties = [...new Map(rows.map(row => [row.propertyId, row.title])).entries()];
  const filtered = rows.filter(row => (!property || row.propertyId === property) && (!status || row.read === (status === 'read')));
  const current = filtered.filter(row => !row.isPast);
  const past = filtered.filter(row => row.isPast).sort((a, b) => (b.endDate ?? '').localeCompare(a.endDate ?? ''));
  const dateFormat = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', timeZone: 'UTC' });
  const currencyLocale = locale === 'en' ? 'en-GB' : locale === 'fr' ? 'fr-FR' : 'es-MX';
  async function mark(id: string) {
    setBusy(id); setError('');
    try { await panelRequest('/api/messages/read', 'POST', { id }); router.refresh(); }
    catch (error) { setError(panelErrorKey(error, 'markReadError')); }
    finally { setBusy(null); }
  }
  return <section className="space-y-4">
    <h1 className="text-3xl font-semibold">{t('messages')}</h1>
    <div className="grid gap-4 md:grid-cols-2"><label>{t('filterProperty')}<select value={property} onChange={event => setProperty(event.target.value)} className={inputClass}>
      <option value="">{t('all')}</option>{properties.map(([id, title]) => <option key={id} value={id}>{title}</option>)}</select></label>
      <label>{t('filterStatus')}<select value={status} onChange={event => setStatus(event.target.value)} className={inputClass}>
        <option value="">{t('all')}</option><option value="unread">{t('unread')}</option><option value="read">{t('read')}</option></select></label></div>
    {!filtered.length && <p>{t('emptyMessages')}</p>}
    {[current, past].map((group, index) => group.length > 0 && <section key={index} className="space-y-4">
      {index === 1 && <h2 className="text-2xl font-semibold">{t('pastInquiries')}</h2>}
      {group.map(row => {
      const estimate = inquiryEstimate(row);
      return <article key={row.id} role="button" tabIndex={0} onClick={() => open(row)}
        onKeyDown={event => {
          if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault(); open(row);
          }
        }} className="space-y-3 rounded-2xl border bg-white dark:bg-gray-900 p-6 shadow-sm dark:border-gray-700">
      <div className="flex items-start gap-3">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100 text-center text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
          {row.photoUrl ? <Image src={row.photoUrl} alt={row.title} width={80} height={80} unoptimized loading="lazy" className="h-full w-full object-cover" /> : t('emptyPhotos')}
        </div>
        <div className="min-w-0 flex-1"><div className="flex flex-wrap justify-between gap-3"><h2 className="break-words font-semibold">
          {row.slug ? <Link href={`/casas/${row.slug}`} target="_blank" rel="noopener noreferrer" onClick={event => event.stopPropagation()} className="text-green-700 underline dark:text-green-400">{row.title}</Link> : row.title}
        </h2><span>{t(row.read ? 'read' : 'unread')}</span></div><p className="break-words">{row.name}</p></div>
      </div>
      <p><a href={`mailto:${row.email}`} onClick={event => event.stopPropagation()} className="underline">{row.email}</a>{row.phone && ` · ${row.phone}`}</p>
      <p className="whitespace-pre-wrap">{row.body}</p>
      <p>{estimate.start && estimate.end ? `${dateFormat.format(estimate.start)} → ${dateFormat.format(estimate.end)}` : t('inquiryDatesUnavailable')}</p>
      {estimate.nights !== null && <p>{t('inquiryNights', { count: estimate.nights })}
        {estimate.total !== null && <> · {t('inquiryEstimatedTotal', { total: `$${estimate.total.toLocaleString(currencyLocale)} MXN` })}</>}
      </p>}
      <time dateTime={row.createdAt} className="text-sm text-gray-500 dark:text-gray-400">{new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Mexico_City' }).format(new Date(row.createdAt))}</time>
      {!row.read && <div><button disabled={busy === row.id} onClick={event => { event.stopPropagation(); void mark(row.id); }} className="underline">{t('markRead')}</button></div>}
    </article>; })}</section>)}
    {error && <p role="alert">{t(error)}</p>}
    {selected && <MessageModal message={selected} onClose={() => setSelected(null)} onSuccess={complete}
      onDelete={async id => { await panelRequest('/api/messages/delete', 'POST', { id }); complete(); }} />}
  </section>;
}
