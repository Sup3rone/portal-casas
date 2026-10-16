import { fechaDisponible } from './reservationDates';
import { inquiryToday } from './inquiry-validation';
import { DESTINATION_STATES, citiesByState, normalizeDestination } from './destinations';

export type PropertySearchParams = { guests?: string | string[]; start?: string | string[]; end?: string | string[]; state?: string | string[]; destinationCity?: string | string[] };
export function propertySearch(query: PropertySearchParams) {
  const active = [query.guests, query.start, query.end, query.state, query.destinationCity].some(value => value !== undefined && value !== '');
  const invalidValues = [query.guests, query.start, query.end, query.state, query.destinationCity].some(value => Array.isArray(value));
  const requestedState = typeof query.state === 'string' ? normalizeDestination(query.state) : '';
  const requestedCity = typeof query.destinationCity === 'string' ? normalizeDestination(query.destinationCity) : '';
  const state = DESTINATION_STATES.find(name => normalizeDestination(name) === requestedState);
  const destinationCity = state ? citiesByState(state).find(name => normalizeDestination(name) === requestedCity) : undefined;
  const invalidLocation = Boolean(requestedState && !state || requestedCity && !destinationCity);
  const guests = typeof query.guests === 'string' && query.guests ? Number(query.guests) : undefined;
  const start = typeof query.start === 'string' ? query.start : '';
  const end = typeof query.end === 'string' ? query.end : '';
  const invalidGuests = guests !== undefined && (!/^\d+$/.test(String(query.guests)) || !Number.isInteger(guests) || guests < 1 || guests > 2147483647);
  const invalidDates = Boolean(start || end) && (!fechaDisponible(start, [], inquiryToday()) || !fechaDisponible(end, [], inquiryToday()) || end <= start);
  return { active, invalid: invalidValues || invalidLocation || invalidGuests || invalidDates, guests, start, end, state, destinationCity };
}
