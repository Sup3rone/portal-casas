'use client';
import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { panelRequest, inputClass } from './request';

export type Inquiry = { id: string; name: string; email: string; phone: string | null; body: string; read: boolean; createdAt: string; propertyId: string; title: string; startDate: string | null; endDate: string | null };
export default function Inquiries({ rows }: { rows: Inquiry[] }) {
  const t = useTranslations('panel'), locale = useLocale(), router = useRouter();
  const [property, setProperty] = useState(''), [status, setStatus] = useState(''), [error, setError] = useState(''), [busy, setBusy] = useState<string | null>(null);
  const properties = [...new Map(rows.map(row => [row.propertyId, row.title])).entries()];
  const filtered = rows.filter(row => (!property || row.propertyId === property) && (!status || row.read === (status === 'read')));
  async function mark(id: string) {
    setBusy(id); setError('');
    try { await panelRequest('/api/messages/read', 'POST', { id }); router.refresh(); }
    catch (error) { setError(error instanceof Error ? error.message : 'error'); }
    finally { setBusy(null); }
  }
  return <section className="space-y-4">
    <h1 className="text-3xl font-semibold">{t('messages')}</h1>
    <div className="grid gap-4 md:grid-cols-2"><label>{t('filterProperty')}<select value={property} onChange={event => setProperty(event.target.value)} className={inputClass}>
      <option value="">{t('all')}</option>{properties.map(([id, title]) => <option key={id} value={id}>{title}</option>)}</select></label>
      <label>{t('filterStatus')}<select value={status} onChange={event => setStatus(event.target.value)} className={inputClass}>
        <option value="">{t('all')}</option><option value="unread">{t('unread')}</option><option value="read">{t('read')}</option></select></label></div>
    {!filtered.length && <p>{t('emptyMessages')}</p>}
    {filtered.map(row => <article key={row.id} className="space-y-3 rounded-2xl border bg-white p-6 shadow-sm">
      <div className="flex flex-wrap justify-between gap-3"><h2 className="font-semibold">{row.title} · {row.name}</h2><span>{t(row.read ? 'read' : 'unread')}</span></div>
      <p><a href={`mailto:${row.email}`} className="underline">{row.email}</a>{row.phone && ` · ${row.phone}`}</p>
      <p className="whitespace-pre-wrap">{row.body}</p>
      <p>{row.startDate} → {row.endDate}</p>
      <time dateTime={row.createdAt} className="text-sm text-gray-500">{new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Mexico_City' }).format(new Date(row.createdAt))}</time>
      {!row.read && <div><button disabled={busy === row.id} onClick={() => mark(row.id)} className="underline">{t('markRead')}</button></div>}
    </article>)}
    {error && <p role="alert">{t(error)}</p>}
  </section>;
}
