import 'server-only';
// T-4736: programa de referidos — servicio de servidor. La única lectura pública es referralAttribution(),
// que no expone datos del colaborador.
// T-4767: el ADMIN ve y gestiona todos los referidores (Partner); el dueño (COLLABORATOR) solo los suyos
// (Partner.ownerId = él), con enlaces generales o de SUS casas, y solo ve las reservas de SUS casas.
import { db, bookings, partners, properties, referralLinks, users } from '@portal/db';
import { and, asc, desc, eq, isNull, sql, type SQL } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { AccessError, managedResource, requirePropertyManager, type PropertyManager } from './property-access';
import { PanelValidationError } from './panel-validation';
import { generateReferralCode, normalizeReferralCode, referralCodeFromCookieHeader } from './referral';

/** /panel/referidos: ADMIN (todos) o COLLABORATOR (los suyos). Otros roles: 404. */
export async function referralsPage() {
  try { return await requirePropertyManager(); }
  catch (error) { if (error instanceof AccessError) notFound(); throw error; }
}

/**
 * T-4767: acotación de referidores. ADMIN: todos; COLLABORATOR: Partner.ownerId = actor.
 * El rol se vuelve a leer de la BD dentro de la query (mismo patrón que managedProperties).
 */
export function managedPartners(manager: PropertyManager) {
  return sql`exists (
    select 1 from "User" as actor
    where actor."id" = ${manager.id}
      and (actor."role"::text = 'ADMIN' or
        (actor."role"::text = 'COLLABORATOR' and ${partners.ownerId} = actor."id"))
  )`;
}

/** Filtro de reservas para conteos/listas: el dueño solo cuenta las de sus casas; ADMIN o sin manager, todas. */
const ownerBookingScope = (manager: PropertyManager | undefined, alias: string): SQL =>
  manager?.role === 'COLLABORATOR'
    ? sql`and exists (select 1 from "Property" p where p."id" = ${sql.raw(`${alias}."propertyId"`)} and p."ownerId" = ${manager.id})`
    : sql``;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const COMMISSION = /^\d{1,3}(?:\.\d{1,2})?$/;
const optionalText = (value: unknown, max: number) => {
  if (value == null || value === '') return null;
  if (typeof value !== 'string' || value.trim().length > max) throw new PanelValidationError('validation');
  return value.trim() || null;
};

// Misma forma que una violación UNIQUE de PostgreSQL: panelError responde 409 «conflict».
const codeTaken = () => new Error('Código de referido en uso', { cause: { code: '23505' } });

// userEmail (T-4767): correo de una cuenta YA registrada que verá sus códigos en /mi-cuenta; null = desligar.
export type PartnerInput = { name: string; email: string | null; phone: string | null; commissionPercent: string; active: boolean; userEmail?: string | null };

/** partial = PATCH: solo valida y devuelve los campos presentes. */
export function validatePartnerInput(input: unknown, partial = false): Partial<PartnerInput> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new PanelValidationError('validation');
  const value = input as Record<string, unknown>, out: Partial<PartnerInput> = {};
  if (!partial || 'name' in value) {
    if (typeof value.name !== 'string' || !value.name.trim() || value.name.trim().length > 120) throw new PanelValidationError('validation');
    out.name = value.name.trim();
  }
  if (!partial || 'email' in value) {
    out.email = optionalText(value.email, 254);
    if (out.email && !EMAIL.test(out.email)) throw new PanelValidationError('validation');
  }
  if (!partial || 'phone' in value) out.phone = optionalText(value.phone, 40);
  if ('userEmail' in value) {
    const userEmail = optionalText(value.userEmail, 254);
    if (userEmail && !EMAIL.test(userEmail)) throw new PanelValidationError('validation');
    out.userEmail = userEmail?.toLowerCase() ?? null;
  }
  if (!partial || 'commissionPercent' in value) {
    const raw = typeof value.commissionPercent === 'number' ? String(value.commissionPercent) : value.commissionPercent;
    if (typeof raw !== 'string' || !COMMISSION.test(raw.trim()) || Number(raw) > 100) throw new PanelValidationError('validation');
    out.commissionPercent = Number(raw).toFixed(2);
  }
  if ('active' in value) {
    if (typeof value.active !== 'boolean') throw new PanelValidationError('validation');
    out.active = value.active;
  } else if (!partial) out.active = true;
  if (partial && !Object.keys(out).length) throw new PanelValidationError('validation');
  return out;
}

const partnerFields = {
  id: partners.id, name: partners.name, email: partners.email, phone: partners.phone,
  commissionPercent: partners.commissionPercent, active: partners.active, createdAt: partners.createdAt, userId: partners.userId, ownerId: partners.ownerId,
};

export async function listPartners(manager: PropertyManager) {
  const rows = await db.select({ ...partnerFields,
    linkCount: sql<number>`(select count(*) from "ReferralLink" l where l."partnerId" = "Partner"."id")`,
    bookingCount: sql<number>`(select count(*) from "Booking" b where b."referredByPartnerId" = "Partner"."id" ${ownerBookingScope(manager, 'b')})`,
  }).from(partners).where(managedPartners(manager)).orderBy(desc(partners.active), asc(partners.name));
  return rows.map(row => ({ ...row, linkCount: Number(row.linkCount), bookingCount: Number(row.bookingCount) }));
}

/** Ajeno o inexistente: 404 (no se distingue para no revelar referidores de otros dueños). */
export async function getPartner(id: string, manager: PropertyManager) {
  const [partner] = await db.select({ ...partnerFields, userEmail: users.email }).from(partners)
    .leftJoin(users, eq(users.id, partners.userId)).where(and(eq(partners.id, id), managedPartners(manager))).limit(1);
  if (!partner) throw new AccessError(404);
  return partner;
}

/**
 * T-4767: la cuenta ligada debe existir y ser de huésped (CLIENT o VIEWER): no se le cambia el rol ni entra al panel.
 * Nunca un ADMIN, un COLLABORATOR ni el propio actor. Mismo error para «no existe» y «no permitida».
 */
async function referrerUserId(email: string | null, manager: PropertyManager) {
  if (email === null) return null;
  const [user] = await db.select({ id: users.id, role: users.role }).from(users).where(sql`lower(${users.email}) = ${email}`).limit(1);
  if (!user || user.id === manager.id || (user.role !== 'CLIENT' && user.role !== 'VIEWER')) throw new PanelValidationError('invalidReferrerAccount');
  // Una cuenta = un referidor. El UNIQUE "Partner_userId_unique" cubre la carrera (también 409).
  const [taken] = await db.select({ id: partners.id }).from(partners).where(eq(partners.userId, user.id)).limit(1);
  if (taken) throw new Error('Cuenta ya ligada a otro referidor', { cause: { code: '23505' } });
  return user.id;
}

export async function createPartner(input: unknown) {
  const manager = await requirePropertyManager();
  const { userEmail, ...value } = validatePartnerInput(input) as PartnerInput, now = new Date();
  const userId = await referrerUserId(userEmail ?? null, manager);
  const ownerId = manager.role === 'COLLABORATOR' ? manager.id : null; // Alta del ADMIN: sin dueño.
  const [row] = await db.insert(partners).values({ id: crypto.randomUUID(), ...value, userId, ownerId, createdAt: now, updatedAt: now }).returning({ id: partners.id });
  return row;
}

/** Edita, liga/desliga la cuenta o activa/desactiva. No existe borrado. El ownerId no se cambia desde aquí. */
export async function updatePartner(id: string, input: unknown) {
  const manager = await requirePropertyManager();
  const { userEmail, ...value } = validatePartnerInput(input, true);
  const changes: Partial<typeof partners.$inferInsert> = { ...value };
  if (userEmail !== undefined) {
    const current = await getPartner(id, manager);
    // Mismo correo que ya está ligado: no se revalida (p. ej. el Partner que crea el permiso del ADMIN, ligado a un COLLABORATOR).
    if ((current.userEmail?.toLowerCase() ?? null) !== userEmail) changes.userId = await referrerUserId(userEmail, manager);
  }
  const [row] = await db.update(partners).set({ ...changes, updatedAt: new Date() })
    .where(and(eq(partners.id, id), managedPartners(manager))).returning({ id: partners.id, active: partners.active });
  if (!row) throw new AccessError(404);
  return row;
}

/** manager (T-4767): con un COLLABORATOR solo cuenta reservas de sus casas. Sin manager: todas (vista del propio referidor). */
export async function partnerLinks(partnerId: string, manager?: PropertyManager) {
  return db.select({ id: referralLinks.id, code: referralLinks.code, createdAt: referralLinks.createdAt, propertyId: referralLinks.propertyId,
    slug: properties.slug, titleEs: properties.titleEs, titleEn: properties.titleEn, titleFr: properties.titleFr,
    bookingCount: sql<number>`(select count(*) from "Booking" b where b."referralLinkId" = "ReferralLink"."id" ${ownerBookingScope(manager, 'b')})`,
  }).from(referralLinks).leftJoin(properties, eq(properties.id, referralLinks.propertyId))
    .where(eq(referralLinks.partnerId, partnerId)).orderBy(desc(referralLinks.createdAt))
    .then(rows => rows.map(row => ({ ...row, bookingCount: Number(row.bookingCount) })));
}

export async function partnerBookings(partnerId: string, manager?: PropertyManager) {
  return db.select({ id: bookings.id, startDate: bookings.startDate, endDate: bookings.endDate, code: referralLinks.code, commissionPercent: bookings.commissionPercent,
    titleEs: properties.titleEs, titleEn: properties.titleEn, titleFr: properties.titleFr,
  }).from(bookings).innerJoin(properties, eq(properties.id, bookings.propertyId))
    .leftJoin(referralLinks, eq(referralLinks.id, bookings.referralLinkId))
    .where(and(eq(bookings.referredByPartnerId, partnerId),
      manager?.role === 'COLLABORATOR' ? managedResource(bookings.propertyId, manager) : undefined))
    .orderBy(desc(bookings.startDate));
}

/** Destinos para generar enlaces: ADMIN todas las casas; COLLABORATOR solo las suyas. */
export async function referralPropertyOptions(manager: PropertyManager) {
  if (manager.role === 'COLLABORATOR') return ownReferralPropertyOptions(manager);
  return db.select({ id: properties.id, slug: properties.slug, titleEs: properties.titleEs, titleEn: properties.titleEn, titleFr: properties.titleFr, published: properties.published })
    .from(properties).orderBy(asc(properties.slug));
}

/** Crea un enlace general (propertyId null) o por propiedad. Código propio opcional; si no, se genera. */
export async function createReferralLink(partnerId: string, input: unknown) {
  const manager = await requirePropertyManager();
  await getPartner(partnerId, manager);
  return insertReferralLink(partnerId, input, manager.role === 'COLLABORATOR' ? manager.id : null);
}

/** ownerId: si viene, la propiedad debe ser de ese usuario (enlaces del propio colaborador). */
async function insertReferralLink(partnerId: string, input: unknown, ownerId: string | null) {
  const value = input && typeof input === 'object' && !Array.isArray(input) ? input as Record<string, unknown> : null;
  if (!value) throw new PanelValidationError('validation');
  const propertyId = value.propertyId == null || value.propertyId === '' ? null : value.propertyId;
  if (propertyId !== null && typeof propertyId !== 'string') throw new PanelValidationError('validation');
  const custom = value.code == null || value.code === '' ? null : normalizeReferralCode(value.code);
  if (value.code && !custom) throw new PanelValidationError('validation');
  if (propertyId) {
    const [property] = await db.select({ id: properties.id }).from(properties)
      .where(and(eq(properties.id, propertyId), ownerId ? eq(properties.ownerId, ownerId) : undefined)).limit(1);
    if (!property) throw new PanelValidationError('validation');
  }
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = custom ?? generateReferralCode();
    const [taken] = await db.select({ id: referralLinks.id }).from(referralLinks).where(eq(referralLinks.code, code)).limit(1);
    if (taken) { if (custom) throw codeTaken(); continue; }
    const now = new Date();
    // El UNIQUE de la BD es el respaldo ante una carrera: panelError lo convierte en 409.
    const [row] = await db.insert(referralLinks).values({ id: crypto.randomUUID(), partnerId, propertyId, code, createdAt: now, updatedAt: now })
      .returning({ id: referralLinks.id, code: referralLinks.code });
    return row;
  }
  throw new Error('No se pudo generar un código único');
}

/**
 * T-4736: el COLLABORATOR con permiso (User.canCreateReferralLinks, lo concede un ADMIN) usa el Partner
 * ligado a su usuario. Permiso, rol y partner se leen de la BD en cada llamada, nunca del JWT.
 */
export async function collaboratorPartner(manager: PropertyManager) {
  if (manager.role !== 'COLLABORATOR') return null;
  const [row] = await db.select(partnerFields).from(partners).innerJoin(users, eq(users.id, partners.userId))
    // T-4767: un Partner con dueño es referidor de ese dueño; no se reutiliza como «Mis referidos» propio.
    .where(and(eq(partners.userId, manager.id), isNull(partners.ownerId), eq(users.canCreateReferralLinks, true), eq(users.role, 'COLLABORATOR'))).limit(1);
  return row ?? null;
}

// T-4767: «Mis referidos» descontinuado en UI (decisión del usuario, 11-11-2026): el dueño administra sus
// referidores en /panel/referidos. Página 404 y API 403 para todos. Nada se borra: los Partner y enlaces
// existentes siguen atribuyendo y el ADMIN los ve en Referidos.
export const MY_REFERRALS_DISCONTINUED = true;

export async function myReferralsPage(): Promise<{ manager: PropertyManager; partner: NonNullable<Awaited<ReturnType<typeof collaboratorPartner>>> }> {
  if (MY_REFERRALS_DISCONTINUED) notFound();
  try {
    const manager = await requirePropertyManager();
    const partner = await collaboratorPartner(manager);
    if (!partner) throw new AccessError(404);
    return { manager, partner };
  } catch (error) { if (error instanceof AccessError) notFound(); throw error; }
}

export async function createOwnReferralLink(input: unknown) {
  if (MY_REFERRALS_DISCONTINUED) throw new AccessError(403);
  const manager = await requirePropertyManager();
  const partner = await collaboratorPartner(manager);
  if (!partner) throw new AccessError(403);
  if (!partner.active) throw new AccessError(403); // Desactivado por el ADMIN: no crea enlaces nuevos.
  return insertReferralLink(partner.id, input, manager.id);
}

export async function ownReferralPropertyOptions(manager: PropertyManager) {
  return db.select({ id: properties.id, slug: properties.slug, titleEs: properties.titleEs, titleEn: properties.titleEn, titleFr: properties.titleFr, published: properties.published })
    .from(properties).where(eq(properties.ownerId, manager.id)).orderBy(asc(properties.slug));
}

/**
 * T-4767: lo que ve el referidor en /mi-cuenta — sus códigos, cuántas consultas y reservas generó cada uno y su %.
 * Solo por Partner.userId = la sesión. Sin importes ni datos del huésped. Título solo si la casa está publicada.
 */
export async function referrerSummary(userId: string) {
  const [partner] = await db.select({ id: partners.id, commissionPercent: partners.commissionPercent, active: partners.active })
    .from(partners).where(eq(partners.userId, userId)).limit(1);
  if (!partner) return null;
  const links = await db.select({ id: referralLinks.id, code: referralLinks.code, propertyId: referralLinks.propertyId,
    slug: properties.slug, published: properties.published, titleEs: properties.titleEs, titleEn: properties.titleEn, titleFr: properties.titleFr,
    inquiryCount: sql<number>`(select count(*) from "Message" m where m."referralLinkId" = "ReferralLink"."id")`,
    bookingCount: sql<number>`(select count(*) from "Booking" b where b."referralLinkId" = "ReferralLink"."id")`,
  }).from(referralLinks).leftJoin(properties, eq(properties.id, referralLinks.propertyId))
    .where(eq(referralLinks.partnerId, partner.id)).orderBy(desc(referralLinks.createdAt));
  return { partner, links: links.map(({ published, titleEs, titleEn, titleFr, ...link }) => ({
    ...link, inquiryCount: Number(link.inquiryCount), bookingCount: Number(link.bookingCount),
    titles: link.propertyId && published ? { titleEs, titleEn, titleFr } : null,
  })) };
}

/**
 * Atribución pública: cookie → enlace → colaborador ACTIVO. Nunca lanza: sin cookie,
 * código desconocido, colaborador inactivo o error de BD devuelven null y la consulta sigue igual.
 */
export async function referralAttribution(cookieHeader: string | null | undefined) {
  const code = referralCodeFromCookieHeader(cookieHeader);
  if (!code) return null;
  try {
    const [row] = await db.select({ partnerId: referralLinks.partnerId, linkId: referralLinks.id })
      .from(referralLinks).innerJoin(partners, eq(partners.id, referralLinks.partnerId))
      .where(and(eq(referralLinks.code, code), eq(partners.active, true))).limit(1);
    return row ?? null;
  } catch (error) {
    console.error('No se pudo leer la atribución de referido (consulta OK):', error);
    return null;
  }
}
