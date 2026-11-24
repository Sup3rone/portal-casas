// Cotización de una estancia con las tarifas de la propiedad. Regla ÚNICA, compartida por el formulario público
// (MessageForm) y la renta automática de la reserva (T-4738), para que el panel cobre lo mismo que vio el huésped:
// - Se cobra cada noche desde la entrada hasta la víspera de la salida (el checkout no se cobra).
// - Fin de semana = noche de sábado o domingo; el resto, entre semana.
// - Si la noche cae en una temporada (inicio y fin INCLUSIVOS), gana la de mayor prioridad; si no, la tarifa base.
// - Si alguna noche no tiene precio, el total es null (no se inventa).
// Fechas civiles 'YYYY-MM-DD' calculadas en UTC: el día de la semana no depende de la zona horaria.

export type StayPricing = {
  base: { weekday: number | null; weekend: number | null };
  seasons: { start: string; end: string; weekday: number; weekend: number; priority: number; name?: string }[];
  booked?: { start: string; end: string }[];
};

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const day = (value: string) => new Date(`${value}T00:00:00Z`);
const iso = (date: Date) => date.toISOString().slice(0, 10);

/** Noche por noche con la regla de arriba (T-5208: la cotización del vendedor lista las líneas). null = rango inválido. */
export function stayNights(startDate: string, endDate: string, pricing: StayPricing) {
  if (!DATE.test(startDate) || !DATE.test(endDate)) return null;
  const start = day(startDate), end = day(endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) return null;
  const nights: { date: string; weekend: boolean; season: string | null; price: number | null; booked: boolean }[] = [];
  for (let date = start; date < end; date = new Date(date.getTime() + 86_400_000)) {
    const today = iso(date), weekend = date.getUTCDay() === 0 || date.getUTCDay() === 6;
    const season = pricing.seasons.filter(s => today >= s.start && today <= s.end).sort((a, b) => b.priority - a.priority)[0];
    const price = season ? (weekend ? season.weekend : season.weekday) : (weekend ? pricing.base.weekend : pricing.base.weekday);
    nights.push({ date: today, weekend, season: season ? season.name ?? '' : null, price: price ?? null, booked: Boolean(pricing.booked?.some(b => today >= b.start && today < b.end)) });
  }
  return nights;
}

export function quoteStay(startDate: string, endDate: string, pricing: StayPricing) {
  const nights = stayNights(startDate, endDate, pricing);
  if (!nights) return null;
  const missing = nights.some(night => night.price == null);
  return { total: missing ? null : nights.reduce((sum, night) => sum + (night.price ?? 0), 0), nights: nights.length, overlap: nights.some(night => night.booked) };
}
