import type { properties } from '@portal/db';

export class PanelValidationError extends Error {}
export function objectBody(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new PanelValidationError('validation');
  return value as Record<string, unknown>;
}
export function text(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) throw new PanelValidationError('validation');
  return value.trim();
}
export function number(value: unknown, minimum = 0, integer = false, nullable = false): number | null {
  if (nullable && value === null) return null;
  if (typeof value !== 'number' || !Number.isFinite(value) || value < minimum ||
      (integer && (!Number.isInteger(value) || value > 2147483647))) throw new PanelValidationError('validation');
  return value;
}
export function dateRange(body: Record<string, unknown>) {
  const startDate = text(body.startDate), endDate = text(body.endDate);
  for (const date of [startDate, endDate]) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) ||
        new Date(date).toISOString().slice(0, 10) !== date) throw new PanelValidationError('validation');
  }
  if (endDate <= startDate) throw new PanelValidationError('validation');
  return { startDate, endDate };
}
const texts = ['titleEs', 'titleEn', 'titleFr', 'descEs', 'descEn', 'descFr', 'address', 'city'] as const;
const integers = ['maxGuests', 'bedrooms'] as const;
const prices = ['baseWeekdayPrice', 'baseWeekendPrice'] as const;
const allowed = new Set<string>([...texts, ...integers, ...prices, 'bathrooms', 'lat', 'lng', 'published']);
export function propertyInput(value: unknown, creating = false) {
  const body = objectBody(value);
  if (!Object.keys(body).length || Object.keys(body).some(key => !allowed.has(key))) throw new PanelValidationError('validation');
  const changes: Partial<typeof properties.$inferInsert> = {};
  for (const key of texts) if (key in body || creating) changes[key] = text(body[key]);
  for (const key of integers) if (key in body || creating) changes[key] = number(body[key], key === 'maxGuests' ? 1 : 0, true)!;
  for (const key of prices) if (key in body) changes[key] = number(body[key], 0, true, true);
  for (const key of ['bathrooms', 'lat', 'lng'] as const) {
    if (key in body || (creating && key === 'bathrooms')) {
      const value = number(body[key], key === 'bathrooms' ? 0 : -180, false, key !== 'bathrooms');
      if (value !== null && (key === 'lat' && Math.abs(value) > 90 || key === 'lng' && Math.abs(value) > 180)) throw new PanelValidationError('validation');
      changes[key] = value!;
    }
  }
  if ('published' in body) {
    if (typeof body.published !== 'boolean' || creating && body.published) throw new PanelValidationError('validation');
    changes.published = body.published;
  }
  return changes;
}

export function resourceInput(resource: string, body: Record<string, unknown>) {
  const fields: Record<string, string[]> = {
    rates: ['name', 'startDate', 'endDate', 'weekdayPrice', 'weekendPrice', 'priority'],
    blocks: ['startDate', 'endDate'], media: ['url', 'category', 'order'],
  };
  if (!Object.hasOwn(fields, resource) || Object.keys(body).some(key => !fields[resource].includes(key))) throw new PanelValidationError('validation');
  if (resource === 'rates') return {
    ...dateRange(body), name: text(body.name),
    weekdayPrice: number(body.weekdayPrice, 0, true)!, weekendPrice: number(body.weekendPrice, 0, true)!,
    priority: number(body.priority ?? 0, -2147483648, true)!,
  };
  if (resource === 'blocks') return dateRange(body);
  if (resource === 'media') {
    const url = text(body.url);
    const local = url.startsWith('/') && !url.startsWith('//') && !url.includes('\\');
    if (!local) {
      try { if (new URL(url).protocol !== 'https:') throw new Error(); }
      catch { throw new PanelValidationError('validation'); }
    }
    if (!['principal', 'habitaciones', 'amenidades', 'lugar'].includes(String(body.category))) throw new PanelValidationError('validation');
    return { url, category: text(body.category), order: number(body.order ?? 0, 0, true)!, type: 'PHOTO' as const };
  }
  throw new PanelValidationError('validation');
}
