import { db, messages, properties, bookings } from '@portal/db';
import { desc, eq, sql } from 'drizzle-orm';
import { getTranslations } from 'next-intl/server';
import { panelManager } from '@/lib/panel-server';
import { managedProperties } from '@/lib/property-access';
import Inquiries from '@/components/panel/Inquiries';
import { inquiryToday } from '@/lib/inquiry-validation';

export default async function PanelInquiriesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params, manager = await panelManager(locale);
  const title = locale === 'en' ? properties.titleEn : locale === 'fr' ? properties.titleFr : properties.titleEs;
  const t = await getTranslations({ locale, namespace: 'panel' });
  const [rows, reservations] = await Promise.all([
    db.select({ id: messages.id, name: messages.name, email: messages.email, phone: messages.phone, body: messages.body,
      read: messages.read, createdAt: messages.createdAt, propertyId: messages.propertyId, userId: messages.userId, title,
      slug: properties.slug, rentalType: properties.rentalType,
      weekdayPrice: properties.baseWeekdayPrice, weekendPrice: properties.baseWeekendPrice,
      photoUrl: sql<string | null>`(select m."url" from "Media" m where m."propertyId" = ${properties.id} and m."type" = 'PHOTO'
        order by m."isCover" desc, case when m."isCover" then m."coverOrder" else m."order" end asc, m."id" limit 1)`,
      seasonalPrice: sql<boolean>`exists (select 1 from "SeasonRate" r where r."propertyId" = ${properties.id}
        and r."startDate" < ${messages.endDate} and r."endDate" >= ${messages.startDate})`,
      startDate: messages.startDate, endDate: messages.endDate }).from(messages)
      .innerJoin(properties, eq(messages.propertyId, properties.id)).where(managedProperties(manager)).orderBy(desc(messages.createdAt)),
    db.select({ id: bookings.id, title, startDate: bookings.startDate, endDate: bookings.endDate, source: bookings.source }).from(bookings)
      .innerJoin(properties, eq(bookings.propertyId, properties.id)).where(managedProperties(manager)).orderBy(desc(bookings.startDate)),
  ]);
  const today = inquiryToday(); // Fecha civil de America/Mexico_City, calculada solo en servidor.
  return <div className="space-y-8"><Inquiries rows={rows.map(row => ({ ...row, createdAt: row.createdAt.toISOString(),
    isPast: Boolean(row.endDate && /^\d{4}-\d{2}-\d{2}$/.test(row.endDate) && row.endDate < today) }))} />
    <section className="space-y-4"><h2 className="text-2xl font-semibold">{t('bookings')}</h2>
      {!reservations.length && <p>{t('emptyBookings')}</p>}
      {reservations.map(reservation => <article key={reservation.id} className="rounded-2xl border bg-white dark:bg-gray-900 p-4 dark:border-gray-700">
        {reservation.title} · {reservation.startDate} → {reservation.endDate} · {reservation.source === 'host-block' ? t('blockSource') : t('bookingSource', { source: reservation.source })}
      </article>)}
    </section></div>;
}
