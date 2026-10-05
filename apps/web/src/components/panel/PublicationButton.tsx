'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { panelRequest, buttonClass } from './request';

export default function PublicationButton({ id, published, admin }: { id: string; published: boolean; admin: boolean }) {
  const t = useTranslations('panel'), router = useRouter();
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  if (!published && !admin) return null;
  async function change() {
    setBusy(true); setError('');
    try { await panelRequest(`/api/properties/${id}`, 'PATCH', { published: !published }); router.refresh(); }
    catch (error) { setError(error instanceof Error ? error.message : 'error'); }
    finally { setBusy(false); }
  }
  return <div><button onClick={change} disabled={busy} className={buttonClass}>{t(busy ? 'saving' : published ? 'unpublish' : 'approve')}</button>
    {error && <p role="alert">{t(error)}</p>}</div>;
}
