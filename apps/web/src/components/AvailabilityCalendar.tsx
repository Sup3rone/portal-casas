'use client';

import { useState } from 'react';

// Un día está ocupado si cae dentro de algún rango [start, end) — la noche del día de salida NO cuenta (convención Airbnb)
function diaOcupado(
  fechaISO: string,
  ranges: { startDate: string; endDate: string }[]
): boolean {
  return ranges.some(({ startDate, endDate }) => fechaISO >= startDate && fechaISO < endDate);
}

export default function AvailabilityCalendar({
  bookings,
}: {
  bookings: { startDate: string; endDate: string }[];
}) {
  const hoy = new Date();
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [mes, setMes] = useState(hoy.getMonth()); // 0-11

  const primerDia = new Date(anio, mes, 1);
  const ultimoDia = new Date(anio, mes + 1, 0).getDate();

  // Día de la semana del día 1 (Lu=0...Do=6, formato europeo)
  const offset = (primerDia.getDay() + 6) % 7;

  const nombresMeses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  function mesAnterior() {
    if (mes === 0) { setMes(11); setAnio(a => a - 1); } else setMes(m => m - 1);
  }
  function mesSiguiente() {
    if (mes === 11) { setMes(0); setAnio(a => a + 1); } else setMes(m => m + 1);
  }

  // Construir la grilla del mes
  const celdas: (string | null)[] = [];
  for (let i = 0; i < offset; i++) celdas.push(null);
  for (let d = 1; d <= ultimoDia; d++) {
    const iso = `${anio}-${String(mes + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    celdas.push(iso);
  }

  const hoyISO = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;

  return (
    <div>
      {/* Cabecera con navegación */}
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={mesAnterior}
          className="rounded-full p-2 text-gray-600 hover:bg-gray-100"
          aria-label="Mes anterior"
        >
          ◀
        </button>
        <h3 className="text-lg font-bold">
          {nombresMeses[mes]} {anio}
        </h3>
        <button
          onClick={mesSiguiente}
          className="rounded-full p-2 text-gray-600 hover:bg-gray-100"
          aria-label="Mes siguiente"
        >
          ▶
        </button>
      </div>

      {/* Grilla del calendario */}
      <div className="grid grid-cols-7 gap-1 text-center text-sm">
        {['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'].map((d) => (
          <div key={d} className="py-2 text-xs font-semibold text-gray-500">{d}</div>
        ))}

        {celdas.map((iso, i) => {
          if (!iso) return <div key={`v-${i}`} />;
          const ocupado = diaOcupado(iso, bookings);
          const esPasado = iso < hoyISO;

          return (
            <div
              key={iso}
              className={`aspect-square flex items-center justify-center rounded-lg ${
                esPasado
                  ? 'text-gray-300'
                  : ocupado
                    ? 'bg-red-100 text-red-400 line-through'
                    : 'bg-green-50 text-green-700 font-medium'
              }`}
            >
              {Number(iso.slice(8))}
            </div>
          );
        })}
      </div>

      {/* Leyenda */}
      <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-green-50 ring-1 ring-green-200" /> Disponible
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-red-100" /> Ocupado
        </span>
      </div>
    </div>
  );
}
