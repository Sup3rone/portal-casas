// T-4683: aviso manual a limpieza por WhatsApp (wa.me con texto prellenado).
// Sin API ni envío automático: el admin revisa el mensaje y pulsa enviar en WhatsApp.

export type CleaningNotice = { phone: string; property: string; location: string };

/** Solo reservas reales: ni bloqueos de la dueña ni bloqueos manuales. */
export function isCleaningNoticeBooking(booking: { source: string; manualBlock?: boolean }) {
  return !booking.manualBlock && booking.source !== 'host-block';
}

/** Fecha legible sin desfase de zona horaria (YYYY-MM-DD se interpreta como día local). */
export function noticeDate(iso: string, locale: string) {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(locale === 'en' ? 'en-US' : locale === 'fr' ? 'fr-FR' : 'es-MX', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

export function cleaningNoticeHref(phone: string, text: string) {
  return /^[0-9]{8,15}$/.test(phone) ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}` : null;
}
