import 'server-only';
// T-5209 (app del vendedor): «Apartar» = crear la consulta Y bloquear esas fechas; «Liberar» = quitar el bloqueo
// (la consulta queda, como cualquier otra).
//
// Garantía de «solo uno gana» (decisión T-5209): el BLOQUEO se escribe primero, con una sola sentencia que solo
// inserta si nadie ocupa [start, end) (Booking o BlockDate) y si la casa la gestiona quien aparta. En PostgreSQL esa
// comprobación usa la foto de la sentencia, así que dos apartados simultáneos la pasarían los dos: lo impide la
// exclusión «BlockDate_no_overlap» (scripts/sql/blockdate-hold.sql), que hace fallar al segundo con 23P01.
// Después se escribe la consulta; si falla, se borra el bloqueo (no quedan fechas bloqueadas sin consulta).
import { randomUUID } from 'node:crypto';
import { db, blockDates, messages, properties, users } from '@portal/db';
import { and, asc, eq, isNotNull, sql } from 'drizzle-orm';
import { AccessError, managedProperties, managedResource, type PropertyManager } from './property-access';
import { PanelValidationError, dateRange, number, objectBody, text } from './panel-validation';
import { inquiryToday } from './inquiry-validation';
import { stayTooLong, vendorReferral } from './vendor-quote';

export type HoldInput = { propertyId: string; start: string; end: string; guests: number; name: string; phone: string | null; email: string | null; note: string | null };

const KEYS = ['propertyId', 'start', 'end', 'guests', 'name', 'phone', 'email', 'note'];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function optional(value: unknown, max: number, pattern?: RegExp) {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') throw new PanelValidationError('validation');
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.length > max || (pattern && !pattern.test(trimmed))) throw new PanelValidationError('validation');
  return trimmed;
}

/** Valida lo que manda el formulario de «Apartar». Lanza PanelValidationError('validation'). */
export function holdInput(value: unknown): HoldInput {
  const body = objectBody(value);
  if (Object.keys(body).some(key => !KEYS.includes(key))) throw new PanelValidationError('validation');
  const propertyId = text(body.propertyId);
  const { startDate: start, endDate: end } = dateRange({ startDate: body.start, endDate: body.end });
  if (start < inquiryToday() || stayTooLong(start, end)) throw new PanelValidationError('validation');
  const guests = number(body.guests, 1, true)!;
  const name = text(body.name);
  if (name.length > 100) throw new PanelValidationError('validation');
  return { propertyId, start, end, guests, name, phone: optional(body.phone, 30, /^[0-9+()\s-]{7,30}$/), email: optional(body.email, 254, EMAIL), note: optional(body.note, 1000) };
}

const bodyText: Record<'es' | 'en' | 'fr', (seller: string, guests: number, note: string | null) => string> = {
  es: (seller, guests, note) => `Fechas apartadas desde el panel por ${seller}. Huéspedes: ${guests}.${note ? `\nNota: ${note}` : ''}`,
  en: (seller, guests, note) => `Dates held from the panel by ${seller}. Guests: ${guests}.${note ? `\nNote: ${note}` : ''}`,
  fr: (seller, guests, note) => `Dates réservées depuis le panneau par ${seller}. Voyageurs : ${guests}.${note ? `\nNote : ${note}` : ''}`,
};
const code = (error: unknown) => {
  const value = error as { code?: unknown; cause?: { code?: unknown } } | null;
  return String(value?.code ?? value?.cause?.code ?? '');
};

/** Aparta: bloqueo + consulta. Lanza AccessError(404) si la casa no es suya y PanelValidationError('notAvailable') si ya no está libre. */
export async function holdDates(input: HoldInput, manager: PropertyManager, locale: string = 'es'): Promise<{ messageId: string; blockId: string }> {
  const [property] = await db.select({ id: properties.id, maxGuests: properties.maxGuests }).from(properties)
    .where(and(eq(properties.id, input.propertyId), managedProperties(manager))).limit(1);
  if (!property) throw new AccessError(404);
  if (input.guests > Number(property.maxGuests)) throw new PanelValidationError('validation');
  const [[seller], referral] = await Promise.all([
    db.select({ name: users.name, email: users.email }).from(users).where(eq(users.id, manager.id)).limit(1),
    vendorReferral(manager.id, property.id),
  ]);
  const blockId = randomUUID(), messageId = randomUUID();
  let claimed: { rows: unknown[] };
  try {
    claimed = await db.execute(sql`
      insert into "BlockDate" ("id", "propertyId", "startDate", "endDate", "createdBy", "messageId")
      select ${blockId}, ${properties.id}, ${input.start}::date, ${input.end}::date, ${manager.id}, ${messageId}
      from ${properties} where ${and(eq(properties.id, property.id), managedProperties(manager))}
        and not exists (select 1 from "Booking" b where b."propertyId" = ${properties.id}
          and b."startDate" < ${input.end}::date and b."endDate" > ${input.start}::date)
        and not exists (select 1 from "BlockDate" b where b."propertyId" = ${properties.id}
          and b."startDate" < ${input.end}::date and b."endDate" > ${input.start}::date)
      returning "id"
    `);
  } catch (error) {
    if (code(error) === '23P01') throw new PanelValidationError('notAvailable');
    throw error;
  }
  if (!claimed.rows.length) throw new PanelValidationError('notAvailable');
  try {
    const lang = locale === 'en' || locale === 'fr' ? locale : 'es';
    await db.execute(sql`
      insert into "Message" ("id", "propertyId", "name", "email", "phone", "lang", "body", "startDate", "endDate", "userId", "referredByPartnerId", "referralLinkId")
      values (${messageId}, ${property.id}, ${input.name}, ${input.email ?? seller?.email ?? ''}, ${input.phone}, ${lang},
        ${bodyText[lang](seller?.name || seller?.email || manager.id, input.guests, input.note)},
        ${input.start}::date, ${input.end}::date, ${manager.id}, ${referral?.partnerId ?? null}, ${referral?.linkId ?? null})
    `);
  } catch (error) {
    await db.delete(blockDates).where(eq(blockDates.id, blockId));
    throw error;
  }
  return { messageId, blockId };
}

/** Libera un apartado: borra SOLO bloqueos con consulta, de casas que gestiona. La consulta queda. */
export async function releaseHold(blockId: string, manager: PropertyManager) {
  const removed = await db.delete(blockDates)
    .where(and(eq(blockDates.id, blockId), isNotNull(blockDates.messageId), managedResource(blockDates.propertyId, manager)))
    .returning({ id: blockDates.id });
  if (!removed.length) throw new AccessError(404);
}

/** Apartados vigentes de una casa (con el nombre del cliente) para «Liberar» en la ficha del vendedor. */
export async function propertyHolds(propertyId: string, manager: PropertyManager) {
  return db.select({ blockId: blockDates.id, start: blockDates.startDate, end: blockDates.endDate, messageId: blockDates.messageId, name: messages.name })
    .from(blockDates).innerJoin(messages, eq(messages.id, blockDates.messageId))
    .where(and(eq(blockDates.propertyId, propertyId), isNotNull(blockDates.messageId), managedResource(blockDates.propertyId, manager)))
    .orderBy(asc(blockDates.startDate), asc(blockDates.id));
}
