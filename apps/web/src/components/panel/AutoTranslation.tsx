'use client';
// T-5072: avisos de la traducción automática al guardar (sustituyen al botón «Traducir»).
import { useTranslations } from 'next-intl';

/** Nota general del formulario: se escribe en español y en/fr se traducen al guardar. */
export function AutoTranslationHint() {
  const t = useTranslations('panelTranslation');
  return <p data-auto-translation-hint className="text-sm text-gray-600 dark:text-gray-300">{t('hint')}</p>;
}

/** Etiqueta junto a un campo en/fr cuyo texto actual es la traducción automática. */
export function AutoTranslatedTag({ show }: { show: boolean }) {
  const t = useTranslations('panelTranslation');
  if (!show) return null;
  return <span data-auto-translated className="mt-1 inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-300">{t('auto')}</span>;
}
