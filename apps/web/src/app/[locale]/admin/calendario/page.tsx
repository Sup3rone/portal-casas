import { db, properties, bookings } from '@portal/db';
import { asc } from 'drizzle-orm';
import CalendarBoard from '@/components/CalendarBoard';

export const dynamic = 'force-dynamic';

export default async function AdminCalendarioPage() {
  const propiedades = await db
    .select({ id: properties.id, slug: properties.slug, title: properties.titleEs })
    .from(properties)
    .orderBy(asc(properties.slug));

  const bookingRows = await db
    .select({
      propertyId: bookings.propertyId,
      startDate: bookings.startDate,
      endDate: bookings.endDate,
      source: bookings.source,
    })
    .from(bookings)
    .orderBy(asc(bookings.startDate));

  return (
    <CalendarBoard
      propiedades={propiedades}
      bookings={bookingRows.map(b => ({
        propertyId: b.propertyId,
        start: String(b.startDate).slice(0, 10),
        end: String(b.endDate).slice(0, 10),
        source: b.source,
      }))}
    />
  );
}
