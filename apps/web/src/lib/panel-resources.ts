import 'server-only';
import { db, properties, seasonRates, bookings, media, blockDates } from '@portal/db';
import { and, asc, eq } from 'drizzle-orm';
import { managedResource, type PropertyManager } from './property-access';

export async function propertyResources(id: string, manager: PropertyManager) {
  const [rates, dates, photos] = await Promise.all([
    db.select().from(seasonRates).where(and(eq(seasonRates.propertyId, id), managedResource(seasonRates.propertyId, manager))).orderBy(asc(seasonRates.startDate)),
    db.select({ id: bookings.id, startDate: bookings.startDate, endDate: bookings.endDate, source: bookings.source })
      .from(bookings).where(and(eq(bookings.propertyId, id), managedResource(bookings.propertyId, manager))).orderBy(asc(bookings.startDate)),
    db.select().from(media).where(and(eq(media.propertyId, id), managedResource(media.propertyId, manager))).orderBy(asc(media.order)),
  ]);
  const blocks = await db.select({ id: blockDates.id, startDate: blockDates.startDate, endDate: blockDates.endDate })
    .from(blockDates).where(and(eq(blockDates.propertyId, id), managedResource(blockDates.propertyId, manager)));
  return { rates, bookings: [...dates, ...blocks.map(row => ({ ...row, source: 'manual-block' }))], media: photos };
}
export type PanelProperty = typeof properties.$inferSelect;
export type PanelResources = Awaited<ReturnType<typeof propertyResources>>;
