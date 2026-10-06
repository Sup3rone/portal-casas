'use client';

import { useLayoutEffect, useSyncExternalStore } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { applyTheme, getServerTheme, getStoredTheme, getTheme, subscribeTheme } from '@/lib/theme';

export default function ThemeToggle() {
  const t = useTranslations('theme');
  const locale = useLocale();
  const theme = useSyncExternalStore(subscribeTheme, getTheme, getServerTheme);
  // El layout de otro locale puede reaplicar la clase SSR; restaurar antes de pintar.
  useLayoutEffect(() => { applyTheme(getStoredTheme()); }, [locale]);
  const action = t(theme === 'dark' ? 'light' : 'dark');
  return (
    <button type="button" onClick={() => applyTheme(theme === 'dark' ? 'light' : 'dark')}
      aria-label={action} title={action}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gray-200 text-gray-900 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-800">
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
        {theme === 'dark' ? <>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" />
        </> : <path d="M20.5 14a8.5 8.5 0 0 1-10.5-10.5A8.5 8.5 0 1 0 20.5 14Z" />}
      </svg>
    </button>
  );
}
