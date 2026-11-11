import 'server-only';
// T-4739 (añadido): alta de calendarios iCal por propiedad desde el panel (antes solo por SQL, ver
// docs/DIAGNOSTICO-ICAL-SYNC.md §8). La sincronización sigue siendo la de T-4680 (api/ical/sync).
// Solo ADMIN o el colaborador dueño (managedProperties, revalidado dentro de cada query).
import { db, bookings, icalFeeds, properties } from '@portal/db';
import { and, count, eq, isNotNull, or, sql } from 'drizzle-orm';
import { AccessError, managedProperties, type PropertyManager } from './property-access';
import { PanelValidationError } from './panel-validation';

export const icalSources = ['airbnb', 'booking', 'vrbo', 'google', 'other'] as const;
export type IcalSource = typeof icalSources[number];
export const MAX_FEEDS_PER_PROPERTY = 5;

/**
 * Solo https y nombres de host públicos: el servidor descarga esta URL (node-ical), así que se bloquean
 * localhost, IPs literales, .local/.internal y puertos no estándar (evita usarlo para sondear la red interna).
 */
export function validateIcalUrl(input: unknown) {
  if (typeof input !== 'string') return null;
  const value = input.trim().replace(/^webcal:\/\//i, 'https://'); // Apple/Google ofrecen webcal://
  if (!value || value.length > 2000) return null;
  let url: URL;
  try { url = new URL(value); } catch { return null; }
  const host = url.hostname.toLowerCase();
  if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443')) return null;
  if (!host.includes('.') || host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal')) return null;
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.startsWith('[')) return null; // IPv4/IPv6 literales
  return url.toString();
}

export function validateFeedInput(input: unknown) {
  const value = input && typeof input === 'object' && !Array.isArray(input) ? input as Record<string, unknown> : null;
  const url = validateIcalUrl(value?.url);
  if (!url) throw new PanelValidationError('invalidIcalUrl');
  const source = icalSources.includes(value?.source as IcalSource) ? value!.source as IcalSource : 'other';
  return { url, source };
}

/** Origen que se guarda en Booking.source al sincronizar (feeds antiguos 'MANUAL' siguen como 'google'). */
export function bookingSourceFor(feedSource: string) {
  return feedSource === 'airbnb' || feedSource === 'booking' || feedSource === 'vrbo' || feedSource === 'other' ? feedSource : 'google';
}

async function assertManaged(propertyId: string, manager: PropertyManager) {
  const [row] = await db.select({ id: properties.id }).from(properties).where(and(eq(properties.id, propertyId), managedProperties(manager))).limit(1);
  if (!row) throw new AccessError(404);
}

export async function listIcalFeeds(propertyId: string, manager: PropertyManager) {
  await assertManaged(propertyId, manager);
  const rows = await db.select({ id: icalFeeds.id, url: icalFeeds.url, source: icalFeeds.source,
    lastSyncedAt: icalFeeds.lastSyncedAt, lastAttemptAt: icalFeeds.lastAttemptAt, lastError: icalFeeds.lastError,
    imported: sql<number>`(select count(*) from "Booking" b where b."icalFeedId" = "IcalFeed"."id")` })
    .from(icalFeeds).where(eq(icalFeeds.propertyId, propertyId)).orderBy(icalFeeds.id);
  return rows.map(row => ({ ...row, imported: Number(row.imported),
    lastSyncedAt: row.lastSyncedAt ? new Date(row.lastSyncedAt).toISOString() : null, lastAttemptAt: row.lastAttemptAt ? new Date(row.lastAttemptAt).toISOString() : null }));
}

export async function addIcalFeed(propertyId: string, input: unknown, manager: PropertyManager) {
  const value = validateFeedInput(input);
  const feeds = await listIcalFeeds(propertyId, manager); // también valida dueño
  if (feeds.length >= MAX_FEEDS_PER_PROPERTY) throw new PanelValidationError('validation');
  if (feeds.some(feed => feed.url === value.url)) throw Object.assign(new Error('duplicate'), { cause: { code: '23505' } });
  const [row] = await db.insert(icalFeeds).values({ id: crypto.randomUUID(), propertyId, ...value, lastAttemptAt: null, lastSyncedAt: null, lastError: null }).returning({ id: icalFeeds.id });
  return row;
}

/** Al crear una propiedad: inserta su primer calendario (ya validado con validateFeedInput, sin chequeo de dueño). */
export async function insertFirstIcalFeed(propertyId: string, value: { url: string; source: IcalSource }) {
  const [row] = await db.insert(icalFeeds).values({ id: crypto.randomUUID(), propertyId, ...value, lastAttemptAt: null, lastSyncedAt: null, lastError: null }).returning({ id: icalFeeds.id });
  return row;
}

export async function updateIcalFeed(propertyId: string, feedId: string, input: unknown, manager: PropertyManager) {
  const value = validateFeedInput(input);
  await assertManaged(propertyId, manager);
  const [row] = await db.update(icalFeeds).set(value)
    .where(and(eq(icalFeeds.id, feedId), eq(icalFeeds.propertyId, propertyId))).returning({ id: icalFeeds.id });
  if (!row) throw new AccessError(404);
  return row;
}

/**
 * Quitar un calendario borra el feed y las fechas que importó (son espejo del calendario externo), PERO solo si
 * ninguna de ellas tiene datos capturados en el panel (desglose o atribución de referido). En ese caso → 409 y
 * no se toca nada: «nada se borra» de lo que el dueño capturó.
 */
export async function removeIcalFeed(propertyId: string, feedId: string, manager: PropertyManager) {
  await assertManaged(propertyId, manager);
  const scope = and(eq(bookings.icalFeedId, feedId), eq(bookings.propertyId, propertyId));
  const [{ captured }] = await db.select({ captured: count() }).from(bookings).where(and(scope, or(
    isNotNull(bookings.rentAmount), isNotNull(bookings.cleaningCost), isNotNull(bookings.taxes), isNotNull(bookings.referredByPartnerId))));
  if (Number(captured) > 0) throw Object.assign(new Error('feed with captured data'), { cause: { code: '23505' } });
  const [feed] = await db.select({ id: icalFeeds.id }).from(icalFeeds).where(and(eq(icalFeeds.id, feedId), eq(icalFeeds.propertyId, propertyId))).limit(1);
  if (!feed) throw new AccessError(404);
  const removed = await db.delete(bookings).where(scope).returning({ id: bookings.id });
  await db.delete(icalFeeds).where(and(eq(icalFeeds.id, feedId), eq(icalFeeds.propertyId, propertyId)));
  return { success: true, removedDates: removed.length };
}
