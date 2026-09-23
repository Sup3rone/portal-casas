'use client';

import { useMemo, useState } from 'react';
import { useFormStatus } from 'react-dom';

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
    >
      {pending ? 'Enviando...' : 'Enviar Consulta'}
    </button>
  );
}


// --- Tipos de pricing (datos de lectura que pasa la página) ---
export type PricingInfo = {
  base: { weekday: number | null; weekend: number | null };
  seasons: {
    start: string; end: string;
    weekday: number; weekend: number; priority: number;
  }[];
  booked: { start: string; end: string }[];
};

// --- Fecha -> "YYYY-MM-DD" en local (sin desfases UTC) ---
function iso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function addDays(d: Date, n: number): Date {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
}

// Cuenta noches noche por noche (checkout no se cobra)
function calcularCotizacion(startStr: string, endStr: string, pricing: PricingInfo) {
  const start = new Date(startStr + 'T12:00:00');
  const end = new Date(endStr + 'T12:00:00');
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) return null;

  let total = 0;
  let noches = 0;
  let sinPrecio = false;
  let choque = false;

  for (let d = new Date(start); d < end; d = addDays(d, 1)) {
    noches++;
    const day = d.getDay();            // 0=domingo, 6=sábado
    const esFinde = day === 0 || day === 6;
    const hoy = iso(d);

    // Choque con reservas existentes (noche dentro de [start, end) de un booking)
    if (pricing.booked.some(b => hoy >= b.start && hoy < b.end)) choque = true;

    // Temporada con mayor prioridad que cubra esta noche
    const season = pricing.seasons
      .filter(s => hoy >= s.start && hoy <= s.end)
      .sort((a, b) => b.priority - a.priority)[0];

    const precio = season
      ? (esFinde ? season.weekend : season.weekday)
      : (esFinde ? pricing.base.weekend : pricing.base.weekday);

    if (precio == null) sinPrecio = true;
    else total += precio;
  }

  return { total: sinPrecio ? null : total, noches, choque };
}

export default function MessageForm({
  propertyId, locale, pricing,
}: {
  propertyId: string;
  locale: string;
  pricing: PricingInfo;
}) {
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const cotizacion = useMemo(
    () => startDate && endDate ? calcularCotizacion(startDate, endDate, pricing) : null,
    [startDate, endDate, pricing]
  );

  async function handleSubmit(formData: FormData) {
    try {
      const res = await fetch('/api/messages', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Error al enviar');
      setStatus('success');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (err) {
      setStatus('error');
      console.error(err);
    }
  }

  if (status === 'success') {
    return (
      <div className="text-green-600 font-medium p-4 bg-green-50 rounded-lg">
        ¡Mensaje enviado con éxito! Te contactaremos pronto.
      </div>
    );
  }

  const fechasInvalidas = !!startDate && !!endDate && endDate <= startDate;

  return (
    <form action={handleSubmit} className="space-y-4">
      <input type="hidden" name="propertyId" value={propertyId} />

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nombre</label>
        <input required type="text" id="name" name="name" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm p-2 border" />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
        <input required type="email" id="email" name="email" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm p-2 border" />
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Teléfono (opcional)</label>
        <input type="tel" id="phone" name="phone" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm p-2 border" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Llegada</label>
          <input required type="date" id="startDate" name="startDate" value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm p-2 border" />
        </div>
        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">Salida</label>
          <input required type="date" id="endDate" name="endDate" value={endDate}
            min={startDate || undefined}
            onChange={e => setEndDate(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm p-2 border" />
        </div>
      </div>

      {/* 💰 Cotización en vivo */}
      {cotizacion && (
        <div className="rounded-lg bg-purple-50 border border-purple-100 p-3 text-sm">
          {cotizacion.noches > 0 && cotizacion.total != null ? (
            <p className="font-semibold text-purple-700">
              ≈ {cotizacion.noches} {cotizacion.noches === 1 ? 'noche' : 'noches'} · ${(cotizacion.total).toLocaleString('es-MX')} MXN
              <span className="ml-1 font-normal text-gray-500">(estimado, sujeto a confirmación)</span>
            </p>
          ) : cotizacion.noches > 0 ? (
            <p className="text-gray-600">Precio a consultar para estas fechas.</p>
          ) : null}
          {cotizacion.choque && (
            <p className="mt-1 text-red-600">
              ⚠️ Algunas de estas fechas ya están ocupadas — revisa el calendario.
            </p>
          )}
        </div>
      )}

      {fechasInvalidas && (
        <p className="text-red-600 text-sm">La fecha de salida debe ser posterior a la llegada.</p>
      )}

      <div>
        <label htmlFor="body" className="block text-sm font-medium text-gray-700">Mensaje</label>
        <textarea required id="body" name="body" rows={4} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm p-2 border"></textarea>
      </div>

      {status === 'error' && (
        <div className="text-red-600 text-sm">Hubo un error al enviar. Intenta de nuevo.</div>
      )}

      <SubmitButton disabled={fechasInvalidas} />
    </form>
  );
}
