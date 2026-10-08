'use client';

import { useTranslations } from 'next-intl';

export default function AuthForm({ action, children }: {
  action: (formData: FormData) => void | Promise<void>;
  children: React.ReactNode;
}) {
  const t = useTranslations('auth');
  return <form action={action} className="space-y-4"
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
  </form>;
}
