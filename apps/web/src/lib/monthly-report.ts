// T-4739: reporte mensual de comisiones del colaborador — lógica pura (sin BD), compartida por la página,
// el Excel y el cron, para que los tres den exactamente las mismas cifras.
//
// Mes y zona horaria:
// - Las fechas de reserva son fechas CIVILES ('YYYY-MM-DD', columna date): no tienen hora ni zona.
//   El mes de una reserva sale del texto de su fecha; nunca se convierte a UTC ni a la hora local del servidor.
// - Lo único que depende de la zona es «qué día es hoy» para el cron (mes anterior): se usa
//   America/Mexico_City vía inquiryToday(). México no tiene horario de verano desde 2022 (UTC−6 fijo
//   en el centro), y el cron corre el día 1 a las 13:00 UTC = 07:00 en Ciudad de México.
//
// Pertenencia (decisión del usuario, 10-11-2026):
// - Una reserva cuenta en el MES DE ENTRADA con TODOS sus importes.
// - Si cruza al mes siguiente, se marca («N de M noches en este mes · K en el siguiente»).
// - En el mes siguiente aparece como «continúa de», con importes en 0 para no duplicar.
import { breakdownTotal, commissionAmount } from './booking-breakdown';

const MONTH = /^(\d{4})-(0[1-9]|1[0-2])$/;
const DAY_MS = 86_400_000;
const utc = (date: string) => Date.parse(`${date}T00:00:00Z`);

export function isMonth(value: unknown): value is string { return typeof value === 'string' && MONTH.test(value); }

/** Primer día del mes y primer día del mes siguiente (exclusivo). */
export function monthRange(month: string) {
  const [, y, m] = MONTH.exec(month)!;
  const year = Number(y), index = Number(m);
  const next = index === 12 ? `${year + 1}-01` : `${year}-${String(index + 1).padStart(2, '0')}`;
  return { start: `${month}-01`, end: `${next}-01`, next };
}

/** Mes anterior al de una fecha civil (hoy en MX → mes que se reporta el día 1). */
export function previousMonth(today: string) {
  const [y, m] = today.split('-').map(Number);
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`;
}

/** Noches de [start, end) que caen dentro del mes (el día de salida no es noche). */
export function nightsInMonth(startDate: string, endDate: string, month: string) {
  const { start, end } = monthRange(month);
  const from = Math.max(utc(startDate), utc(start)), to = Math.min(utc(endDate), utc(end));
  return Math.max(0, Math.round((to - from) / DAY_MS));
}
const totalNights = (startDate: string, endDate: string) => Math.max(0, Math.round((utc(endDate) - utc(startDate)) / DAY_MS));

export type ReportBooking = {
  id: string; propertyId: string; propertyTitle: string; startDate: string; endDate: string;
  guestName: string | null; referredBy: string | null;
  rentAmount: string | null; cleaningCost: string | null; taxes: string | null; commissionPercent: string | null;
};
export type ReportLine = ReportBooking & {
  kind: 'entry' | 'continuation';
  nights: number; nightsThisMonth: number; nightsOtherMonths: number;
  /** Mes donde se cuentan los importes (entrada); en 'continuation' es el mes de origen. */
  countedIn: string;
  total: string | null; commission: string | null;
};
export type ReportTotals = { rentAmount: string; cleaningCost: string; taxes: string; total: string; commission: string; bookings: number };
export type PropertyGroup = { propertyId: string; propertyTitle: string; lines: ReportLine[]; totals: ReportTotals };
export type MonthlyReport = { month: string; groups: PropertyGroup[]; totals: ReportTotals };

const sum = (values: (string | null)[]) => breakdownTotal(values) ?? '0.00';
function totalsOf(lines: ReportLine[]): ReportTotals {
  const entries = lines.filter(line => line.kind === 'entry'); // las continuaciones no suman (importes en 0)
  return {
    rentAmount: sum(entries.map(l => l.rentAmount)), cleaningCost: sum(entries.map(l => l.cleaningCost)),
    taxes: sum(entries.map(l => l.taxes)), total: sum(entries.map(l => l.total)), commission: sum(entries.map(l => l.commission)),
    bookings: entries.length,
  };
}

/** Recibe las reservas que tocan el mes (startDate < fin y endDate > inicio) y arma grupos y totales. */
export function buildMonthlyReport(month: string, rows: ReportBooking[]): MonthlyReport {
  const { start, end } = monthRange(month);
  const lines: ReportLine[] = rows
    .filter(row => row.startDate < end && row.endDate > start && nightsInMonth(row.startDate, row.endDate, month) > 0)
    .map(row => {
      const entry = row.startDate >= start; // entró en este mes
      const nights = totalNights(row.startDate, row.endDate), nightsThisMonth = nightsInMonth(row.startDate, row.endDate, month);
      const total = entry ? breakdownTotal([row.rentAmount, row.cleaningCost, row.taxes]) : null;
      const commission = entry && row.commissionPercent != null ? commissionAmount(row.rentAmount, row.commissionPercent) : null;
      return entry
        ? { ...row, kind: 'entry' as const, nights, nightsThisMonth, nightsOtherMonths: nights - nightsThisMonth, countedIn: month, total, commission }
        : { ...row, rentAmount: null, cleaningCost: null, taxes: null, kind: 'continuation' as const, nights, nightsThisMonth,
            nightsOtherMonths: nights - nightsThisMonth, countedIn: row.startDate.slice(0, 7), total: null, commission: null };
    })
    .sort((a, b) => a.propertyTitle.localeCompare(b.propertyTitle, 'es') || a.startDate.localeCompare(b.startDate) || a.id.localeCompare(b.id));
  const byProperty = new Map<string, ReportLine[]>();
  for (const line of lines) byProperty.set(line.propertyId, [...(byProperty.get(line.propertyId) ?? []), line]);
  const groups = [...byProperty.values()].map(group => ({ propertyId: group[0].propertyId, propertyTitle: group[0].propertyTitle, lines: group, totals: totalsOf(group) }));
  return { month, groups, totals: totalsOf(lines) };
}
