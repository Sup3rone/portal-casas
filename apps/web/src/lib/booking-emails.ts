import 'server-only';
// T-4772: correo de confirmación de reserva — huésped + copia al dueño de la casa. Casa y dirección,
// llegada/salida, noches, importes del desglose guardado al confirmar (T-4738) y folio. Fechas civiles
// formateadas en UTC (sin desfase de zona horaria) y todo dato de texto escapado. Nunca rompe la reserva:
// quien lo llama captura los errores.
import { db, bookings, messages, properties, users } from '@portal/db';
import { and, eq } from 'drizzle-orm';
import { sendEmail } from '@/lib/mailer';
import { breakdownTotal, formatMoney } from './booking-breakdown';
import { propertyLocation } from './destinations';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DAY = 86_400_000;

export function escapeHtml(value: unknown) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);
}

/** «1 de agosto de 2027» para una fecha civil YYYY-MM-DD, sin depender de la zona del servidor. */
export function civilDate(value: string) {
  return new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`));
}

export const nightsBetween = (start: string, end: string) => Math.round((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / DAY);
export const bookingFolio = (id: string) => id.replace(/-/g, '').slice(0, 8).toUpperCase();

export type ConfirmationData = {
  bookingId: string; startDate: string; endDate: string;
  rentAmount: string | null; cleaningCost: string | null; taxes: string | null;
  property: { title: string; address: string; location: string };
  guest: { name: string; email: string | null; phone: string | null };
};

function detailRows(data: ConfirmationData) {
  const nights = nightsBetween(data.startDate, data.endDate);
  const total = breakdownTotal([data.rentAmount, data.cleaningCost, data.taxes]);
  const row = (label: string, value: string) => `<p style="margin: 4px 0;"><strong>${label}:</strong> ${value}</p>`;
  return [
    row('Folio', escapeHtml(bookingFolio(data.bookingId))),
    row('Propiedad', escapeHtml(data.property.title)),
    row('Dirección', escapeHtml([data.property.address, data.property.location].filter(Boolean).join(', '))),
    row('Llegada', escapeHtml(civilDate(data.startDate))),
    row('Salida', escapeHtml(civilDate(data.endDate))),
    row('Noches', String(nights)),
    ...(total ? [
      ...(data.rentAmount ? [row('Renta', escapeHtml(formatMoney(data.rentAmount, 'es')))] : []),
      ...(data.cleaningCost ? [row('Aseo', escapeHtml(formatMoney(data.cleaningCost, 'es')))] : []),
      ...(data.taxes ? [row('Impuestos', escapeHtml(formatMoney(data.taxes, 'es')))] : []),
      row('Total', `<strong>${escapeHtml(formatMoney(total, 'es'))}</strong>`),
    ] : []),
  ].join('');
}

const box = (inner: string) => `<div style="background: #f5f1ea; border-radius: 8px; padding: 16px; margin: 16px 0;">${inner}</div>`;
const wrap = (inner: string) => `<div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; color: #29251f;">${inner}</div>`;

export function guestConfirmationEmail(data: ConfirmationData) {
  return {
    subject: `Reserva confirmada — ${data.property.title} (folio ${bookingFolio(data.bookingId)})`,
    html: wrap(`
      <h2 style="color: #654838;">Su reserva está confirmada</h2>
      <p>Hola ${escapeHtml(data.guest.name || 'huésped')},</p>
      <p>Esta es la confirmación de lo que se reservó:</p>
      ${box(detailRows(data))}
      <p>Si tiene alguna duda, responda a este correo e indique su folio.</p>
      <p style="font-size: 13px; color: #666;">Gracias por su confianza.</p>`),
  };
}

export function ownerCopyEmail(data: ConfirmationData) {
  const guest = [
    `<p style="margin: 4px 0;"><strong>Huésped:</strong> ${escapeHtml(data.guest.name || '—')}</p>`,
    `<p style="margin: 4px 0;"><strong>Correo:</strong> ${escapeHtml(data.guest.email || '—')}</p>`,
    `<p style="margin: 4px 0;"><strong>Teléfono:</strong> ${escapeHtml(data.guest.phone || '—')}</p>`,
  ].join('');
  return {
    subject: `Copia: reserva confirmada — ${data.property.title} (folio ${bookingFolio(data.bookingId)})`,
    html: wrap(`
      <h2 style="color: #654838;">Se confirmó una reserva en su propiedad</h2>
      ${box(detailRows(data) + guest)}
      <p style="font-size: 13px; color: #666;">Copia automática para el dueño. El huésped recibió su propia confirmación${data.guest.email ? '' : ' (no: la reserva no tenía correo del huésped)'}.</p>`),
  };
}

/**
 * Lee la reserva recién creada y envía la confirmación al huésped y la copia al dueño de la casa.
 * guestEmail/guestName vienen del gestor (consulta); el correo de la cuenta del huésped manda si existe.
 * Cada envío es independiente: si uno falla, el otro sigue. Devuelve a quién se envió.
 */
export async function sendBookingConfirmation(bookingId: string, input: { guestName?: unknown; guestEmail?: unknown; messageId?: unknown }) {
  const [row] = await db.select({
    id: bookings.id, startDate: bookings.startDate, endDate: bookings.endDate, guestUserId: bookings.guestUserId,
    rentAmount: bookings.rentAmount, cleaningCost: bookings.cleaningCost, taxes: bookings.taxes, propertyId: bookings.propertyId,
    title: properties.titleEs, address: properties.address, state: properties.state, destinationCity: properties.destinationCity, city: properties.city,
    ownerEmail: users.email,
  }).from(bookings).innerJoin(properties, eq(properties.id, bookings.propertyId)).innerJoin(users, eq(users.id, properties.ownerId))
    .where(eq(bookings.id, bookingId)).limit(1);
  if (!row) return { guest: null, owner: null };

  let name = typeof input.guestName === 'string' ? input.guestName.trim().slice(0, 120) : '';
  let email = typeof input.guestEmail === 'string' && EMAIL.test(input.guestEmail.trim()) ? input.guestEmail.trim() : null;
  let phone: string | null = null;
  if (row.guestUserId) {
    const [guest] = await db.select({ email: users.email, name: users.name, phone: users.phone }).from(users).where(eq(users.id, row.guestUserId)).limit(1);
    if (guest) { email = guest.email; name ||= guest.name ?? ''; phone = guest.phone; }
  }
  if (typeof input.messageId === 'string' && input.messageId) {
    // Solo una consulta de la misma casa aporta contacto (no se filtran datos de otras propiedades).
    const [message] = await db.select({ name: messages.name, email: messages.email, phone: messages.phone }).from(messages)
      .where(and(eq(messages.id, input.messageId), eq(messages.propertyId, row.propertyId))).limit(1);
    if (message) { name ||= message.name; email ||= message.email; phone ||= message.phone; }
  }

  const data: ConfirmationData = {
    bookingId: row.id, startDate: String(row.startDate), endDate: String(row.endDate),
    rentAmount: row.rentAmount, cleaningCost: row.cleaningCost, taxes: row.taxes,
    property: { title: row.title, address: row.address, location: propertyLocation(row) },
    guest: { name, email, phone },
  };
  const sent = { guest: null as string | null, owner: null as string | null };
  if (email) {
    try { await sendEmail({ to: email, ...guestConfirmationEmail(data) }); sent.guest = email; }
    catch (error) { console.error('Fallo la confirmación al huésped (reserva OK):', error); }
  }
  if (row.ownerEmail && row.ownerEmail.toLowerCase() !== email?.toLowerCase()) {
    try { await sendEmail({ to: row.ownerEmail, ...ownerCopyEmail(data) }); sent.owner = row.ownerEmail; }
    catch (error) { console.error('Fallo la copia al dueño (reserva OK):', error); }
  }
  return sent;
}
