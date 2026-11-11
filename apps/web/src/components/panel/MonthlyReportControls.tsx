'use client';
// T-4739: piezas cliente del reporte mensual — destinatarios (máx. 2) y envío manual / reenvío.
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { panelRequest, inputClass, buttonClass } from './request';

export function ReportRecipientsForm({ initial }: { initial: string[] }) {
  const t = useTranslations('monthlyReport'), errors = useTranslations('panel'), router = useRouter();
  const [emails, setEmails] = useState([initial[0] ?? '', initial[1] ?? '']);
  const [busy, setBusy] = useState(false), [saved, setSaved] = useState(false), [error, setError] = useState('');
  return <form className="space-y-3" onSubmit={async event => {
    event.preventDefault(); setBusy(true); setSaved(false); setError('');
    try { await panelRequest('/api/panel/reports/recipients', 'PATCH', { emails: emails.filter(email => email.trim()) }); setSaved(true); router.refresh(); }
    catch (failure) { setError(failure instanceof Error ? failure.message : 'error'); }
    finally { setBusy(false); }
  }}>
    <div className="grid gap-3 sm:grid-cols-2">
      {[0, 1].map(index => <label key={index} className="block space-y-1"><span>{t('recipient', { number: index + 1 })}</span>
        <input type="email" maxLength={254} value={emails[index]} className={inputClass} autoComplete="email"
          onChange={event => { setSaved(false); setEmails(current => current.map((value, i) => i === index ? event.target.value : value)); }} />
      </label>)}
    </div>
    <p className="text-sm text-gray-600 dark:text-gray-300">{t('recipientsHelp')}</p>
    <button type="submit" disabled={busy} className={buttonClass}>{t('saveRecipients')}</button>
    {saved && <p role="status">{t('saved')}</p>}
    {error && <p role="alert">{errors(error)}</p>}
  </form>;
}

export function SendReportButton({ month, disabled }: { month: string; disabled?: boolean }) {
  const t = useTranslations('monthlyReport'), errors = useTranslations('panel'), router = useRouter();
  const [busy, setBusy] = useState(false), [result, setResult] = useState<{ status: string; error: string | null } | null>(null), [error, setError] = useState('');
  return <div className="space-y-2">
    <button type="button" disabled={busy || disabled} className={buttonClass} onClick={async () => {
      setBusy(true); setResult(null); setError('');
      try { setResult(await panelRequest('/api/panel/reports/send', 'POST', { month })); router.refresh(); }
      catch (failure) { setError(failure instanceof Error ? failure.message : 'error'); }
      finally { setBusy(false); }
    }}>{t(busy ? 'sending' : 'sendNow', { month })}</button>
    {result?.status === 'sent' && <p role="status">{t('sentOk')}</p>}
    {result?.status === 'failed' && <p role="alert">{result.error === 'RATE_LIMITED' ? t('rateLimited') : t('sentFailed', { error: result.error ?? '' })}</p>}
    {error && <p role="alert">{errors(error)}</p>}
  </div>;
}
