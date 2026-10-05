import 'server-only';
import { db, properties } from '@portal/db';
import { and, eq } from 'drizzle-orm';
import { notFound, redirect } from 'next/navigation';
import { AccessError, managedProperties, requirePropertyManager, type PropertyManager } from './property-access';

export async function panelManager(locale: string) {
  try { return await requirePropertyManager(); }
  catch (error) {
    if (error instanceof AccessError) redirect(`/${locale}`);
    throw error;
  }
}
export async function managedProperty(id: string, manager: PropertyManager) {
  const [property] = await db.select().from(properties)
    .where(and(eq(properties.id, id), managedProperties(manager))).limit(1);
  if (!property) throw new AccessError(404);
  return property;
}
export async function panelProperty(id: string, locale: string) {
  const manager = await panelManager(locale);
  try { return { manager, property: await managedProperty(id, manager) }; }
  catch (error) {
    if (error instanceof AccessError && error.status === 404) notFound();
    throw error;
  }
}
