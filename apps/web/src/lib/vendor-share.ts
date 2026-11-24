// T-5208: texto de WhatsApp de una cotización del vendedor (puro). Lleva SOLO lo que el cliente puede ver: casa,
// fechas, noches, renta, limpieza, IVA, total y la ficha pública. NUNCA la comisión ni el WhatsApp de limpieza:
// por eso recibe campos sueltos de la cotización y no la lee entera al armar el texto.
import { formatMoney } from './booking-breakdown';
import type { VendorQuote } from './vendor-quote';

type Locale = 'es' | 'en' | 'fr';
const words: Record<Locale, { arrival: string; departure: string; nights: (count: number) => string; rent: string; cleaning: string; pending: string; taxes: string; total: string; noPrice: string; see: string }> = {
  es: { arrival: 'Llegada', departure: 'Salida', nights: count => count === 1 ? '1 noche' : `${count} noches`, rent: 'Renta', cleaning: 'Limpieza', pending: 'por confirmar', taxes: 'IVA (16 %)', total: 'Total', noPrice: 'Precio: por confirmar', see: 'Ver la casa' },
  en: { arrival: 'Check-in', departure: 'Check-out', nights: count => count === 1 ? '1 night' : `${count} nights`, rent: 'Rent', cleaning: 'Cleaning', pending: 'to be confirmed', taxes: 'VAT (16%)', total: 'Total', noPrice: 'Price: to be confirmed', see: 'See the house' },
  fr: { arrival: 'Arrivée', departure: 'Départ', nights: count => count === 1 ? '1 nuit' : `${count} nuits`, rent: 'Location', cleaning: 'Ménage', pending: 'à confirmer', taxes: 'TVA (16 %)', total: 'Total', noPrice: 'Prix : à confirmer', see: 'Voir la maison' },
};

export function quoteWhatsappText(
  quote: Pick<VendorQuote, 'nights' | 'rent' | 'cleaning' | 'taxes' | 'total'>,
  property: { title: string; publicUrl: string | null },
  dates: { start: string; end: string },
  locale: Locale,
) {
  const w = words[locale] ?? words.es;
  const date = (value: string) => new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(value + 'T00:00:00Z'));
  const money = (value: string) => formatMoney(value, locale);
  const lines = [`*${property.title}*`, `${w.arrival}: ${date(dates.start)}`, `${w.departure}: ${date(dates.end)}`, w.nights(quote.nights)];
  if (quote.total == null || quote.rent == null) lines.push(w.noPrice);
  else {
    lines.push(`${w.rent}: ${money(quote.rent)}`, `${w.cleaning}: ${quote.cleaning == null ? w.pending : money(quote.cleaning)}`);
    if (quote.taxes != null) lines.push(`${w.taxes}: ${money(quote.taxes)}`);
    lines.push(`*${w.total}: ${money(quote.total)}*`);
  }
  if (property.publicUrl) lines.push('', `${w.see}: ${property.publicUrl}`);
  return lines.join('\n');
}

/** wa.me sin número: el vendedor elige el chat del cliente. */
export const quoteWhatsappUrl = (text: string) => 'https://wa.me/?text=' + encodeURIComponent(text);
