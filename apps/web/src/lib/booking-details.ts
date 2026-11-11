import 'server-only';
// T-4738: vista privada de una reserva con su desglose de precio. Solo ADMIN o el colaborador dueño de la
// propiedad (managedResource, revalidado dentro de cada query). Los bloqueos (host-block) no son reservas.
import { db, bookings, partners, properties, users } from '@portal/db';
import { and, desc, eq, ne } from 'drizzle-orm';
import { AccessError, managedResource, type PropertyManager } from './property-access';
import { PanelValidationError } from './panel-validation';
import { validateBreakdown } from './booking-breakdown';

const scope = (id: string, manager: PropertyManager) =>
  and(eq(bookings.id, id), ne(bookings.source, 'host-block'), managedResource(bookings.propertyId, manager));

export async function getManagedBooking(id: string, manager: PropertyManager) {
  const [row] = await db.select({
    id: bookings.id, propertyId: bookings.propertyId, startDate: bookings.startDate, endDate: bookings.endDate, source: bookings.source,
    rentAmount: bookings.rentAmount, cleaningCost: bookings.cleaningCost, taxes: bookings.taxes,
    commissionPercent: bookings.commissionPercent, referredBy: partners.name,
    guestName: users.name, guestEmail: users.email,
    slug: properties.slug, titleEs: properties.titleEs, titleEn: properties.titleEn, titleFr: properties.titleFr,
  }).from(bookings).innerJoin(properties, eq(properties.id, bookings.propertyId))
    .leftJoin(users, eq(users.id, bookings.guestUserId)).leftJoin(partners, eq(partners.id, bookings.referredByPartnerId))
    .where(scope(id, manager)).limit(1);
  if (!row) throw new AccessError(404);
  return row;
}

/** Lista privada de reservas (sin bloqueos) con su desglose: ADMIN todas, colaborador las de sus propiedades. */
export async function listManagedBookings(manager: PropertyManager) {
  return db.select({
    id: bookings.id, startDate: bookings.startDate, endDate: bookings.endDate, source: bookings.source,
    rentAmount: bookings.rentAmount, cleaningCost: bookings.cleaningCost, taxes: bookings.taxes,
    commissionPercent: bookings.commissionPercent, referredBy: partners.name,
    slug: properties.slug, titleEs: properties.titleEs, titleEn: properties.titleEn, titleFr: properties.titleFr,
  }).from(bookings).innerJoin(properties, eq(properties.id, bookings.propertyId))
    .leftJoin(partners, eq(partners.id, bookings.referredByPartnerId))
    .where(and(ne(bookings.source, 'host-block'), managedResource(bookings.propertyId, manager)))
    .orderBy(desc(bookings.startDate));
}

/** Solo renta, aseo e impuestos. El % del colaborador es un snapshot y no se edita aquí. */
export async function updateBookingBreakdown(id: string, input: unknown, manager: PropertyManager) {
  const result = validateBreakdown(input);
  if (!result.ok) throw new PanelValidationError('validation');
  const [row] = await db.update(bookings).set(result.value).where(scope(id, manager)).returning({ id: bookings.id });
  if (!row) throw new AccessError(404);
  return { success: true, ...result.value };
}
