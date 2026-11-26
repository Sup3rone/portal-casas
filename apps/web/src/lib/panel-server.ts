import 'server-only';
import { db, properties } from '@portal/db';
import { and, eq } from 'drizzle-orm';
import { notFound, redirect } from 'next/navigation';
import { AccessError, managedProperties, requireContentEditor, requirePropertyManager, type PropertyManager } from './property-access';

export async function panelManager(locale: string) {
  try { return await requirePropertyManager(); }
  catch (error) {
    if (!(error instanceof AccessError)) throw error;
    // T-5322: el diseñador no gestiona casas; cualquier página del panel lo lleva a Contenido.
    if (error.code === 'ROLE_NOT_ALLOWED' && await contentEditor()) redirect(`/${locale}/panel/contenido`);
    redirect(`/${locale}`);
  }
}
async function contentEditor() {
  try { return await requireContentEditor(); }
  catch (error) { if (error instanceof AccessError) return null; throw error; }
}
/** T-5322: quien puede ver el marco del panel. El diseñador solo ve Contenido. */
export async function panelMember(locale: string): Promise<{ role: PropertyManager['role'] | 'DESIGNER' }> {
  try { return await requirePropertyManager(); }
  catch (error) {
    if (!(error instanceof AccessError)) throw error;
    const editor = error.code === 'ROLE_NOT_ALLOWED' ? await contentEditor() : null;
    if (editor) return editor;
    redirect(`/${locale}`);
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
