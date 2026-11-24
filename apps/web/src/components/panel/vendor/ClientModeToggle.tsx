'use client';
// T-5208: «Modo cliente» — al enseñar la pantalla al cliente, oculta el bloque «Solo para ti» (comisión).
// Es estado de la pantalla (ni URL ni cookie): arranca APAGADO, como pidió Gabriel («se muestra todo igual que hoy»).
// No es seguridad: lo oculto es del propio vendedor; lo que el cliente no debe ver nunca va en el texto de WhatsApp.
import { useState, type ReactNode } from 'react';

export function ClientModeView({ on, onToggle, label, hint, children }: { on: boolean; onToggle: () => void; label: string; hint: string; children: ReactNode }) {
  return <div className="space-y-3">
    <button type="button" aria-pressed={on} onClick={onToggle}
      className="flex min-h-12 w-full items-center justify-between gap-3 rounded-xl border border-gray-200 px-4 text-left dark:border-gray-700">
      <span>
        <span className="block font-semibold">{label}</span>
        <span className="block text-xs text-gray-600 dark:text-gray-300">{hint}</span>
      </span>
      <span aria-hidden="true" className={`relative h-7 w-12 shrink-0 rounded-full transition ${on ? 'bg-green-700' : 'bg-gray-300 dark:bg-gray-600'}`}>
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${on ? 'left-6' : 'left-1'}`} />
      </span>
    </button>
    {!on && children}
  </div>;
}

export default function ClientModeToggle(props: { label: string; hint: string; children: ReactNode }) {
  const [on, setOn] = useState(false);
  return <ClientModeView on={on} onToggle={() => setOn(value => !value)} {...props} />;
}
