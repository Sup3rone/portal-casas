// T-5205 (app del vendedor, pantalla 2): un mes de la casa para enseñarlo al cliente. Lo ocupado va tachado, no
// solo de color. Regla de siempre: una estancia ocupa [start, end); la noche de salida queda libre.
import { Link } from '@/i18n/navigation';

export type DayState = 'free' | 'occupied' | 'selected' | 'checkout';
export type MonthCell = { day: number | null; state: DayState };
type Range = { start: string; end: string };

const iso = (year: number, month: number, day: number) => `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

/** Celdas de un mes (month 1-12) con semana lunes-primero: huecos delante (day null) y un estado por día. */
export function monthCells(year: number, month: number, occupied: Range[], selected?: Range): MonthCell[] {
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const lead = (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7;
  const cells: MonthCell[] = Array.from({ length: lead }, () => ({ day: null, state: 'free' }));
  for (let day = 1; day <= days; day++) {
    const date = iso(year, month, day);
    const state: DayState = occupied.some(range => date >= range.start && date < range.end) ? 'occupied'
      : selected && date >= selected.start && date < selected.end ? 'selected'
      : selected && date === selected.end ? 'checkout'
      : 'free';
    cells.push({ day, state });
  }
  return cells;
}

const tone: Record<DayState, string> = {
  free: 'bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100',
  occupied: 'bg-gray-200 text-gray-500 line-through decoration-2 dark:bg-gray-700 dark:text-gray-400',
  selected: 'bg-green-700 font-semibold text-white',
  checkout: 'bg-green-100 font-semibold text-green-900 ring-2 ring-inset ring-green-700 dark:bg-green-950 dark:text-green-200',
};

export type MonthLabels = { title: string; weekdays: string[]; prev: string; next: string; legend: Record<DayState, string> };

export default function MonthAvailability({ cells, labels, prevHref, nextHref }: { cells: MonthCell[]; labels: MonthLabels; prevHref: string; nextHref: string }) {
  const arrow = 'flex h-11 w-11 items-center justify-center rounded-full border border-gray-300 text-xl dark:border-gray-600';
  return <section aria-label={labels.title} className="space-y-3 rounded-2xl border border-gray-200 p-4 dark:border-gray-700">
    <div className="flex items-center justify-between gap-3">
      <Link href={prevHref} aria-label={labels.prev} className={arrow}>‹</Link>
      <h2 className="text-lg font-semibold capitalize">{labels.title}</h2>
      <Link href={nextHref} aria-label={labels.next} className={arrow}>›</Link>
    </div>
    <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold uppercase text-gray-500 dark:text-gray-400" aria-hidden="true">
      {labels.weekdays.map(name => <span key={name}>{name}</span>)}
    </div>
    <ol className="grid grid-cols-7 gap-1">
      {cells.map((cell, index) => cell.day === null
        ? <li key={'pad' + index} aria-hidden="true" />
        : <li key={cell.day} data-day={cell.day} data-state={cell.state} aria-label={`${cell.day}: ${labels.legend[cell.state]}`}
            className={`flex aspect-square min-h-10 items-center justify-center rounded-lg text-base ${tone[cell.state]}`}>{cell.day}</li>)}
    </ol>
    <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
      {(Object.keys(tone) as DayState[]).map(state => <li key={state} className="flex items-center gap-2">
        <span aria-hidden="true" className={`inline-flex h-6 w-6 items-center justify-center rounded text-xs ${tone[state]}`}>{state === 'occupied' ? '7' : ''}</span>
        {labels.legend[state]}
      </li>)}
    </ul>
  </section>;
}
