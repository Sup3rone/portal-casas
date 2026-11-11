// T-4738: vista privada de una reserva con su desglose (renta, aseo, impuestos) y la comisión del colaborador.
// ADMIN o colaborador dueño de la propiedad; cualquier otro caso (o un bloqueo) → 404. Nada de esto es público.
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { AccessError } from '@/lib/property-access';
import { panelManager } from '@/lib/panel-server';
import { getManagedBooking } from '@/lib/booking-details';
import { quoteBookingRent } from '@/lib/booking-quote';
import BookingBreakdownForm from '@/components/panel/BookingBreakdownForm';

export default async function BookingPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  const manager = await panelManager(locale);
  const t = await getTranslations({ locale, namespace: 'bookingDetail' });
  const referrals = await getTranslations({ locale, namespace: 'referrals' });
  let booking;
  try { booking = await getManagedBooking(id, manager); }
  catch (error) { if (error instanceof AccessError) notFound(); throw error; }
  const title = (locale === 'en' ? booking.titleEn : locale === 'fr' ? booking.titleFr : booking.titleEs) || booking.slug;
  const date = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'UTC' });
  const day = (value: string) => date.format(new Date(`${value}T00:00:00Z`));
  const legacy = booking.rentAmount == null && booking.cleaningCost == null && booking.taxes == null;
  // Renta según las tarifas vigentes de la propiedad: sugerencia/precarga, se guarda solo si el gestor guarda.
  const suggestedRent = await quoteBookingRent(booking.propertyId, booking.startDate, booking.endDate);
  return <section className="space-y-8">
    <Link href="/panel/reservas" className="text-green-700 underline dark:text-green-400">{t('back')}</Link>
    <div className="space-y-2">
      <h1 className="break-words text-3xl font-semibold">{t('title')}</h1>
      <dl className="grid gap-2 sm:grid-cols-[auto_1fr] sm:gap-x-6">
        <dt className="font-semibold">{t('property')}</dt><dd className="break-words">{title}</dd>
        <dt className="font-semibold">{t('dates')}</dt><dd>{day(booking.startDate)} – {day(booking.endDate)}</dd>
        <dt className="font-semibold">{t('source')}</dt><dd>{booking.source}</dd>
        {booking.guestName && <><dt className="font-semibold">{t('guest')}</dt><dd className="break-all">{booking.guestName}{booking.guestEmail ? ` · ${booking.guestEmail}` : ''}</dd></>}
        <dt className="font-semibold">{t('referral')}</dt>
        <dd>{booking.referredBy ? referrals('referredBy', { name: booking.referredBy }) : t('noReferral')}</dd>
      </dl>
    </div>
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">{t('breakdown')}</h2>
      {legacy && <p role="status">{t('legacyNotice')}</p>}
      <BookingBreakdownForm id={booking.id} commissionPercent={booking.commissionPercent} suggestedRent={suggestedRent}
        initial={{ rentAmount: booking.rentAmount, cleaningCost: booking.cleaningCost, taxes: booking.taxes }} />
    </section>
  </section>;
}
