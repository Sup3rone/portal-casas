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
    <div className="flex gap-2">
      {langs.map((l) => (
        <button
          key={l.code}
          onClick={() => change(l.code)}
          className={`rounded-lg px-3 py-1 text-sm ${
            locale === l.code
              ? 'bg-purple-600 text-white'
              : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
