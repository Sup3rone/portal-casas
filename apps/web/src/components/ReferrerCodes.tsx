// T-4767: «Mis códigos de referido» en /mi-cuenta. Lo ve solo la cuenta que el dueño (o el ADMIN) ligó a un
// referidor: sus códigos con enlace, cuántas consultas y reservas generó cada uno y su %. Sin importes ni
// datos de huéspedes. Mismo idioma fijo (español) que el resto de /mi-cuenta.
import { siteUrl } from '@/lib/seo';
import { referralUrl } from '@/lib/referral';
import type { referrerSummary } from '@/lib/referrals';
import { CopyLinkButton } from './panel/Referrals';

type Summary = NonNullable<Awaited<ReturnType<typeof referrerSummary>>>;

export default function ReferrerCodes({ summary, locale }: { summary: Summary; locale: string }) {
  const origin = siteUrl();
  const totals = summary.links.reduce((sum, link) => ({ inquiries: sum.inquiries + link.inquiryCount, bookings: sum.bookings + link.bookingCount }), { inquiries: 0, bookings: 0 });
  const title = (titles: NonNullable<Summary['links'][number]['titles']>) =>
    (locale === 'en' ? titles.titleEn : locale === 'fr' ? titles.titleFr : titles.titleEs) || 'Propiedad';
  return (
    <section className="mt-6 rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-sm" aria-labelledby="referrer-codes-title">
      <h2 id="referrer-codes-title" className="mb-2 text-xl font-semibold text-gray-900 dark:text-gray-100">Mis códigos de referido</h2>
      <p className="text-sm text-gray-600 dark:text-gray-300">
        Comisión: {summary.partner.commissionPercent}% · Códigos: {summary.links.length} · Consultas: {totals.inquiries} · Reservas: {totals.bookings}
      </p>
      {!summary.partner.active && (
        <p role="status" className="mt-2 text-sm text-yellow-700 dark:text-yellow-400">
          Tus códigos están desactivados: ya no atribuyen consultas nuevas. Lo ya registrado se conserva.
        </p>
      )}
      {summary.links.length === 0 ? (
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Aún no tienes códigos asignados.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {summary.links.map(link => {
            const url = referralUrl(origin, link.code, link.slug);
            return (
              <li key={link.id} className="space-y-2 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  <code>{link.code}</code> · {link.propertyId ? (link.titles ? title(link.titles) : 'Propiedad no publicada') : 'Todo el sitio'}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">Consultas: {link.inquiryCount} · Reservas: {link.bookingCount}</p>
                <p className="break-all text-sm"><code data-referral-url={url} className="select-all">{url}</code></p>
                <CopyLinkButton url={url} />
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
