'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { panelRequest, panelErrorKey } from './panel/request';

export default function MarkAsReadButton({
  messageId,
  read,
}: {
  messageId: string;
  read: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const t = useTranslations('panel');

  async function handleClick() {
    setLoading(true); setError('');
    try {
      await panelRequest('/api/messages/read', 'POST', { id: messageId });
      router.refresh(); // el server component re-renderiza con datos frescos
    } catch (error) {
      setError(panelErrorKey(error, 'markReadError'));
    } finally {
      setLoading(false);
    }
  }

  if (read) {
    return <span className="text-xs text-gray-400 dark:text-gray-300">✓ Leído</span>;
  }

  return (
    <><button
      onClick={event => { event.stopPropagation(); void handleClick(); }}
      disabled={loading}
      className="text-xs font-medium text-purple-600 dark:text-purple-400 underline hover:text-purple-800 dark:hover:text-purple-400 disabled:opacity-50"
    >
      {loading ? 'Marcando...' : 'Marcar como leído'}
    </button>{error && <p role="alert">{t(error)}</p>}</>
  );
}
