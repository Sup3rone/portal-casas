'use client';
// T-5072: avisos de la traducción automática al guardar (sustituyen al botón «Traducir»).
import { useState } from 'react';
import { useTranslations } from 'next-intl';

/** Nota general del formulario: se escribe en español y en/fr se traducen al guardar. */
export function AutoTranslationHint() {
  const t = useTranslations('panelTranslation');
  return <p data-auto-translation-hint className="text-sm text-gray-600 dark:text-gray-300">{t('hint')}</p>;
}

/** Vacía el campo como si se escribiera en él (React y los borradores del editor se enteran). */
function clearField(button: HTMLButtonElement) {
  const control = button.closest('label')?.querySelector<HTMLInputElement | HTMLTextAreaElement>('input, textarea');
  if (!control) return false;
  const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(control), 'value')?.set;
  setter?.call(control, '');
  control.dispatchEvent(new Event('input', { bubbles: true }));
  control.focus();
  return true;
}

/**
 * Bajo cada campo en/fr (dentro de su <label>). Automático: etiqueta «traducido automáticamente».
 * Escrito a mano (p. ej. textos de antes de T-5072): enlace «Usar traducción automática», que vacía el campo;
 * al guardar se traduce del español y desde entonces queda como automático.
 */
export function AutoTranslationControl({ auto, target = true }: { auto: boolean; target?: boolean }) {
  const t = useTranslations('panelTranslation');
  const [cleared, setCleared] = useState(false);
  if (!target) return null;
  if (auto) return <span data-auto-translated className="mt-1 inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-300">{t('auto')}</span>;
  if (cleared) return <span role="status" className="mt-1 block text-xs text-gray-600 dark:text-gray-300">{t('useAutoDone')}</span>;
  return <button type="button" data-use-auto-translation onClick={event => { if (clearField(event.currentTarget)) setCleared(true); }}
    className="mt-1 inline-flex min-h-8 items-center text-xs text-green-800 underline underline-offset-2 hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700 dark:text-green-300">
    {t('useAuto')}
  </button>;
}
