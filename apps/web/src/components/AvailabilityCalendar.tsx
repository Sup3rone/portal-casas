'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useReservationDates } from './ReservationDatesProvider';
import { fechaDisponible, rangoDisponible, seleccionarFecha } from '@/lib/reservationDates';

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
  const locale = useLocale();
  const t = useTranslations();
  const { dates, setDates } = useReservationDates();
  const hoy = new Date();
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [mes, setMes] = useState(hoy.getMonth()); // 0-11

  const primerDia = new Date(anio, mes, 1);
  const ultimoDia = new Date(anio, mes + 1, 0).getDate();

  // Día de la semana del día 1 (Lu=0...Do=6, formato europeo)
  const offset = (primerDia.getDay() + 6) % 7;

  const mesVisible = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(primerDia);
  const formatoDia = new Intl.DateTimeFormat(locale, { weekday: 'short' });
  const diasSemana = Array.from({ length: 7 }, (_, i) => formatoDia.format(new Date(2026, 0, 5 + i)));
  const formatoFecha = new Intl.DateTimeFormat(locale, { dateStyle: 'full' });

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
          className="rounded-full p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label={t('details.calendar.mesAnterior')}
        >
          ◀
        </button>
        <h3 className="text-lg font-bold">
          {mesVisible}
        </h3>
        <button
          onClick={mesSiguiente}
          className="rounded-full p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label={t('details.calendar.mesSiguiente')}
        >
          ▶
        </button>
      </div>

      {/* Grilla del calendario */}
      <div className="grid grid-cols-7 gap-1 text-center text-sm">
        {diasSemana.map((d) => (
          <div key={d} className="py-2 text-xs font-semibold text-gray-500 dark:text-gray-400">{d}</div>
        ))}

        {celdas.map((iso, i) => {
          if (!iso) return <div key={`v-${i}`} />;
          const ocupado = diaOcupado(iso, bookings);
          const esPasado = iso < hoyISO;
          const seleccionado = dates.endDate
            ? rangoDisponible(dates, bookings, hoyISO) && iso >= dates.startDate && iso <= dates.endDate
            : iso === dates.startDate && fechaDisponible(iso, bookings, hoyISO);

          return (
            <button
              key={iso}
              type="button"
              disabled={ocupado || esPasado}
              aria-label={formatoFecha.format(new Date(iso + 'T12:00:00'))}
              aria-pressed={seleccionado}
              onClick={() => setDates(actual => seleccionarFecha(actual, iso, bookings, hoyISO))}
              className={`aspect-square flex items-center justify-center rounded-lg ${
                esPasado
                  ? 'text-gray-300 dark:text-gray-600'
                  : ocupado
                    ? 'bg-red-100 dark:bg-red-900/50 text-red-400 line-through'
                    : seleccionado
                      ? 'bg-green-700 text-white dark:text-gray-100 font-medium'
                      : 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400 font-medium'
              }${seleccionado ? ' ring-2 ring-green-700' : ''}`}
            >
              {Number(iso.slice(8))}
            </button>
          );
        })}
      </div>

      {/* Leyenda */}
      <div className="mt-4 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-green-50 dark:bg-green-950 ring-1 ring-green-200 dark:ring-green-800" /> {t('common.disponible')}
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-red-100 dark:bg-red-900/50" /> {t('common.ocupado')}
        </span>
      </div>
    </div>
  );
}
