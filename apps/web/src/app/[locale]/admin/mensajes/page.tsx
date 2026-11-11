import { db, messages, properties, partners } from '@portal/db';
import { desc, eq } from 'drizzle-orm';
import MensajesList from '@/components/MensajesList';
import { managedResource, requirePropertyManager } from '@/lib/property-access';

export const dynamic = 'force-dynamic';

export default async function AdminMensajesPage() {
  const manager = await requirePropertyManager();
  const rows = await db
    .select({
      id: messages.id,
      name: messages.name,
      email: messages.email,
      phone: messages.phone,
      lang: messages.lang,
      body: messages.body,
      startDate: messages.startDate,
      endDate: messages.endDate,
      read: messages.read,
      createdAt: messages.createdAt,
      userId: messages.userId,
      propiedad: properties.slug,
      propertyId: messages.propertyId,
      propertyTitle: properties.titleEs,
      referredBy: partners.name, // T-4736
    })
    .from(messages)
    .leftJoin(properties, eq(messages.propertyId, properties.id))
    .leftJoin(partners, eq(partners.id, messages.referredByPartnerId))
    .where(managedResource(messages.propertyId, manager))
    .orderBy(desc(messages.createdAt));

  return <MensajesList rows={rows} />;
}
