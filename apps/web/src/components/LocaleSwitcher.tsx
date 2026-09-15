'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';

const langs = [
  { code: 'es', label: '🇪🇸 ES' },
  { code: 'en', label: '🇬🇧 EN' },
  { code: 'fr', label: '🇫🇷 FR' }
];

export default function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const change = (newLocale: string) => {
    // la pathname viene con /es/... o /en/... — la reemplazamos
    const newPath = pathname.replace(/^\/(es|en|fr)/, `/${newLocale}`);
    router.push(newPath);
  };

  return (
    <div className="animate-pulse space-y-4">
      <div className="h-64 rounded-2xl bg-gray-200"></div>
      <div className="h-6 w-3/4 rounded bg-gray-200"></div>
      <div className="h-4 w-1/2 rounded bg-gray-200"></div>
    </div>
  );
}
