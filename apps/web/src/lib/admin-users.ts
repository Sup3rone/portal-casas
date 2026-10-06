import 'server-only';
import { db, users, properties } from '@portal/db';
import { and, asc, eq, ilike, sql } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { randomBytes, randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { AccessError, requireAdmin } from './property-access';
import { PanelValidationError } from './panel-validation';

export const userRoles = ['ADMIN', 'CLIENT', 'COLLABORATOR', 'VIEWER'] as const;
export type UserRole = typeof userRoles[number];

export async function adminUsersPage() {
  try { return await requireAdmin(); }
  catch (error) { if (error instanceof AccessError) notFound(); throw error; }
}

// Nunca seleccionar passwordHash: el estado solo indica si hay contraseña.
export const userFields = {
  id: users.id, email: users.email, role: users.role, createdAt: users.createdAt,
  hasPassword: sql<boolean>`${users.passwordHash} is not null and ${users.passwordHash} <> ''`,
};

export async function listAdminUsers(search: string, role: string, page: number) {
  const filter = and(
    search ? ilike(users.email, `%${search.replace(/[\\%_]/g, '\\$&')}%`) : undefined,
    userRoles.includes(role as UserRole) ? eq(users.role, role as UserRole) : undefined,
  );
  const rows = await db.select({ ...userFields,
    propertyCount: sql<number>`(select count(*)::int from "Property" p where p."ownerId" = "User"."id")`,
  }).from(users).where(filter).orderBy(asc(users.email)).limit(51).offset((page - 1) * 50);
  return { rows: rows.slice(0, 50), hasNext: rows.length > 50 };
}

export async function getAdminUser(id: string) {
  const [user] = await db.select(userFields).from(users).where(eq(users.id, id)).limit(1);
  if (!user) throw new AccessError(404);
  return user;
}

export async function adminUserProperties(id: string) {
  return db.select({ id: properties.id, titleEs: properties.titleEs, titleEn: properties.titleEn,
    titleFr: properties.titleFr, slug: properties.slug, published: properties.published })
    .from(properties).where(eq(properties.ownerId, id)).orderBy(asc(properties.slug));
}

export async function mutateAdminUser(id: string, input: unknown) {
  const actor = await requireAdmin();
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new PanelValidationError('validation');
  const value = input as Record<string, unknown>;
  if (value.confirmed !== true || !['role', 'password'].includes(String(value.action))) throw new PanelValidationError('validation');
  const target = await getAdminUser(id);
  const roleChange = value.action === 'role';
  if (roleChange && (actor.id === id || target.role === 'ADMIN')) throw new AccessError(403);
  if (roleChange && (!['CLIENT', 'COLLABORATOR'].includes(String(value.role)) || !['CLIENT', 'COLLABORATOR', 'VIEWER'].includes(target.role))) {
    throw new PanelValidationError('validation');
  }
  if (roleChange && value.role === target.role) throw new PanelValidationError('validation');
  const temporaryPassword = roleChange ? null : randomBytes(18).toString('base64url');
  const hash = temporaryPassword ? await bcrypt.hash(temporaryPassword, 10) : null;
  // Un único statement PostgreSQL: si el log falla, también se revierte el UPDATE.
  // Revalidar ADMIN y rol anterior dentro de la mutación para cambios concurrentes.
  const changes = roleChange ? sql`"role" = ${value.role as string}::"UserRole"` : sql`"passwordHash" = ${hash}`;
  const restriction = roleChange ? sql`and target."id" <> ${actor.id} and target."role"::text in ('CLIENT', 'COLLABORATOR', 'VIEWER')` : sql``;
  const result = await db.execute(sql`
    with changed as (
      update "User" target set ${changes}
      where target."id" = ${id} and target."role"::text = ${target.role}
        and exists (select 1 from "User" actor where actor."id" = ${actor.id} and actor."role"::text = 'ADMIN')
        ${restriction}
      returning target."id"
    ), logged as (
      insert into "AdminUserAudit" ("id", "actorId", "targetUserId", "action", "previousRole", "newRole")
      select ${randomUUID()}, ${actor.id}, changed."id", ${roleChange ? 'ROLE_CHANGE' : 'PASSWORD_RESET'},
        ${target.role}, ${roleChange ? value.role as string : target.role} from changed returning "id"
    ) select "id" from logged
  `);
  if (!result.rows.length) throw new AccessError(403);
  // El secreto existe solo en memoria y en esta respuesta; nunca en el log/BD.
  return temporaryPassword ? { temporaryPassword } : { success: true };
}
