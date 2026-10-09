import { fechaDisponible } from './reservationDates';
import { inquiryToday } from './inquiry-validation';

export type PropertySearchParams = { guests?: string | string[]; start?: string | string[]; end?: string | string[] };
export function propertySearch(query: PropertySearchParams) {
  const active = [query.guests, query.start, query.end].some(value => value !== undefined && value !== '');
  const invalidValues = [query.guests, query.start, query.end].some(value => Array.isArray(value));
  const guests = typeof query.guests === 'string' && query.guests ? Number(query.guests) : undefined;
  const start = typeof query.start === 'string' ? query.start : '';
  const end = typeof query.end === 'string' ? query.end : '';
  const invalidGuests = guests !== undefined && (!/^\d+$/.test(String(query.guests)) || !Number.isInteger(guests) || guests < 1 || guests > 2147483647);
  const invalidDates = Boolean(start || end) && (!fechaDisponible(start, [], inquiryToday()) || !fechaDisponible(end, [], inquiryToday()) || end <= start);
  return { active, invalid: invalidValues || invalidGuests || invalidDates, guests, start, end };
}
