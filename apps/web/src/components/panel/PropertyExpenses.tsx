'use client';
// T-5248: mantenimientos y gastos de UNA casa. Tres bloques: mantenimientos (estado, presupuesto vs costo real con
// alerta), gastos recurrentes (tipo, periodicidad, próximo pago) y cargos (casilla «pagado»). Los permisos los revisa
// la API en cada llamada; esta pantalla solo muestra lo que el servidor ya filtró.
import { useState, type FormEvent } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { formatMoney } from '@/lib/booking-breakdown';
import { currentDueDate, expensePeriodicities, maintenanceKinds, maintenanceStatuses, nextDueDate, overBudget, type Periodicity } from '@/lib/property-expenses-rules';
import { AttachmentError, attachmentAccept, attachmentMetadata } from '@/lib/expense-attachment-rules';
import { panelErrorKey, panelRequest, panelResponseError, PanelRequestError, inputClass, buttonClass } from './request';

type Type = { id: string; name: string; fixed: boolean; active: boolean };
type Maintenance = { id: string; title: string; kind: string; status: string; budget: string | null; actualCost: string | null; startDate: string | null; endDate: string | null; notes: string | null };
type Recurring = { id: string; typeId: string; periodicity: string; amount: string | null; startDate: string; active: boolean; notes: string | null };
type Entry = { id: string; typeId: string; recurringExpenseId: string | null; date: string; amount: string; paid: boolean; paidAt: string | null; notes: string | null };
type Attachment = { id: string; maintenanceId: string | null; entryId: string | null; fileName: string; contentType: string; size: number };
/** totals los calcula el servidor con TODOS los cargos; entries es la lista (recortada si truncated). */
export type PropertyExpensesData = { types: Type[]; maintenances: Maintenance[]; recurring: Recurring[]; entries: Entry[];
  totals: { paid: string; pending: string; total: string }; truncated: boolean; attachments: Attachment[] };
const attachmentCodes: Record<string, string> = { INVALID_ATTACHMENT_TYPE: 'invalidAttachmentType', INVALID_ATTACHMENT_SIZE: 'invalidAttachmentSize' };

const secondary = 'min-h-11 rounded-lg border border-green-700 px-3 text-green-800 disabled:opacity-50 dark:border-green-400 dark:text-green-300';
const card = 'space-y-4 rounded-lg border p-4 dark:border-gray-700';
const label = 'block space-y-1 text-sm';

/** FormData → objeto; los campos vacíos se mandan como null (montos y fechas opcionales). */
function fields(form: HTMLFormElement, names: string[]) {
  const data = new FormData(form);
  return Object.fromEntries(names.map(name => { const value = String(data.get(name) ?? '').trim(); return [name, value || null]; }));
}

export default function PropertyExpenses({ propertyId, data, today, isAdmin, attachmentsEnabled = false }: { propertyId: string; data: PropertyExpensesData; today: string; isAdmin: boolean; attachmentsEnabled?: boolean }) {
  const t = useTranslations('expenses'), errors = useTranslations('panel'), router = useRouter(), locale = useLocale();
  const [busy, setBusy] = useState(false), [status, setStatus] = useState(''), [error, setError] = useState('');
  // «Registrar pago de este periodo»: llena el formulario de pago con el gasto recurrente (key = lo vuelve a montar).
  const [prefill, setPrefill] = useState<{ typeId: string; recurringExpenseId: string; date: string; amount: string } | null>(null);
  const [formKey, setFormKey] = useState(0);
  const base = `/api/properties/${encodeURIComponent(propertyId)}/expenses`;
  const money = (value: string | null) => formatMoney(value, locale);
  const day = (value: string | null) => value ? new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(value + 'T00:00:00Z')) : '—';
  const typeName = (id: string) => data.types.find(type => type.id === id)?.name ?? '—';
  const activeTypes = data.types.filter(type => type.active);

  async function run(action: () => Promise<unknown>, done: string, form?: HTMLFormElement) {
    setBusy(true); setStatus(''); setError('');
    try { await action(); form?.reset(); if (form) { setPrefill(null); setFormKey(key => key + 1); } setStatus(t(done)); router.refresh(); }
    catch (failure) { setError(errors(panelErrorKey(failure))); }
    finally { setBusy(false); }
  }
  const submit = (record: string, names: string[], extra: (form: HTMLFormElement) => Record<string, unknown> = () => ({})) => (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    void run(() => panelRequest(base, 'POST', { record, ...fields(form, names), ...extra(form) }), 'added', form);
  };
  const patch = (kind: string, id: string, body: Record<string, unknown>) =>
    run(() => panelRequest(`${base}/${kind}/${encodeURIComponent(id)}`, 'PATCH', body), 'saved');
  const remove = (kind: string, id: string) => {
    if (!window.confirm(t('confirmRemove'))) return;
    void run(() => panelRequest(`${base}/${kind}/${encodeURIComponent(id)}`, 'DELETE'), 'removed');
  };

  // Fase 2: facturas y recibos. Se valida antes de subir (el servidor vuelve a validar) y se sube como multipart.
  async function upload(kind: 'maintenance' | 'entry', id: string, file: File | undefined) {
    if (!file) return;
    try { attachmentMetadata(file.type, file.size); }
    catch (failure) { setStatus(''); setError(errors(failure instanceof AttachmentError ? attachmentCodes[failure.code] ?? 'error' : 'error')); return; }
    const form = new FormData(); form.append('file', file);
    await run(async () => {
      let response: Response;
      try { response = await fetch(`${base}/${kind}/${encodeURIComponent(id)}/attachments`, { method: 'POST', body: form }); }
      catch { throw new PanelRequestError('networkError'); }
      if (!response.ok) throw panelResponseError(response.status, await response.json().catch(() => ({})));
    }, 'attachmentAdded');
  }
  const kb = (size: number) => `${Math.max(1, Math.round(size / 1000)).toLocaleString(locale)} KB`;
  const attachmentsFor = (kind: 'maintenance' | 'entry', id: string) => {
    const files = data.attachments.filter(file => (kind === 'maintenance' ? file.maintenanceId : file.entryId) === id);
    return <div data-attachments={kind} className="w-full space-y-2">
      {files.length > 0 && <ul className="space-y-1">{files.map(file => <li key={file.id} className="flex flex-wrap items-center gap-3 text-sm">
        <a href={`${base}/attachments/${encodeURIComponent(file.id)}`} target="_blank" rel="noopener" className="text-green-700 underline dark:text-green-400">
          {file.contentType === 'application/pdf' ? 'PDF' : t('image')} · {file.fileName}</a>
        <span className="text-gray-600 dark:text-gray-300">{kb(file.size)}</span>
        <button type="button" disabled={busy} className="min-h-11 px-2 text-red-800 underline disabled:opacity-50 dark:text-red-300" onClick={() => {
          if (!window.confirm(t('confirmRemoveAttachment'))) return;
          void run(() => panelRequest(`${base}/attachments/${encodeURIComponent(file.id)}`, 'DELETE'), 'removed');
        }}>{t('removeAttachment')}</button>
      </li>)}</ul>}
      {attachmentsEnabled
        ? <label className="inline-flex min-h-11 cursor-pointer items-center rounded-lg border border-dashed border-green-700 px-3 text-sm text-green-800 dark:border-green-400 dark:text-green-300">
            {t('attach')}<input type="file" accept={attachmentAccept} disabled={busy} className="sr-only"
              onChange={event => { const file = event.currentTarget.files?.[0]; event.currentTarget.value = ''; void upload(kind, id, file); }} /></label>
        : files.length === 0 && <p className="text-sm text-gray-600 dark:text-gray-300">{t('attachmentsOff')}</p>}
    </div>;
  };
  const typeSelect = (value = '') => <select name="typeId" required className={inputClass} defaultValue={value}>
    <option value="" disabled>{t('chooseType')}</option>
    {activeTypes.map(type => <option key={type.id} value={type.id}>{type.name}</option>)}
  </select>;
  function registerPeriod(item: Recurring, date: string) {
    setPrefill({ typeId: item.typeId, recurringExpenseId: item.id, date, amount: item.amount ?? '' });
    setFormKey(key => key + 1);
    setStatus(''); setError('');
    requestAnimationFrame(() => {
      const form = document.getElementById('registrar-pago');
      form?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      (form?.querySelector('input[name="amount"]') as HTMLInputElement | null)?.focus({ preventScroll: true });
    });
  }

  const totals = data.totals;
  const over = data.maintenances.filter(item => overBudget(item.budget, item.actualCost));

  return <div className="space-y-6">
    <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div className={card}><dt className="text-sm">{t('pendingTotal')}</dt><dd data-total="pending" className="text-xl font-semibold">{money(totals.pending)}</dd></div>
      <div className={card}><dt className="text-sm">{t('paidTotal')}</dt><dd data-total="paid" className="text-xl font-semibold">{money(totals.paid)}</dd></div>
      <div className={card}><dt className="text-sm">{t('overBudgetCount')}</dt><dd data-total="over" className={`text-xl font-semibold ${over.length ? 'text-red-800 dark:text-red-300' : ''}`}>{over.length}</dd></div>
    </dl>
    {status && <p role="status" className="rounded-lg border border-green-700 p-3 text-sm">{status}</p>}
    {error && <p role="alert" className="rounded-lg border border-red-700 p-3 text-sm text-red-800 dark:text-red-300">{error}</p>}

    <section className={card} data-expenses-section="maintenance">
      <h2 className="text-xl font-semibold">{t('maintenanceTitle')}</h2>
      {!data.maintenances.length && <p>{t('maintenanceEmpty')}</p>}
      <ul className="space-y-3">{data.maintenances.map(item => <li key={item.id} className="space-y-2 rounded-lg border p-3 dark:border-gray-700">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="font-semibold">{item.title} <span className="text-sm font-normal">· {t(`kinds.${item.kind}`)}</span></p>
          {overBudget(item.budget, item.actualCost) && <span data-over-budget="" role="alert" className="rounded-full border border-red-700 px-2 py-0.5 text-sm text-red-800 dark:border-red-400 dark:text-red-300">{t('overBudget')}</span>}
        </div>
        <p className="text-sm">{t('budget')}: {money(item.budget)} · {t('actualCost')}: {money(item.actualCost)}</p>
        {(item.startDate || item.endDate) && <p className="text-sm">{day(item.startDate)} → {day(item.endDate)}</p>}
        {item.notes && <p className="whitespace-pre-line text-sm">{item.notes}</p>}
        <div className="flex flex-wrap items-end gap-3">
          <label className={label}><span>{t('status')}</span>
            <select value={item.status} disabled={busy} className={inputClass} onChange={event => patch('maintenance', item.id, { status: event.target.value })}>
              {maintenanceStatuses.map(value => <option key={value} value={value}>{t(`statuses.${value}`)}</option>)}</select></label>
          <form className="flex items-end gap-2" onSubmit={event => { event.preventDefault(); const value = fields(event.currentTarget, ['actualCost']); void patch('maintenance', item.id, value); }}>
            <label className={label}><span>{t('actualCost')}</span><input name="actualCost" inputMode="decimal" defaultValue={item.actualCost ?? ''} className={inputClass} /></label>
            <button type="submit" disabled={busy} className={secondary}>{t('save')}</button>
          </form>
          <button type="button" disabled={busy} className={secondary} onClick={() => remove('maintenance', item.id)}>{t('remove')}</button>
          {attachmentsFor('maintenance', item.id)}
        </div>
      </li>)}</ul>
      <form className="grid gap-3 sm:grid-cols-2" onSubmit={submit('maintenance', ['title', 'kind', 'status', 'budget', 'actualCost', 'startDate', 'endDate', 'notes'])}>
        <h3 className="font-semibold sm:col-span-2">{t('maintenanceNew')}</h3>
        <label className={`${label} sm:col-span-2`}><span>{t('maintenanceName')}</span><input name="title" required maxLength={200} className={inputClass} /></label>
        <label className={label}><span>{t('kind')}</span><select name="kind" required className={inputClass}>{maintenanceKinds.map(value => <option key={value} value={value}>{t(`kinds.${value}`)}</option>)}</select></label>
        <label className={label}><span>{t('status')}</span><select name="status" className={inputClass}>{maintenanceStatuses.map(value => <option key={value} value={value}>{t(`statuses.${value}`)}</option>)}</select></label>
        <label className={label}><span>{t('budget')}</span><input name="budget" inputMode="decimal" placeholder="0.00" className={inputClass} /></label>
        <label className={label}><span>{t('actualCost')}</span><input name="actualCost" inputMode="decimal" placeholder="0.00" className={inputClass} /></label>
        <label className={label}><span>{t('startDate')}</span><input name="startDate" type="date" className={inputClass} /></label>
        <label className={label}><span>{t('endDate')}</span><input name="endDate" type="date" className={inputClass} /></label>
        <label className={`${label} sm:col-span-2`}><span>{t('notes')}</span><textarea name="notes" maxLength={2000} rows={2} className={inputClass} /></label>
        <div className="sm:col-span-2"><button type="submit" disabled={busy} className={buttonClass}>{t('add')}</button></div>
      </form>
    </section>

    <section className={card} data-expenses-section="recurring">
      <h2 className="text-xl font-semibold">{t('recurringTitle')}</h2>
      {!data.recurring.length && <p>{t('recurringEmpty')}</p>}
      <ul className="space-y-3">{data.recurring.map(item => <li key={item.id} className={`space-y-2 rounded-lg border p-3 dark:border-gray-700 ${item.active ? '' : 'opacity-60'}`}>
        <p className="font-semibold">{typeName(item.typeId)} <span className="text-sm font-normal">· {t(`periodicities.${item.periodicity}`)} · {money(item.amount)}</span></p>
        <p className="text-sm">{item.active ? t('nextDue', { date: day(nextDueDate(item.startDate, item.periodicity as Periodicity, today)) }) : t('inactive')}</p>
        {item.notes && <p className="whitespace-pre-line text-sm">{item.notes}</p>}
        <div className="flex flex-wrap gap-3">
          {item.active && (() => {
            const period = currentDueDate(item.startDate, item.periodicity as Periodicity, today);
            return data.entries.some(entry => entry.recurringExpenseId === item.id && entry.date === period)
              ? <span data-period-registered="" className="flex min-h-11 items-center text-sm text-green-800 dark:text-green-300">{t('periodRegistered', { date: day(period) })}</span>
              : <button type="button" data-register-period={period} disabled={busy} className={buttonClass} onClick={() => registerPeriod(item, period)}>{t('registerPeriod', { date: day(period) })}</button>;
          })()}
          <button type="button" disabled={busy} className={secondary} onClick={() => patch('recurring', item.id, { active: !item.active })}>{t(item.active ? 'deactivate' : 'activate')}</button>
          <button type="button" disabled={busy} className={secondary} onClick={() => remove('recurring', item.id)}>{t('remove')}</button>
        </div>
      </li>)}</ul>
      <form className="grid gap-3 sm:grid-cols-2" onSubmit={submit('recurring', ['typeId', 'periodicity', 'amount', 'startDate', 'notes'])}>
        <h3 className="font-semibold sm:col-span-2">{t('recurringNew')}</h3>
        <label className={label}><span>{t('type')}</span>{typeSelect()}</label>
        <label className={label}><span>{t('periodicity')}</span><select name="periodicity" required className={inputClass} defaultValue="mensual">{expensePeriodicities.map(value => <option key={value} value={value}>{t(`periodicities.${value}`)}</option>)}</select></label>
        <label className={label}><span>{t('estimatedAmount')}</span><input name="amount" inputMode="decimal" placeholder="0.00" className={inputClass} /></label>
        <label className={label}><span>{t('firstDate')}</span><input name="startDate" type="date" required defaultValue={today} className={inputClass} /></label>
        <label className={`${label} sm:col-span-2`}><span>{t('notes')}</span><textarea name="notes" maxLength={2000} rows={2} className={inputClass} /></label>
        <div className="sm:col-span-2"><button type="submit" disabled={busy || !activeTypes.length} className={buttonClass}>{t('add')}</button></div>
      </form>
      {isAdmin && <form className="flex flex-wrap items-end gap-3 border-t pt-4 dark:border-gray-700" onSubmit={event => {
        event.preventDefault(); const form = event.currentTarget;
        void run(() => panelRequest('/api/panel/expense-types', 'POST', fields(form, ['name'])), 'typeAdded', form);
      }}>
        <label className={label}><span>{t('newType')}</span><input name="name" required maxLength={60} className={inputClass} /></label>
        <button type="submit" disabled={busy} className={secondary}>{t('addType')}</button>
        <p className="w-full text-sm text-gray-600 dark:text-gray-300">{t('typesHint')}</p>
      </form>}
    </section>

    <section className={card} data-expenses-section="entry">
      <h2 className="text-xl font-semibold">{t('entriesTitle')}</h2>
      {!data.entries.length && <p>{t('entriesEmpty')}</p>}
      {data.truncated && <p data-entries-truncated="" className="text-sm text-gray-600 dark:text-gray-300">{t('entriesTruncated', { count: data.entries.length })}</p>}
      <ul className="space-y-2">{data.entries.map(item => <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 dark:border-gray-700">
        <label className="flex min-h-11 items-center gap-3">
          <input type="checkbox" checked={item.paid} disabled={busy} className="h-5 w-5" aria-label={t('paid')} onChange={event => patch('entry', item.id, { paid: event.target.checked })} />
          <span><span className="font-semibold">{typeName(item.typeId)}</span> · {day(item.date)} · {money(item.amount)}
            <span className="block text-sm">{item.paid ? t('paidOn', { date: day(item.paidAt) }) : t('unpaid')}</span></span>
        </label>
        <button type="button" disabled={busy} className={secondary} onClick={() => remove('entry', item.id)}>{t('remove')}</button>
        {attachmentsFor('entry', item.id)}
      </li>)}</ul>
      <form key={formKey} id="registrar-pago" data-prefilled={prefill ? '' : undefined} className="grid gap-3 sm:grid-cols-2" onSubmit={submit('entry', ['typeId', 'recurringExpenseId', 'date', 'amount', 'notes'], form => ({ paid: (form.elements.namedItem('paid') as HTMLInputElement).checked }))}>
        <h3 className="font-semibold sm:col-span-2">{t('entryNew')}</h3>
        <label className={label}><span>{t('type')}</span>{typeSelect(prefill?.typeId)}</label>
        <label className={label}><span>{t('fromRecurring')}</span><select name="recurringExpenseId" className={inputClass} defaultValue={prefill?.recurringExpenseId ?? ''}>
          <option value="">{t('noRecurring')}</option>
          {data.recurring.filter(item => item.active).map(item => <option key={item.id} value={item.id}>{typeName(item.typeId)} · {t(`periodicities.${item.periodicity}`)}</option>)}
        </select></label>
        <label className={label}><span>{t('date')}</span><input name="date" type="date" required defaultValue={prefill?.date ?? today} className={inputClass} /></label>
        <label className={label}><span>{t('amount')}</span><input name="amount" required inputMode="decimal" placeholder="0.00" defaultValue={prefill?.amount ?? ''} className={inputClass} /></label>
        {/* Desde «Registrar pago de este periodo» se asume pagado; se puede desmarcar. */}
        <label className="flex min-h-11 items-center gap-3 sm:col-span-2"><input name="paid" type="checkbox" defaultChecked={Boolean(prefill)} className="h-5 w-5" /><span>{t('paid')}</span></label>
        {prefill && <p className="text-sm text-gray-600 dark:text-gray-300 sm:col-span-2">{t('prefillHint')}</p>}
        <label className={`${label} sm:col-span-2`}><span>{t('notes')}</span><textarea name="notes" maxLength={2000} rows={2} className={inputClass} /></label>
        <div className="sm:col-span-2"><button type="submit" disabled={busy || !activeTypes.length} className={buttonClass}>{t('add')}</button></div>
      </form>
    </section>
  </div>;
}
