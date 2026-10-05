import 'server-only';

import { db, properties, users } from '@portal/db';
import { eq, inArray, sql, type AnyColumn } from 'drizzle-orm';
import { auth } from './auth';

export type PropertyManager = { id: string; role: 'ADMIN' | 'COLLABORATOR' };

export class AccessError extends Error {
  constructor(public status: 401 | 403 | 404, public code?: 'SESSION_USER_NOT_FOUND' | 'ROLE_NOT_ALLOWED') {
    super(status === 404 ? 'Recurso no encontrado' : 'No autorizado');
  }
}

// El JWT identifica al usuario; el permiso siempre procede del rol vigente en BD.
export async function requirePropertyManager(): Promise<PropertyManager> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) throw new AccessError(401);
  const [user] = await db.select({ id: users.id, role: users.role })
    .from(users).where(eq(users.id, id)).limit(1);
  if (!user) throw new AccessError(403, 'SESSION_USER_NOT_FOUND');
  if (user.role !== 'ADMIN' && user.role !== 'COLLABORATOR') {
    throw new AccessError(403, 'ROLE_NOT_ALLOWED');
  }
  return { id: user.id, role: user.role };
}

export async function requireAdmin() {
  const manager = await requirePropertyManager();
  if (manager.role !== 'ADMIN') throw new AccessError(403);
  return manager;
}

// Se vuelve a comprobar rol y dueño dentro de la query/mutación, sin depender de la UI.
export function managedProperties(manager: PropertyManager) {
  return sql`exists (
    select 1 from "User" as actor
    where actor."id" = ${manager.id}
      and (actor."role"::text = 'ADMIN' or
        (actor."role"::text = 'COLLABORATOR' and ${properties.ownerId} = actor."id"))
  )`;
}

export function managedResource(column: AnyColumn, manager: PropertyManager) {
  return inArray(column, db.select({ id: properties.id }).from(properties).where(managedProperties(manager)));
}

export function accessFailure(error: unknown) {
  return error instanceof AccessError ? error : null;
}
