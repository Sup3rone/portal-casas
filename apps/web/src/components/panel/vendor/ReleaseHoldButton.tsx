'use client';
// T-5209: «Liberar» un apartado (borra el bloqueo, la consulta queda). Dos toques para no liberar por error.
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { panelRequest } from '@/components/panel/request';

export default function ReleaseHoldButton({ blockId }: { blockId: string }) {
  const t = useTranslations('vendor'), router = useRouter();
  const [step, setStep] = useState<'idle' | 'confirm' | 'busy' | 'error'>('idle');
  async function release() {
    if (step !== 'confirm') { setStep('confirm'); return; }
    setStep('busy');
    try { await panelRequest('/api/panel/vender/liberar', 'POST', { blockId }); router.refresh(); }
    catch { setStep('error'); }
  }
  return <button type="button" data-release={blockId} onClick={release} disabled={step === 'busy'}
    className="min-h-11 rounded-lg border border-red-700 px-4 text-sm font-semibold text-red-800 disabled:opacity-50 dark:border-red-400 dark:text-red-300">
    {t(step === 'confirm' ? 'releaseConfirm' : step === 'busy' ? 'releasing' : step === 'error' ? 'releaseError' : 'release')}
  </button>;
}
