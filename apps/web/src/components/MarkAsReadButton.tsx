'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function MarkAsReadButton({
  messageId,
  read,
}: {
  messageId: string;
  read: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      await fetch('/api/messages/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: messageId }),
      });
      router.refresh(); // el server component re-renderiza con datos frescos
    } finally {
      setLoading(false);
    }
  }

  if (read) {
    return <span className="text-xs text-gray-400">✓ Leído</span>;
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="text-xs font-medium text-purple-600 underline hover:text-purple-800 disabled:opacity-50"
    >
      {loading ? 'Marcando...' : 'Marcar como leído'}
    </button>
  );
}
