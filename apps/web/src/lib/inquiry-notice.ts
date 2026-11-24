import 'server-only';
// T-5211 (app del vendedor, Task 7): aviso por correo cuando entra una consulta (formulario público o «Apartar» del
// vendedor) a los ADMIN y al dueño de la casa, un correo por persona (nadie ve el correo de los demás) y sin repetir.
// Lleva casa, fechas, cliente, contacto y mensaje (todo escapado) y el enlace a las consultas del panel
// (/admin/mensajes, que filtra por rol en el servidor). NUNCA lleva comisión ni atribución. Nunca rompe la consulta:
// cada envío se intenta por separado y un fallo solo se registra.
import { db, messages, properties, users } from '@portal/db';
import { eq } from 'drizzle-orm';
import { sendEmail } from '@/lib/mailer';
import { civilDate, escapeHtml, nightsBetween } from './booking-emails';
import { localizedUrl } from './seo';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function sendInquiryNotice(messageId: string, origin: 'public' | 'vendor'): Promise<{ sent: string[] }> {
  const [row] = await db.select({
    name: messages.name, email: messages.email, phone: messages.phone, body: messages.body,
    startDate: messages.startDate, endDate: messages.endDate, userId: messages.userId,
    title: properties.titleEs, ownerId: properties.ownerId,
  }).from(messages).innerJoin(properties, eq(properties.id, messages.propertyId)).where(eq(messages.id, messageId)).limit(1);
  if (!row) return { sent: [] };

  const [admins, [owner], [seller]] = await Promise.all([
    db.select({ email: users.email }).from(users).where(eq(users.role, 'ADMIN')),
    row.ownerId ? db.select({ email: users.email }).from(users).where(eq(users.id, row.ownerId)).limit(1) : Promise.resolve([]),
    origin === 'vendor' && row.userId ? db.select({ name: users.name, email: users.email }).from(users).where(eq(users.id, row.userId)).limit(1) : Promise.resolve([]),
  ]);
  const recipients = [...new Set([...admins.map(admin => admin.email), owner?.email]
    .filter((email): email is string => typeof email === 'string' && EMAIL.test(email.trim()))
    .map(email => email.trim().toLowerCase()))];

  const start = row.startDate ? String(row.startDate) : null, end = row.endDate ? String(row.endDate) : null;
  const subject = origin === 'vendor'
    ? `Apartado por ${seller?.name || seller?.email || 'un vendedor'} — ${row.title}`
    : `Nueva consulta — ${row.title}`;
  const line = (label: string, value: string) => `<p style="margin: 4px 0;"><strong>${label}:</strong> ${value}</p>`;
  const html = `<div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; color: #29251f;">
    <h2 style="margin: 0 0 12px;">${escapeHtml(subject)}</h2>
    <div style="background: #f5f1ea; border-radius: 8px; padding: 16px; margin: 16px 0;">
      ${line('Casa', escapeHtml(row.title))}
      ${start && end ? line('Llegada', escapeHtml(civilDate(start))) + line('Salida', escapeHtml(civilDate(end))) + line('Noches', String(nightsBetween(start, end))) : ''}
      ${line('Cliente', escapeHtml(row.name))}
      ${row.email ? line('Correo', escapeHtml(row.email)) : ''}
      ${row.phone ? line('Teléfono', escapeHtml(row.phone)) : ''}
      ${row.body ? `<p style="margin: 12px 0 0; white-space: pre-line;">${escapeHtml(row.body)}</p>` : ''}
    </div>
    <p><a href="${escapeHtml(localizedUrl('es', '/admin/mensajes'))}" style="color: #2f6b3a; font-weight: bold;">Ver la consulta en el panel</a></p>
  </div>`;

  const sent: string[] = [];
  for (const to of recipients) {
    try { await sendEmail({ to, subject, html }); sent.push(to); }
    catch (error) { console.error('Falló el aviso de consulta (la consulta quedó guardada):', to, error); }
  }
  return { sent };
}
