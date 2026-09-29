// apps/web/src/components/MessageForm.tsx
'use client';

import { useMemo, useState } from 'react';
import { useFormStatus } from 'react-dom';

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="w-full bg-gray-900 hover:bg-gray-700 text-white font-light tracking-[0.25em] py-4 px-4 transition-colors disabled:opacity-50 uppercase"
    >
      {pending ? 'ENVIANDO...' : 'ENVIAR CONSULTA'}
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

// Cuenta noche por noche (checkout no se cobra)
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
    const day = d.getDay();
    const esFinde = day === 0 || day === 6;
    const hoy = iso(d);

    if (pricing.booked.some(b => hoy >= b.start && hoy < b.end)) choque = true;

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
  const [guests, setGuests] = useState<number>(1);

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
      <div className="text-center text-gray-500 font-light tracking-wide p-8">
        Mensaje enviado. Te contactaremos pronto.
      </div>
    );
  }

  const fechasInvalidas = !!startDate && !!endDate && endDate <= startDate;

  return (
    <form action={handleSubmit} className="space-y-6">
      <input type="hidden" name="propertyId" value={propertyId} />

      {/* ===== DATOS PERSONALES ===== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="name" className="block text-xs tracking-[0.25em] text-gray-400 mb-2 uppercase">
            Nombre
          </label>
          <input
            required
            type="text"
            id="name"
            name="name"
            className="w-full border-b border-gray-300 pb-2 text-gray-800 font-light focus:border-gray-900 focus:outline-none bg-transparent"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-xs tracking-[0.25em] text-gray-400 mb-2 uppercase">
            Email
          </label>
          <input
            required
            type="email"
            id="email"
            name="email"
            className="w-full border-b border-gray-300 pb-2 text-gray-800 font-light focus:border-gray-900 focus:outline-none bg-transparent"
          />
        </div>
        <div>
          <label htmlFor="phone" className="block text-xs tracking-[0.25em] text-gray-400 mb-2 uppercase">
            Teléfono (opcional)
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            className="w-full border-b border-gray-300 pb-2 text-gray-800 font-light focus:border-gray-900 focus:outline-none bg-transparent"
          />
        </div>
      </div>

      {/* ===== FECHAS + HUESPEDES ===== */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label htmlFor="startDate" className="block text-xs tracking-[0.25em] text-gray-400 mb-2 uppercase">
            Llegada
          </label>
          <input
            required
            type="date"
            id="startDate"
            name="startDate"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="w-full border-b border-gray-300 pb-2 text-gray-800 font-light focus:border-gray-900 focus:outline-none bg-transparent"
          />
        </div>
        <div>
          <label htmlFor="endDate" className="block text-xs tracking-[0.25em] text-gray-400 mb-2 uppercase">
            Salida
          </label>
          <input
            required
            type="date"
            id="endDate"
            name="endDate"
            value={endDate}
            min={startDate || undefined}
            onChange={e => setEndDate(e.target.value)}
            className="w-full border-b border-gray-300 pb-2 text-gray-800 font-light focus:border-gray-900 focus:outline-none bg-transparent"
          />
        </div>
        <div>
          <label htmlFor="guests" className="block text-xs tracking-[0.25em] text-gray-400 mb-2 uppercase">
            Nº Huéspedes
          </label>
          <input
            required
            type="number"
            id="guests"
            name="guests"
            min="1"
            max={8}
            value={guests}
            onChange={e => setGuests(Number(e.target.value))}
            className="w-full border-b border-gray-300 pb-2 text-gray-800 font-light focus:border-gray-900 focus:outline-none bg-transparent"
          />
        </div>
        <div>
          <label className="block text-xs tracking-[0.25em] text-gray-400 mb-2 uppercase">
            Precio Total
          </label>
          <div className="border-b border-gray-300 pb-2 text-lg font-light text-gray-800 h-7 flex items-end">
            {cotizacion?.total != null ? (
              `$${cotizacion.total.toLocaleString('es-MX')} MXN`
            ) : startDate && endDate ? (
              <span className="text-gray-400 text-sm">A consultar</span>
            ) : (
              <span className="text-gray-400 text-sm">—</span>
            )}
          </div>
        </div>
      </div>

      {cotizacion?.choque && (
        <p className="text-red-600 text-xs tracking-wide">
          Algunas fechas están ocupadas — revisa el calendario.
        </p>
      )}

      {fechasInvalidas && (
        <p className="text-red-600 text-xs tracking-wide">
          La fecha de salida debe ser posterior a la llegada.
        </p>
      )}

      {/* ===== MENSAJE ===== */}
      <div>
        <label htmlFor="body" className="block text-xs tracking-[0.25em] text-gray-400 mb-2 uppercase">
          Mensaje
        </label>
        <textarea
          required
          id="body"
          name="body"
          rows={3}
          className="w-full border-b border-gray-300 pb-2 text-gray-800 font-light focus:border-gray-900 focus:outline-none bg-transparent resize-none"
        ></textarea>
      </div>

      {status === 'error' && (
        <p className="text-red-600 text-xs tracking-wide">Error al enviar. Intenta de nuevo.</p>
      )}

      <SubmitButton disabled={fechasInvalidas} />
    </form>
  );
}
