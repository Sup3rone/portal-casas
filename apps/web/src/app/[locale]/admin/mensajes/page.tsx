import { db, messages, properties } from '@portal/db';
import { desc, eq } from 'drizzle-orm';
import MensajesList from '@/components/MensajesList';

export const dynamic = 'force-dynamic';

export default async function AdminMensajesPage() {
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
      propiedad: properties.slug,
      propertyId: messages.propertyId,
      propertyTitle: properties.titleEs,
    })
    .from(messages)
    .leftJoin(properties, eq(messages.propertyId, properties.id))
    .orderBy(desc(messages.createdAt));

  return <MensajesList rows={rows} />;
}
