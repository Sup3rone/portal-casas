import { db, messages, properties, bookings } from '@portal/db';
import { desc, eq } from 'drizzle-orm';
import { getTranslations } from 'next-intl/server';
import { panelManager } from '@/lib/panel-server';
import { managedProperties } from '@/lib/property-access';
import Inquiries from '@/components/panel/Inquiries';

export default async function PanelInquiriesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params, manager = await panelManager(locale);
  const title = locale === 'en' ? properties.titleEn : locale === 'fr' ? properties.titleFr : properties.titleEs;
  const t = await getTranslations({ locale, namespace: 'panel' });
  const [rows, reservations] = await Promise.all([
    db.select({ id: messages.id, name: messages.name, email: messages.email, phone: messages.phone, body: messages.body,
      read: messages.read, createdAt: messages.createdAt, propertyId: messages.propertyId, title,
      startDate: messages.startDate, endDate: messages.endDate }).from(messages)
      .innerJoin(properties, eq(messages.propertyId, properties.id)).where(managedProperties(manager)).orderBy(desc(messages.createdAt)),
    db.select({ id: bookings.id, title, startDate: bookings.startDate, endDate: bookings.endDate, source: bookings.source }).from(bookings)
      .innerJoin(properties, eq(bookings.propertyId, properties.id)).where(managedProperties(manager)).orderBy(desc(bookings.startDate)),
  ]);
  return <div className="space-y-8"><Inquiries rows={rows.map(row => ({ ...row, createdAt: row.createdAt.toISOString() }))} />
    <section className="space-y-4"><h2 className="text-2xl font-semibold">{t('bookings')}</h2>
      {!reservations.length && <p>{t('emptyBookings')}</p>}
      {reservations.map(reservation => <article key={reservation.id} className="rounded-2xl border bg-white p-4">
        {reservation.title} · {reservation.startDate} → {reservation.endDate} · {reservation.source === 'host-block' ? t('blockSource') : t('bookingSource', { source: reservation.source })}
      </article>)}
    </section></div>;
}
