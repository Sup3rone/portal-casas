'use client';
import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { translateFields, type DraftLanguage, type TranslationControls } from '@/lib/panel-translation-drafts';
const activeForms = new WeakSet<HTMLFormElement>();
export default function TranslationDraftButton({ source, prefix, disabled }: { source: DraftLanguage; prefix: 'title' | 'desc' | 'description'; disabled?: boolean }) {
  const t = useTranslations('panelTranslation');
  const [notice, setNotice] = useState(''), [busy, setBusy] = useState(false);
  const running = useRef(false);
  async function translate(event: React.MouseEvent<HTMLButtonElement>) {
    const form = event.currentTarget.closest('form'); if (!form || running.current) return;
    if (activeForms.has(form)) { setNotice(t('busy')); return; }
    running.current = true; activeForms.add(form); setBusy(true); setNotice('');
    try {
      function field(language: DraftLanguage) {
        const control = form!.elements.namedItem(prefix + language[0].toUpperCase() + language.slice(1)) as HTMLInputElement | HTMLTextAreaElement | null;
        if (!control || typeof control.value !== 'string') throw new Error('error');
        return control;
      }
      const controls: TranslationControls = { es: field('es'), en: field('en'), fr: field('fr') };
      const result = await translateFields(source, controls, async (text, from, to) => {
        let response: Response;
        try { response = await fetch('/api/traducir', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({texto:text,idiomaOrigen:from,idiomaDestino:to}) }); }
        catch { throw new Error('error'); }
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.code === 'TRANSLATION_QUOTA' ? 'quota' : data.code === 'TRANSLATION_RATE_LIMIT' ? 'rateLimit' : data.code === 'INVALID_TRANSLATION_TEXT' ? 'tooLong' : 'error');
        if (typeof data.traduccion !== 'string') throw new Error('error');
        return data.traduccion;
      });
      setNotice(t('prepared', { filled:result.filled.join(', ').toUpperCase() || '—', skipped:result.skipped.join(', ').toUpperCase() || '—' }));
    } catch (error) {
      const key = error instanceof Error && ['emptySource','sourceChanged','tooLong','quota','rateLimit'].includes(error.message) ? error.message : 'error';
      setNotice(t(key));
    } finally { running.current = false; activeForms.delete(form); setBusy(false); }
  }
  return <span className="mt-2 block space-y-1">
    <button type="button" disabled={disabled || busy} aria-busy={busy} onClick={translate} className="rounded-lg border border-green-700 px-3 py-2 text-sm text-green-800 disabled:opacity-50 dark:border-green-400 dark:text-green-300">
      {busy && <span aria-hidden="true" className="mr-2 inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-r-transparent motion-reduce:animate-none" />}{t(busy ? 'translating' : 'button')}
    </button>
    <span className="block text-xs text-gray-600 dark:text-gray-300">{t('hint')}</span>
    {notice && <span role="status" className="block text-xs">{notice}</span>}
  </span>;
}
