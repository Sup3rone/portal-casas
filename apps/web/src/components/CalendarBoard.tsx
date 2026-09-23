'use client';

import { useState } from 'react';

type Prop = { id: string; slug: string; title: string | null };
type Booking = { propertyId: string; start: string; end: string; source: string };

const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const SOURCE_STYLE: Record<string, { bg: string; label: string }> = {
  manual:  { bg: 'bg-purple-600 text-white',      label: 'Manual (portal)' },
  airbnb:  { bg: 'bg-rose-500 text-white',        label: 'Airbnb' },
  google:  { bg: 'bg-blue-500 text-white',        label: 'Google Calendar' },
};

function iso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function bookingDelDia(bs: Booking[], propertyId: string, dia: string) {
  // Convención de la casa: checkout no se cobra → noches en [start, end)
  return bs.find(b => b.propertyId === propertyId && dia >= b.start && dia < b.end);
}

export default function CalendarBoard({ propiedades, bookings }: { propiedades: Prop[]; bookings: Booking[] }) {
  const hoy = new Date();
  const [mes, setMes] = useState(hoy.getMonth());
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const nombreMes = new Date(anio, mes, 1).toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });

  function cambiarMes(delta: number) {
    let m = mes + delta, a = anio;
    if (m < 0) { m = 11; a--; }
    if (m > 11) { m = 0; a++; }
    setMes(m); setAnio(a);
  }

  // Matriz de días del mes (semana empieza lunes, como Dios manda)
  const primerDia = new Date(anio, mes, 1);
  const offset = (primerDia.getDay() + 6) % 7; // lunes=0
  const diasDelMes = new Date(anio, mes + 1, 0).getDate();
  const celdas: (Date | null)[] = [
    ...Array(offset).fill(null),
    ...Array.from({ length: diasDelMes }, (_, i) => new Date(anio, mes, i + 1)),
  ];

  async function sincronizar() {
    setSyncing(true); setSyncMsg(null);
    try {
      const res = await fetch('/api/ical/sync', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      setSyncMsg(`✅ ${data.message ?? 'Sincronizado'} — recargando...`);
      setTimeout(() => window.location.reload(), 1500);
    } catch (e) {
      setSyncMsg(`❌ ${e instanceof Error ? e.message : 'Error al sincronizar'}`);
    } finally {
      setSyncing(false);
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Calendario de ocupación</h1>
        <button
          onClick={sincronizar}
          disabled={syncing}
          className="rounded-full bg-rose-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-rose-600 disabled:opacity-50"
        >
          {syncing ? '🔄 Sincronizando...' : '🔄 Sincronizar Airbnb (iCal)'}
        </button>
      </div>
      {syncMsg && <p className="mb-4 text-sm font-medium">{syncMsg}</p>}

      {/* Controles de mes */}
      <div className="mb-8 flex items-center justify-center gap-6">
        <button onClick={() => cambiarMes(-1)} className="rounded-lg border px-4 py-2 hover:bg-gray-50">←</button>
        <h2 className="w-56 text-center text-xl font-semibold capitalize">{nombreMes}</h2>
        <button onClick={() => cambiarMes(1)} className="rounded-lg border px-4 py-2 hover:bg-gray-50">→</button>
      </div>

      {/* Leyenda */}
      <div className="mb-6 flex flex-wrap gap-4 text-xs">
        {Object.entries(SOURCE_STYLE).map(([src, s]) => (
          <span key={src} className="flex items-center gap-1">
            <span className={`inline-block h-3 w-3 rounded ${s.bg}`} /> {s.label}
          </span>
        ))}
      </div>

      <div className="space-y-10">
        {propiedades.map(p => (
          <section key={p.id} className="rounded-2xl bg-white p-6 shadow-sm border">
            <h3 className="mb-4 text-lg font-bold">{p.title ?? p.slug}</h3>
            <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500">
              {DIAS.map(d => <div key={d}>{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {celdas.map((d, i) => {
                if (!d) return <div key={`e${i}`} />;
                const dia = iso(d);
                const booking = bookingDelDia(bookings, p.id, dia);
                const style = booking ? SOURCE_STYLE[booking.source] ?? { bg: 'bg-gray-300 text-gray-800', label: booking.source } : null;
                return (
                  <div
                    key={dia}
                    title={booking ? `${style!.label}: ${booking.start} → ${booking.end}` : 'Libre'}
                    className={`flex h-10 items-center justify-center rounded-lg text-sm font-medium ${
                      style ? style.bg : 'bg-gray-50 text-gray-400'
                    }`}
                  >
                    {d.getDate()}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
