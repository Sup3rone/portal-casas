import 'server-only';
// T-4736: programa de referidos — servicio de servidor. Solo ADMIN gestiona colaboradores;
// la única lectura pública es referralAttribution(), que no expone datos del colaborador.
import { db, bookings, partners, properties, referralLinks, users } from '@portal/db';
import { and, asc, desc, eq, sql } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { AccessError, requireAdmin, requirePropertyManager, type PropertyManager } from './property-access';
import { PanelValidationError } from './panel-validation';
import { generateReferralCode, normalizeReferralCode, referralCodeFromCookieHeader } from './referral';

export async function referralsPage() {
  try { return await requireAdmin(); }
  catch (error) { if (error instanceof AccessError) notFound(); throw error; }
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const COMMISSION = /^\d{1,3}(?:\.\d{1,2})?$/;
const optionalText = (value: unknown, max: number) => {
  if (value == null || value === '') return null;
  if (typeof value !== 'string' || value.trim().length > max) throw new PanelValidationError('validation');
  return value.trim() || null;
};

// Misma forma que una violación UNIQUE de PostgreSQL: panelError responde 409 «conflict».
const codeTaken = () => new Error('Código de referido en uso', { cause: { code: '23505' } });

export type PartnerInput = { name: string; email: string | null; phone: string | null; commissionPercent: string; active: boolean };

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
  commissionPercent: partners.commissionPercent, active: partners.active, createdAt: partners.createdAt, userId: partners.userId,
};

export async function listPartners() {
  const rows = await db.select({ ...partnerFields,
    linkCount: sql<number>`(select count(*) from "ReferralLink" l where l."partnerId" = "Partner"."id")`,
    bookingCount: sql<number>`(select count(*) from "Booking" b where b."referredByPartnerId" = "Partner"."id")`,
  }).from(partners).orderBy(desc(partners.active), asc(partners.name));
  return rows.map(row => ({ ...row, linkCount: Number(row.linkCount), bookingCount: Number(row.bookingCount) }));
}

export async function getPartner(id: string) {
  const [partner] = await db.select({ ...partnerFields, userEmail: users.email }).from(partners)
    .leftJoin(users, eq(users.id, partners.userId)).where(eq(partners.id, id)).limit(1);
  if (!partner) throw new AccessError(404);
  return partner;
}

export async function createPartner(input: unknown) {
  await requireAdmin();
  const value = validatePartnerInput(input) as PartnerInput, now = new Date();
  const [row] = await db.insert(partners).values({ id: crypto.randomUUID(), ...value, userId: null, createdAt: now, updatedAt: now }).returning({ id: partners.id });
  return row;
}

/** Edita o activa/desactiva. No existe borrado. */
export async function updatePartner(id: string, input: unknown) {
  await requireAdmin();
  const value = validatePartnerInput(input, true);
  const [row] = await db.update(partners).set({ ...value, updatedAt: new Date() }).where(eq(partners.id, id)).returning({ id: partners.id, active: partners.active });
  if (!row) throw new AccessError(404);
  return row;
}

export async function partnerLinks(partnerId: string) {
  return db.select({ id: referralLinks.id, code: referralLinks.code, createdAt: referralLinks.createdAt, propertyId: referralLinks.propertyId,
    slug: properties.slug, titleEs: properties.titleEs, titleEn: properties.titleEn, titleFr: properties.titleFr,
    bookingCount: sql<number>`(select count(*) from "Booking" b where b."referralLinkId" = "ReferralLink"."id")`,
  }).from(referralLinks).leftJoin(properties, eq(properties.id, referralLinks.propertyId))
    .where(eq(referralLinks.partnerId, partnerId)).orderBy(desc(referralLinks.createdAt))
    .then(rows => rows.map(row => ({ ...row, bookingCount: Number(row.bookingCount) })));
}

export async function partnerBookings(partnerId: string) {
  return db.select({ id: bookings.id, startDate: bookings.startDate, endDate: bookings.endDate, code: referralLinks.code, commissionPercent: bookings.commissionPercent,
    titleEs: properties.titleEs, titleEn: properties.titleEn, titleFr: properties.titleFr,
  }).from(bookings).innerJoin(properties, eq(properties.id, bookings.propertyId))
    .leftJoin(referralLinks, eq(referralLinks.id, bookings.referralLinkId))
    .where(eq(bookings.referredByPartnerId, partnerId)).orderBy(desc(bookings.startDate));
}

export async function referralPropertyOptions() {
  return db.select({ id: properties.id, slug: properties.slug, titleEs: properties.titleEs, titleEn: properties.titleEn, titleFr: properties.titleFr, published: properties.published })
    .from(properties).orderBy(asc(properties.slug));
}

/** Crea un enlace general (propertyId null) o por propiedad. Código propio opcional; si no, se genera. */
export async function createReferralLink(partnerId: string, input: unknown) {
  await requireAdmin();
  await getPartner(partnerId);
  return insertReferralLink(partnerId, input, null);
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
    .where(and(eq(partners.userId, manager.id), eq(users.canCreateReferralLinks, true), eq(users.role, 'COLLABORATOR'))).limit(1);
  return row ?? null;
}

export async function myReferralsPage() {
  try {
    const manager = await requirePropertyManager();
    const partner = await collaboratorPartner(manager);
    if (!partner) throw new AccessError(404);
    return { manager, partner };
  } catch (error) { if (error instanceof AccessError) notFound(); throw error; }
}

export async function createOwnReferralLink(input: unknown) {
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
