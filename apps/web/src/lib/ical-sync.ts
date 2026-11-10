// T-4680: normalización de eventos iCal para un sync idempotente por UID.
// Puro (sin BD) para poder probarlo; la escritura vive en api/ical/sync/route.ts.

type IcalDate = Date & { dateOnly?: boolean };
type IcalEntry = { type?: string; uid?: unknown; recurrenceid?: unknown; status?: unknown; start?: unknown; end?: unknown };
export type FeedEvent = { uid: string; startDate: string; endDate: string };

/** Fecha YYYY-MM-DD. Los eventos de día completo (VALUE=DATE) se crean a medianoche local. */
export function icalDay(value: IcalDate) {
  if (value.dateOnly) {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
  }
  return value.toISOString().slice(0, 10);
}

/** Un calendario válido (aunque vacío) trae VCALENDAR; HTML/errores parsean a {}. */
export function isCalendar(parsed: unknown): parsed is Record<string, IcalEntry> {
  return !!parsed && typeof parsed === 'object'
    && Object.values(parsed as Record<string, IcalEntry>).some(entry => entry?.type === 'VCALENDAR');
}

/**
 * Eventos vigentes del feed, uno por clave UID (+RECURRENCE-ID si existe).
 * Los STATUS:CANCELLED quedan fuera, así el sync los retira del calendario.
 */
export function feedEvents(parsed: Record<string, IcalEntry>): FeedEvent[] {
  const byUid = new Map<string, FeedEvent>();
  for (const entry of Object.values(parsed)) {
    if (!entry || entry.type !== 'VEVENT' || !(entry.start instanceof Date) || Number.isNaN(entry.start.getTime())) continue;
    if (String(entry.status ?? '').toUpperCase() === 'CANCELLED') continue;
    const start = entry.start as IcalDate;
    const end = entry.end instanceof Date && !Number.isNaN(entry.end.getTime()) ? entry.end as IcalDate : start;
    const startDate = icalDay(start), endDate = icalDay(end);
    const baseUid = typeof entry.uid === 'string' && entry.uid.trim() ? entry.uid.trim() : `nouid:${startDate}:${endDate}`;
    const recurrence = entry.recurrenceid instanceof Date ? `|${entry.recurrenceid.toISOString()}` : '';
    byUid.set(baseUid + recurrence, { uid: baseUid + recurrence, startDate, endDate });
  }
  return [...byUid.values()];
}
