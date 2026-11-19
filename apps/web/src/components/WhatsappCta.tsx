// T-4944: llamada a la acción por WhatsApp con mensaje prellenado (número global del panel, contact_whatsapp).
// Sin número válido no se pinta: mejor ningún botón que uno roto.
import { whatsappHref } from '@/lib/public-pages';

export default function WhatsappCta({ number, message, label }: { number: string; message: string; label: string }) {
  const href = whatsappHref(number, message);
  if (!href) return null;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" data-cta="whatsapp"
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-green-700 px-6 py-3 text-sm font-medium tracking-wide text-white hover:bg-green-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700 dark:bg-green-600 dark:hover:bg-green-500">
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5 shrink-0"><path d="M21 11.5a9 9 0 0 1-13.3 7.9L3 21l1.6-4.7A9 9 0 1 1 21 11.5Z" /><path d="m8 7 2 3-1 1c1 2 2 3 4 4l1-1 3 2c-1 2-3 2-5 1-3-2-5-4-6-7 0-1 1-3 2-3Z" /></svg>
      {label}
    </a>
  );
}
