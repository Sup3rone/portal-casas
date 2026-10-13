'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

export default function AuthForm({ action, endpoint, className = 'space-y-4', children }: {
  action: (formData: FormData) => unknown | Promise<unknown>;
  endpoint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const t = useTranslations('auth');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  return <form action={async data => { await action(data); }} className={className}
    onSubmit={async event => {
      if (!endpoint) return;
      event.preventDefault();
      if (pending) return;
      const data = new FormData(event.currentTarget);
      setPending(true); setError('');
      try {
        const response = await fetch(endpoint, { method: 'POST', body: data });
        const result = await response.json();
        if (!response.ok) { setError(result.message || t('requestFailed')); return; }
        if (result.redirect) window.location.assign(result.redirect);
      } catch { setError(t('requestFailed')); }
      finally { setPending(false); }
    }}
    onInput={event => {
      if (event.target instanceof HTMLInputElement) event.target.setCustomValidity('');
    }}
    onInvalidCapture={event => {
      if (!(event.target instanceof HTMLInputElement)) return;
      const input = event.target;
      input.setCustomValidity('');
      if (input.validity.valueMissing) input.setCustomValidity(t('requiredField'));
      else if (input.validity.typeMismatch) input.setCustomValidity(t('invalidEmail'));
      else if (input.validity.tooShort) input.setCustomValidity(t('invalidRegistration'));
    }}>
    {children}
    {error && <p role="alert" className="text-sm text-red-700 dark:text-red-400">{error}</p>}
  </form>;
}
