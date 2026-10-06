import { fechaDisponible, rangoDisponible, type BookingRange } from './reservationDates';

export const inquiryFields = ['name', 'email', 'phone', 'startDate', 'endDate', 'guests', 'body'] as const;
export type InquiryField = typeof inquiryFields[number];
export type InquiryError = 'nameLength' | 'emailFormat' | 'phoneFormat' | 'startRequired' | 'dateInvalid' | 'startPast' | 'endRequired' | 'endOrder' | 'datesOccupied' | 'guestsRange' | 'messageRequired' | 'availabilityChanged';
export type InquiryErrors = Partial<Record<InquiryField, InquiryError>>;
export type InquiryInput = Record<InquiryField, unknown>;
const string = (value: unknown) => typeof value === 'string' ? value.trim() : '';

export function inquiryToday(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Mexico_City', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const part = (type: string) => parts.find(value => value.type === type)!.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export function inquiryFromFormData(form: FormData): InquiryInput {
  return Object.fromEntries(inquiryFields.map(field => [field, form.get(field)])) as InquiryInput;
}

export function normalizeInquiry(input: InquiryInput) {
  return {
    name: string(input.name), email: string(input.email), phone: string(input.phone),
    startDate: string(input.startDate), endDate: string(input.endDate), body: string(input.body),
    guests: typeof input.guests === 'number' || typeof input.guests === 'string' ? Number(input.guests) : NaN,
  };
}

export function validateInquiry(input: InquiryInput, context: { today: string; maxGuests?: number; bookings?: BookingRange[] }): InquiryErrors {
  const value = normalizeInquiry(input), errors: InquiryErrors = {};
  if (value.name.length < 2 || value.name.length > 100) errors.name = 'nameLength';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email) || value.email.length > 254) errors.email = 'emailFormat';
  const digits = value.phone.replace(/\D/g, '').length;
  if (input.phone != null && typeof input.phone !== 'string' || value.phone &&
      (!/^\+?[\d ]+$/.test(value.phone) || value.phone.length < 7 || value.phone.length > 25 || digits < 7 || digits > 15)) errors.phone = 'phoneFormat';
  const startValid = fechaDisponible(value.startDate, [], '0000-01-01');
  const endValid = fechaDisponible(value.endDate, [], '0000-01-01');
  if (!value.startDate) errors.startDate = 'startRequired';
  else if (!startValid) errors.startDate = 'dateInvalid';
  else if (value.startDate < context.today) errors.startDate = 'startPast';
  if (!value.endDate) errors.endDate = 'endRequired';
  else if (!endValid) errors.endDate = 'dateInvalid';
  else if (startValid && value.endDate <= value.startDate) errors.endDate = 'endOrder';
  if (!errors.startDate && !errors.endDate && context.bookings) {
    if (!fechaDisponible(value.startDate, context.bookings, context.today)) errors.startDate = 'datesOccupied';
    if (!rangoDisponible(value, context.bookings, context.today)) errors.endDate = 'datesOccupied';
  }
  if (!Number.isInteger(value.guests) || value.guests < 1 ||
      context.maxGuests !== undefined && value.guests > context.maxGuests) errors.guests = 'guestsRange';
  if (!value.body) errors.body = 'messageRequired';
  return errors;
}
