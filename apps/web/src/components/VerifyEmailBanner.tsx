// T-4783: aviso en Mi cuenta para cuentas sin confirmar, con botón de reenviar. No bloquea nada.
// Español fijo, como el resto de Mi cuenta.
import { resendVerification } from '@/app/[locale]/confirmar-correo/actions';

const NOTES = {
  error: 'No pudimos enviarte el correo de confirmación. Usa «Reenviar» para intentarlo de nuevo.',
  reenviado: 'Te enviamos un nuevo enlace. Revisa tu bandeja de entrada y spam; el enlace anterior ya no sirve.',
} as const;

export default function VerifyEmailBanner({ email, locale, note }: { email: string; locale: string; note?: string }) {
  const extra = note === 'error' || note === 'reenviado' ? NOTES[note] : null;
  return (
    <section role="status" className="mb-6 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
      <p className="font-semibold">Confirma tu correo</p>
      <p className="mt-1">Te enviamos un enlace a <strong>{email}</strong> para confirmar que es tuyo. Dura 24 horas.</p>
      {extra && <p className="mt-2">{extra}</p>}
      <form action={resendVerification} className="mt-3">
        <input type="hidden" name="locale" value={locale} />
        <button type="submit" className="rounded-lg border border-amber-400 px-3 py-1.5 font-medium hover:bg-amber-100 dark:border-amber-600 dark:hover:bg-amber-900">
          Reenviar
        </button>
      </form>
    </section>
  );
}
