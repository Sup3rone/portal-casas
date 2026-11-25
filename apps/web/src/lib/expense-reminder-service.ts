import 'server-only';
// T-5248 (fase 4): aviso diario por correo al COLABORADOR dueño de cada casa: pagos recurrentes y mantenimientos que
// vencen hoy o en REMINDER_LEAD_DAYS días, más lo atrasado sin pagar. El ADMIN no recibe (solo administra
// funcionalidades). Va a la cuenta del colaborador (User.email), no a los destinatarios del reporte mensual.
import { db, expenseEntries, expenseReminderDeliveries, expenseTypes, maintenances, properties, recurringExpenses, users } from '@portal/db';
import { and, eq, inArray, isNotNull } from 'drizzle-orm';
import { getTranslations } from 'next-intl/server';
import { sendEmail } from '@/lib/mailer';
import { formatMoney } from './booking-breakdown';
import { buildReminders, type ReminderItem, type ReminderWhen } from './expense-reminders';
import { localizedUrl } from './seo';

const html = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const intlLocale = (locale: string) => locale === 'en' ? 'en-GB' : locale === 'fr' ? 'fr-FR' : 'es-MX';
const day = (value: string, locale: string) =>
  new Intl.DateTimeFormat(intlLocale(locale), { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(value + 'T00:00:00Z'));
// Errores de BD (traen SQL y parámetros) no se guardan tal cual: solo un código; el detalle va al log.
function errorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /failed query|neondberror|syntax|relation|column/i.test(message) ? 'INTERNAL_ERROR' : message.slice(0, 300);
}

type Owner = { id: string; name: string | null; email: string };
type PropertyRow = { id: string; ownerId: string | null; slug: string; titleEs: string | null };

/** Datos de todas las casas de colaboradores en 4 consultas (no una por colaborador). */
async function loadReminderData() {
  const owners: Owner[] = await db.select({ id: users.id, name: users.name, email: users.email }).from(users)
    .where(and(eq(users.role, 'COLLABORATOR'), isNotNull(users.email)));
  if (!owners.length) return { owners, props: [], recurring: [], entries: [], maint: [], typeNames: new Map<string, string>() };
  const props: PropertyRow[] = await db.select({ id: properties.id, ownerId: properties.ownerId, slug: properties.slug, titleEs: properties.titleEs })
    .from(properties).where(inArray(properties.ownerId, owners.map(owner => owner.id)));
  const ids = props.map(row => row.id);
  if (!ids.length) return { owners, props, recurring: [], entries: [], maint: [], typeNames: new Map<string, string>() };
  const [recurring, maint, types] = await Promise.all([
    db.select({ id: recurringExpenses.id, propertyId: recurringExpenses.propertyId, typeId: recurringExpenses.typeId,
      periodicity: recurringExpenses.periodicity, amount: recurringExpenses.amount, startDate: recurringExpenses.startDate })
      .from(recurringExpenses).where(and(inArray(recurringExpenses.propertyId, ids), eq(recurringExpenses.active, true))),
    db.select({ id: maintenances.id, propertyId: maintenances.propertyId, title: maintenances.title, status: maintenances.status, startDate: maintenances.startDate })
      .from(maintenances).where(and(inArray(maintenances.propertyId, ids), eq(maintenances.status, 'pendiente'), isNotNull(maintenances.startDate))),
    db.select({ id: expenseTypes.id, name: expenseTypes.name }).from(expenseTypes),
  ]);
  const entries = recurring.length ? await db.select({ recurringExpenseId: expenseEntries.recurringExpenseId, date: expenseEntries.date, paid: expenseEntries.paid })
    .from(expenseEntries).where(and(inArray(expenseEntries.recurringExpenseId, recurring.map(row => row.id)), eq(expenseEntries.paid, true))) : [];
  return { owners, props, recurring, entries: entries.map(row => ({ ...row, paid: Boolean(row.paid) })), maint, typeNames: new Map(types.map(row => [row.id, row.name])) };
}

/** Cuerpo del correo. Todo lo que escribe el usuario (casa, título, nombre) va escapado. */
export async function reminderEmail(owner: { name: string | null }, today: string, soon: string, items: ReminderItem[],
  propertyTitle: (id: string) => string, typeName: (id: string) => string, locale = 'es') {
  const t = await getTranslations({ locale, namespace: 'expenseReminders' });
  const groups: { when: ReminderWhen; heading: string }[] = [
    { when: 'today', heading: t('dueToday', { date: day(today, locale) }) },
    { when: 'soon', heading: t('dueSoon', { date: day(soon, locale) }) },
    { when: 'overdue', heading: t('overdue') },
  ];
  const line = (item: ReminderItem) => {
    const link = localizedUrl(locale, `/panel/propiedades/${encodeURIComponent(item.propertyId)}/gastos`);
    const text = item.kind === 'payment'
      ? t('paymentLine', { property: propertyTitle(item.propertyId), type: typeName(item.typeId), date: day(item.date, locale), amount: formatMoney(item.amount, locale) })
      : t('maintenanceLine', { property: propertyTitle(item.propertyId), title: item.title, date: day(item.date, locale) });
    return `<li style="margin:4px 0"><a href="${html(link)}">${html(text)}</a></li>`;
  };
  const body = groups.map(group => {
    const list = items.filter(item => item.when === group.when);
    return list.length ? `<h3 style="margin:16px 0 4px">${html(group.heading)}</h3><ul style="padding-left:18px;margin:0">${list.map(line).join('')}</ul>` : '';
  }).join('');
  return {
    subject: t('emailSubject', { date: day(today, locale) }),
    html: `<div style="font-family:sans-serif;max-width:560px"><p>${html(t('emailIntro', { name: owner.name ?? '' }))}</p>${body}`
      + `<p style="color:#666;font-size:13px;margin-top:16px">${html(t('emailFooter'))}</p></div>`,
  };
}

/**
 * Cron diario. Por colaborador: arma el aviso; si nada vence hoy ni en 3 días, no se escribe nada. Antes de enviar
 * RESERVA una fila 'pending' bajo el índice único parcial (userId, day) → un segundo cron el mismo día da 'skipped'.
 * Si el envío falla, la fila pasa a 'failed' (libera el hueco para reintentar). Nunca lanza por un colaborador:
 * el resultado de cada uno va en el resumen.
 */
export async function runExpenseReminders(today: string) {
  const data = await loadReminderData();
  const propsByOwner = new Map<string, PropertyRow[]>();
  for (const row of data.props) if (row.ownerId) propsByOwner.set(row.ownerId, [...(propsByOwner.get(row.ownerId) ?? []), row]);
  const results: { userId: string; status: 'sent' | 'failed' | 'skipped'; items: number; error?: string }[] = [];
  for (const owner of data.owners) {
    const own = propsByOwner.get(owner.id) ?? [];
    if (!own.length) continue;
    const ids = new Set(own.map(row => row.id));
    const recurring = data.recurring.filter(row => ids.has(row.propertyId));
    const recurringIds = new Set(recurring.map(row => row.id));
    const plan = buildReminders(today, recurring, data.entries.filter(row => row.recurringExpenseId && recurringIds.has(row.recurringExpenseId)),
      data.maint.filter(row => ids.has(row.propertyId)));
    if (!plan.shouldSend) continue;
    const claimId = crypto.randomUUID();
    const claimed = await db.insert(expenseReminderDeliveries)
      .values({ id: claimId, userId: owner.id, day: today, status: 'pending', itemCount: plan.items.length, error: null, createdAt: new Date() })
      .onConflictDoNothing().returning({ id: expenseReminderDeliveries.id });
    if (!claimed.length) { results.push({ userId: owner.id, status: 'skipped', items: plan.items.length }); continue; }
    const titles = new Map(own.map(row => [row.id, row.titleEs || row.slug]));
    try {
      const message = await reminderEmail(owner, today, plan.soon, plan.items, id => titles.get(id) ?? id, id => data.typeNames.get(id) ?? id);
      await sendEmail({ kind: 'expense-reminder', to: owner.email, ...message });
      try { await db.update(expenseReminderDeliveries).set({ status: 'sent' }).where(eq(expenseReminderDeliveries.id, claimId)); }
      catch (logError) { console.error('Aviso de gastos enviado pero no se pudo registrar como sent:', logError); }
      results.push({ userId: owner.id, status: 'sent', items: plan.items.length });
    } catch (error) {
      const message = errorMessage(error);
      console.error(`Aviso de gastos ${today} para ${owner.id} falló:`, error);
      try { await db.update(expenseReminderDeliveries).set({ status: 'failed', error: message }).where(eq(expenseReminderDeliveries.id, claimId)); }
      catch (logError) { console.error('Tampoco se pudo registrar el fallo del aviso de gastos:', logError); }
      results.push({ userId: owner.id, status: 'failed', items: plan.items.length, error: message });
    }
  }
  return { day: today, sent: results.filter(r => r.status === 'sent').length, failed: results.filter(r => r.status === 'failed').length,
    skipped: results.filter(r => r.status === 'skipped').length, results };
}
