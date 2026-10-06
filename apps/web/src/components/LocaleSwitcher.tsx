'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';

const LOCALES = [
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
] as const;

export default function LocaleSwitcher() {
  const locale = useLocale();
  const t = useTranslations('nav');
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Cerrar el dropdown al hacer clic afuera
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function cambiar(nuevoLocale: string) {
    if (nuevoLocale === locale) {
      setOpen(false);
      return;
    }
    // Reemplaza el prefijo del idioma en la ruta actual
    const segmentos = pathname.split('/');
    if (LOCALES.some((l) => l.code === segmentos[1])) {
      segmentos[1] = nuevoLocale;
    } else {
      segmentos.splice(1, 0, nuevoLocale);
    }
    router.push(segmentos.join('/') || '/');
    setOpen(false);
  }

  const actual = LOCALES.find((l) => l.code === locale) ?? LOCALES[0];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-full border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-sm font-medium tracking-wide text-gray-900 dark:text-gray-100 transition-colors hover:border-gray-400 dark:hover:border-gray-600"
        aria-label={t('cambiarIdioma')}
      >
        <span className="text-base leading-none">{actual.flag}</span>
        <span>{actual.code.toUpperCase()}</span>
        <span className={`text-xs transition-transform ${open ? 'rotate-180' : ''}`}>▼</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-44 overflow-hidden rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-lg">
          {LOCALES.map((l) => (
            <button
              key={l.code}
              onClick={() => cambiar(l.code)}
              className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-950 ${
                l.code === locale ? 'font-bold text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-200'
              }`}
            >
              <span className="text-base">{l.flag}</span>
              {l.label}
              { l.code === locale && <span className="ml-auto text-gray-900 dark:text-gray-100">✓</span> }
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
