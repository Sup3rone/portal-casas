'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import AvailabilityCalendar from '@/components/AvailabilityCalendar';
import ReservationDatesProvider, { useReservationDates } from '@/components/ReservationDatesProvider';
import type { PanelResources } from '@/lib/panel-resources';
import { panelRequest, inputClass, buttonClass } from './request';

function Editor({ propertyId, bookings }: { propertyId: string; bookings: PanelResources['bookings'] }) {
  const t = useTranslations('panel'), router = useRouter();
  const { dates, setDates } = useReservationDates();
  const [editing, setEditing] = useState<string | null>(null), [message, setMessage] = useState(''), [busy, setBusy] = useState(false);
  const occupied = bookings.filter(booking => booking.id !== editing);
  async function save(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setMessage('');
    try {
      await panelRequest(`/api/properties/${propertyId}/blocks${editing ? `/${editing}` : ''}`, editing ? 'PATCH' : 'POST', dates);
      setEditing(null); setDates({ startDate: '', endDate: '' }); setMessage('saved'); router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : 'error'); }
    finally { setBusy(false); }
  }
  async function remove(id: string) {
    if (!window.confirm(t('removeConfirm'))) return;
    setBusy(true); setMessage('');
    try { await panelRequest(`/api/properties/${propertyId}/blocks/${id}`, 'DELETE'); setEditing(null); setDates({ startDate: '', endDate: '' }); router.refresh(); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'error'); }
    finally { setBusy(false); }
  }
  return <section className="space-y-4 rounded-2xl border bg-white dark:bg-gray-900 p-6 shadow-sm dark:border-gray-700">
    <h2 className="text-xl font-semibold">{t('availability')}</h2>
    <p className="text-sm text-gray-600 dark:text-gray-300">{t('blockHint')}</p>
    <div className="grid gap-6 lg:grid-cols-2">
      <AvailabilityCalendar bookings={occupied} />
      <form onSubmit={save} className="space-y-4">
        {(['startDate', 'endDate'] as const).map(key => <label key={key} className="block text-sm">{t(key)}
          <input type="date" required value={dates[key]} onChange={event => setDates(current => ({ ...current, [key]: event.target.value }))} className={inputClass} />
        </label>)}
        <button disabled={busy || !dates.startDate || !dates.endDate} className={buttonClass}>{t(busy ? 'saving' : editing ? 'save' : 'block')}</button>
        {editing && <button type="button" onClick={() => { setEditing(null); setDates({ startDate: '', endDate: '' }); }}>{t('cancel')}</button>}
      </form>
    </div>
    {!bookings.length && <p>{t('emptyBookings')}</p>}
    <ul className="space-y-3">{bookings.map(booking => <li key={booking.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 dark:border-gray-700">
      <span>{booking.startDate} → {booking.endDate} · {booking.source === 'host-block' ? t('blockSource') : t('bookingSource', { source: booking.source })}</span>
      {booking.source === 'host-block' && <div className="flex gap-3"><button type="button" disabled={busy} onClick={() => { setEditing(booking.id); setDates({ startDate: booking.startDate, endDate: booking.endDate }); }} className="underline">{t('editBlock')}</button>
        <button type="button" disabled={busy} onClick={() => remove(booking.id)} className="underline">{t('remove')}</button></div>}
    </li>)}</ul>
    {message && <p role="status">{t(message)}</p>}
  </section>;
}
export default function AvailabilityEditor(props: { propertyId: string; bookings: PanelResources['bookings'] }) {
  return <ReservationDatesProvider><Editor {...props} /></ReservationDatesProvider>;
}
