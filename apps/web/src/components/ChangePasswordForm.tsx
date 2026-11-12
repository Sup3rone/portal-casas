'use client';
// T-4772: «Cambiar contraseña» en Mi cuenta. Un botón despliega el formulario; español fijo, como el resto de la página.
import { useActionState, useState } from 'react';
import { changePasswordAction, type ChangePasswordState } from '@/app/[locale]/mi-cuenta/actions';

const MESSAGES: Record<NonNullable<ChangePasswordState['error']>, string> = {
  session: 'Tu sesión expiró. Vuelve a iniciar sesión.',
  current: 'La contraseña actual no es correcta.',
  length: 'La nueva contraseña debe tener al menos 8 caracteres.',
  match: 'La nueva contraseña y su confirmación no coinciden.',
  same: 'La nueva contraseña debe ser distinta de la actual.',
  rate: 'Demasiados intentos. Espera unos minutos y vuelve a intentar.',
  server: 'No se pudo cambiar la contraseña. Intenta de nuevo.',
};
const DONE = 'Contraseña actualizada. Te enviamos un aviso por correo.';

const input = 'w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent px-3 py-2 text-gray-900 dark:text-gray-100';
const button = 'rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50';
const label = 'block space-y-1 text-sm text-gray-700 dark:text-gray-300';

export default function ChangePasswordForm() {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(changePasswordAction, { status: 'idle' } as ChangePasswordState);
  return (
    <section className="mt-6 rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-sm" aria-labelledby="change-password-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="change-password-title" className="text-xl font-semibold text-gray-900 dark:text-gray-100">Contraseña</h2>
        <button type="button" className={button} aria-expanded={open} aria-controls="change-password-form" onClick={() => setOpen(value => !value)}>
          {open ? 'Cancelar' : 'Cambiar contraseña'}
        </button>
      </div>
      {state.status === 'ok' && <p role="status" className="mt-3 text-sm text-green-700 dark:text-green-400">{DONE}</p>}
      {open && state.status !== 'ok' && (
        <form id="change-password-form" action={action} className="mt-4 grid gap-4 sm:max-w-md">
          <label className={label}><span>Contraseña actual</span>
            <input name="current" type="password" autoComplete="current-password" required className={input} /></label>
          <label className={label}><span>Nueva contraseña (mínimo 8 caracteres)</span>
            <input name="next" type="password" autoComplete="new-password" minLength={8} maxLength={200} required className={input} /></label>
          <label className={label}><span>Confirmar nueva contraseña</span>
            <input name="confirm" type="password" autoComplete="new-password" minLength={8} maxLength={200} required className={input} /></label>
          {state.status === 'error' && state.error && <p role="alert" className="text-sm text-red-700 dark:text-red-400">{MESSAGES[state.error]}</p>}
          <button type="submit" disabled={pending} className={button}>{pending ? 'Guardando…' : 'Guardar nueva contraseña'}</button>
        </form>
      )}
    </section>
  );
}
