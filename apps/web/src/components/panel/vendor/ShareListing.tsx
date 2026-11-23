'use client';
// T-5205: comparte la ficha PÚBLICA de la casa (nunca el panel) con la hoja de compartir del teléfono; si no hay,
// copia el enlace. Solo se muestra cuando la casa está publicada.
import { useState } from 'react';
import { shareProperty } from '@/components/PropertyShareButton';

export default function ShareListing({ path, title, label, copied }: { path: string; title: string; label: string; copied: string }) {
  const [status, setStatus] = useState<'idle' | 'copied'>('idle');
  async function share() {
    try {
      const result = await shareProperty({ title, text: title, url: new URL(path, window.location.origin).toString() });
      setStatus(result === 'copied' ? 'copied' : 'idle');
    } catch { setStatus('idle'); }
  }
  return <button type="button" data-share-url={path} onClick={share}
    className="min-h-12 w-full rounded-lg border border-green-700 px-4 text-base font-semibold text-green-800 dark:border-green-400 dark:text-green-300">
    <span aria-live="polite">{status === 'copied' ? copied : label}</span>
  </button>;
}
