'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { panelRequest, buttonClass } from './request';

export default function UserActions({ id, role, self }: { id: string; role: string; self: boolean }) {
  const t = useTranslations('adminUsers'), errors = useTranslations('panel'), router = useRouter();
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [saved, setSaved] = useState(false);
  const [password, setPassword] = useState<string | null>(null);
  const nextRole = role === 'COLLABORATOR' ? 'CLIENT' : 'COLLABORATOR';
  async function change(action: 'role' | 'password') {
    if (!window.confirm(t(action === 'role' ? 'confirmRole' : 'confirmReset'))) return;
    setBusy(true); setError(''); setSaved(false); setPassword(null);
    try {
      const result = await panelRequest(`/api/panel/users/${encodeURIComponent(id)}`, 'PATCH', { action, role: nextRole, confirmed: true });
      if (action === 'password') setPassword(result.temporaryPassword);
      else setSaved(true);
      router.refresh();
    } catch (error) { setError(error instanceof Error ? error.message : 'error'); }
    finally { setBusy(false); }
  }
  return <section className="space-y-4">
    <h2 className="text-xl font-semibold">{t('actions')}</h2>
    {(self || role === 'ADMIN') && <p>{t('roleProtected')}</p>}
    {!self && ['CLIENT', 'COLLABORATOR', 'VIEWER'].includes(role) && <button type="button" disabled={busy} className={buttonClass} onClick={() => change('role')}>
      {t(role === 'COLLABORATOR' ? 'demote' : 'promote')}</button>}
    <p className="text-sm text-gray-600 dark:text-gray-300">{t('sessionWarning')}</p>
    <button type="button" disabled={busy || password !== null} className={buttonClass} onClick={() => change('password')}>{t('reset')}</button>
    {password !== null && <div role="status" className="space-y-2 rounded-lg border border-green-700 p-4">
      <p>{t('oneTime')}</p><code className="select-all break-all">{password}</code>
      <div><button type="button" className={buttonClass} onClick={() => setPassword(null)}>{t('dismiss')}</button></div>
    </div>}
    {saved && <p role="status">{t('saved')}</p>}
    {error && <p role="alert">{errors(error)}</p>}
  </section>;
}
