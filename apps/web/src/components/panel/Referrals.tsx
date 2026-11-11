'use client';
// T-4736: piezas cliente del panel de referidos (solo ADMIN; las APIs vuelven a validar).
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { panelRequest, inputClass, buttonClass } from './request';

type PartnerValues = { id?: string; name: string; email: string | null; phone: string | null; commissionPercent: string };

function useAction() {
  const errors = useTranslations('panel');
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [saved, setSaved] = useState(false);
  async function run(action: () => Promise<void>) {
    setBusy(true); setError(''); setSaved(false);
    try { await action(); setSaved(true); }
    catch (error) { setError(error instanceof Error ? error.message : 'error'); }
    finally { setBusy(false); }
  }
  return { busy, saved, run, errorText: error ? errors(error) : '' };
}

export function PartnerForm({ partner }: { partner?: PartnerValues }) {
  const t = useTranslations('referrals'), router = useRouter(), { busy, saved, run, errorText } = useAction();
  const [values, setValues] = useState({ name: partner?.name ?? '', email: partner?.email ?? '', phone: partner?.phone ?? '', commissionPercent: partner?.commissionPercent ?? '' });
  const field = (key: keyof typeof values, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => <label className="block space-y-1">
    <span>{label}</span>
    <input {...props} name={key} value={values[key]} className={inputClass} onChange={event => setValues(current => ({ ...current, [key]: event.target.value }))} />
  </label>;
  return <form className="grid gap-4 sm:grid-cols-2" onSubmit={event => {
    event.preventDefault();
    run(async () => {
      if (partner?.id) { await panelRequest(`/api/panel/partners/${encodeURIComponent(partner.id)}`, 'PATCH', values); router.refresh(); }
      else { const created = await panelRequest('/api/panel/partners', 'POST', values); router.push(`/panel/referidos/${created.id}`); }
    });
  }}>
    {field('name', t('name'), { required: true, maxLength: 120 })}
    {field('commissionPercent', t('commission'), { required: true, inputMode: 'decimal', pattern: '\\d{1,3}(\\.\\d{1,2})?' })}
    {field('email', t('email'), { type: 'email', maxLength: 254 })}
    {field('phone', t('phone'), { type: 'tel', maxLength: 40 })}
    <div className="space-y-2 sm:col-span-2">
      <button type="submit" disabled={busy} className={buttonClass}>{t(partner?.id ? 'save' : 'create')}</button>
      {saved && partner?.id && <p role="status">{t('saved')}</p>}
      {errorText && <p role="alert">{errorText}</p>}
    </div>
  </form>;
}

export function PartnerStatusButton({ id, active }: { id: string; active: boolean }) {
  const t = useTranslations('referrals'), router = useRouter(), { busy, run, errorText } = useAction();
  return <div className="space-y-2">
    <button type="button" disabled={busy} className={buttonClass} onClick={() => {
      if (!window.confirm(t(active ? 'confirmDeactivate' : 'confirmActivate'))) return;
      run(async () => { await panelRequest(`/api/panel/partners/${encodeURIComponent(id)}`, 'PATCH', { active: !active }); router.refresh(); });
    }}>{t(active ? 'deactivate' : 'activate')}</button>
    {errorText && <p role="alert">{errorText}</p>}
  </div>;
}

/** endpoint: por defecto el del ADMIN; el colaborador usa /api/panel/my-referrals/links. */
export function ReferralLinkCreator({ partnerId, properties, endpoint }: { partnerId?: string; properties: { id: string; label: string }[]; endpoint?: string }) {
  const t = useTranslations('referrals'), router = useRouter(), { busy, run, errorText } = useAction();
  const [propertyId, setPropertyId] = useState(''), [code, setCode] = useState('');
  return <form className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end" onSubmit={event => {
    event.preventDefault();
    run(async () => {
      await panelRequest(endpoint ?? `/api/panel/partners/${encodeURIComponent(partnerId ?? '')}/links`, 'POST', { propertyId: propertyId || null, code: code || null });
      setCode(''); router.refresh();
    });
  }}>
    <label className="block space-y-1"><span>{t('target')}</span>
      <select value={propertyId} onChange={event => setPropertyId(event.target.value)} className={inputClass}>
        <option value="">{t('general')}</option>
        {properties.map(property => <option key={property.id} value={property.id}>{property.label}</option>)}
      </select>
    </label>
    <label className="block space-y-1"><span>{t('customCode')}</span>
      <input value={code} maxLength={32} pattern="[A-Za-z0-9\-]{4,32}" aria-describedby="referral-code-help" className={inputClass}
        onChange={event => setCode(event.target.value.toUpperCase())} />
    </label>
    <button type="submit" disabled={busy} className={buttonClass}>{t('generate')}</button>
    <p id="referral-code-help" className="text-sm text-gray-600 dark:text-gray-300 sm:col-span-3">{t('customCodeHelp')}</p>
    {errorText && <p role="alert" className="sm:col-span-3">{errorText}</p>}
  </form>;
}

export function CopyLinkButton({ url }: { url: string }) {
  const t = useTranslations('referrals'), [copied, setCopied] = useState(false);
  return <button type="button" className={buttonClass} onClick={async () => {
    try { await navigator.clipboard.writeText(url); }
    catch {
      // Sin permiso de portapapeles: seleccionar el texto para copiarlo a mano.
      const node = document.querySelector<HTMLElement>(`[data-referral-url="${CSS.escape(url)}"]`);
      if (node) window.getSelection()?.selectAllChildren(node);
      return;
    }
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }}><span aria-live="polite">{t(copied ? 'copied' : 'copy')}</span></button>;
}
