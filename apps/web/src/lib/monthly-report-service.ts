import 'server-only';
// T-4739: reporte mensual del COLABORADOR (sus propiedades). El ADMIN administra funcionalidades y no usa
// este reporte: página, descarga, destinatarios y envío manual responden 404/403 a cualquier rol ≠ COLLABORATOR.
// Datos personales: del huésped solo el nombre (sin correo ni teléfono), igual en pantalla, Excel y correo.
import { db, bookings, partners, properties, reportDeliveries, users } from '@portal/db';
import { and, desc, eq, gt, isNotNull, lt, ne, sql } from 'drizzle-orm';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { AccessError, managedResource, requirePropertyManager, type PropertyManager } from './property-access';
import { PanelValidationError } from './panel-validation';
import { sendEmail } from '@/lib/mailer';
import { buildMonthlyReport, isMonth, monthRange, type MonthlyReport, type ReportBooking } from './monthly-report';
import { buildXlsx, type Row } from './xlsx';
import { buildPdf } from './pdf';
import { formatMoney } from './booking-breakdown';
import { expenseReportFilename, expenseReportPdf, expenseReportPdfFilename, expenseReportXlsx, loadExpenseReport } from './expense-report-service';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MAX_REPORT_EMAILS = 2;

export async function requireReportOwner() {
  const manager = await requirePropertyManager();
  if (manager.role !== 'COLLABORATOR') throw new AccessError(403);
  return manager;
}
export async function reportPage() {
  try { return await requireReportOwner(); }
  catch (error) { if (error instanceof AccessError) notFound(); throw error; }
}

const title = (row: { titleEs: string | null; titleEn: string | null; titleFr: string | null; slug: string }, locale: string) =>
  (locale === 'en' ? row.titleEn : locale === 'fr' ? row.titleFr : row.titleEs) || row.slug;

/** Reservas (no bloqueos) de las propiedades del colaborador que tocan el mes; filtro opcional por referidor. */
export async function loadMonthlyReport(manager: PropertyManager, month: string, partnerId: string | null, locale = 'es'): Promise<MonthlyReport> {
  const { start, end } = monthRange(month);
  const rows = await db.select({
    id: bookings.id, propertyId: bookings.propertyId, startDate: bookings.startDate, endDate: bookings.endDate,
    rentAmount: bookings.rentAmount, cleaningCost: bookings.cleaningCost, taxes: bookings.taxes, commissionPercent: bookings.commissionPercent,
    guestName: users.name, referredBy: partners.name,
    slug: properties.slug, titleEs: properties.titleEs, titleEn: properties.titleEn, titleFr: properties.titleFr,
  }).from(bookings).innerJoin(properties, eq(properties.id, bookings.propertyId))
    .leftJoin(users, eq(users.id, bookings.guestUserId)).leftJoin(partners, eq(partners.id, bookings.referredByPartnerId))
    .where(and(ne(bookings.source, 'host-block'), managedResource(bookings.propertyId, manager),
      lt(bookings.startDate, end), gt(bookings.endDate, start),
      partnerId ? eq(bookings.referredByPartnerId, partnerId) : undefined));
  return buildMonthlyReport(month, rows.map(({ slug, titleEs, titleEn, titleFr, ...row }): ReportBooking =>
    ({ ...row, propertyTitle: title({ slug, titleEs, titleEn, titleFr }, locale) })));
}

/** Colaboradores referidores presentes en las reservas del dueño (para el filtro). */
export async function reportPartnerOptions(manager: PropertyManager) {
  return db.selectDistinct({ id: partners.id, name: partners.name }).from(bookings)
    .innerJoin(partners, eq(partners.id, bookings.referredByPartnerId))
    .where(and(isNotNull(bookings.referredByPartnerId), managedResource(bookings.propertyId, manager)))
    .orderBy(partners.name);
}

/** Filas del Excel (mismo contenido que la tabla del panel). Fechas ISO 'YYYY-MM-DD': sin ambigüedad ni zona. */
export async function reportSheet(report: MonthlyReport, locale: string) {
  const t = await getTranslations({ locale, namespace: 'monthlyReport' });
  const money = (value: string | null) => value == null ? null : { number: value };
  const header: Row = { bold: true, header: true, cells: [t('property'), t('checkIn'), t('checkOut'), t('nights'), t('crossing'), t('guest'), t('referredBy'),
    t('rent'), t('cleaning'), t('taxes'), t('total'), t('percent'), t('commission')] };
  const rows: Row[] = [header];
  for (const group of report.groups) {
    for (const line of group.lines) {
      const crossing = line.kind === 'continuation' ? t('continuation', { month: line.countedIn })
        : line.nightsOtherMonths > 0 ? t('crossesNext', { here: line.nightsThisMonth, total: line.nights, next: line.nightsOtherMonths }) : '';
      rows.push({ cells: [line.propertyTitle, line.startDate, line.endDate, `${line.nightsThisMonth}/${line.nights}`, crossing,
        line.guestName ?? '', line.referredBy ?? '', money(line.rentAmount), money(line.cleaningCost), money(line.taxes), money(line.total),
        line.kind === 'entry' && line.commissionPercent != null ? { number: line.commissionPercent } : null, money(line.commission)] });
    }
    rows.push({ bold: true, cells: [t('subtotal', { property: group.propertyTitle }), '', '', '', '', '', '', money(group.totals.rentAmount),
      money(group.totals.cleaningCost), money(group.totals.taxes), money(group.totals.total), null, money(group.totals.commission)] });
  }
  rows.push({ bold: true, cells: [t('grandTotal', { count: report.totals.bookings }), '', '', '', '', '', '', money(report.totals.rentAmount),
    money(report.totals.cleaningCost), money(report.totals.taxes), money(report.totals.total), null, money(report.totals.commission)] });
  return rows;
}
const REPORT_WIDTHS = [32, 12, 12, 9, 34, 24, 22, 14, 12, 12, 14, 10, 14];
export async function reportXlsx(report: MonthlyReport, locale: string) {
  return buildXlsx(`${report.month}`, await reportSheet(report, locale), REPORT_WIDTHS);
}
/** T-5417: las MISMAS filas que el Excel, con el título del reporte arriba (la hoja de Excel no lo lleva). */
export async function reportPdf(report: MonthlyReport, locale: string) {
  const t = await getTranslations({ locale, namespace: 'monthlyReport' });
  const title = t('emailSubject', { month: report.month });
  return buildPdf(title, [{ bold: true, cells: [title] }, { cells: [] }, ...await reportSheet(report, locale)], REPORT_WIDTHS, { locale });
}
export const reportFilename = (month: string) => `reporte-comisiones-${month}.xlsx`;
export const reportPdfFilename = (month: string) => `reporte-comisiones-${month}.pdf`;

export async function getReportEmails(userId: string) {
  const [row] = await db.select({ emails: users.reportEmails }).from(users).where(eq(users.id, userId)).limit(1);
  return Array.isArray(row?.emails) ? row.emails : [];
}
export function validateReportEmails(input: unknown) {
  const raw = input && typeof input === 'object' && !Array.isArray(input) ? (input as Record<string, unknown>).emails : undefined;
  if (!Array.isArray(raw) || raw.length > MAX_REPORT_EMAILS || raw.some(value => typeof value !== 'string')) throw new PanelValidationError('validation');
  const emails = (raw as string[]).map(value => value.trim().toLowerCase()).filter(Boolean);
  if (emails.some(email => email.length > 254 || !EMAIL.test(email))) throw new PanelValidationError('validation');
  return [...new Set(emails)];
}
export async function setReportEmails(input: unknown) {
  const manager = await requireReportOwner();
  const emails = validateReportEmails(input);
  await db.update(users).set({ reportEmails: emails }).where(and(eq(users.id, manager.id), eq(users.role, 'COLLABORATOR')));
  return { emails };
}

export async function listDeliveries(userId: string, limit = 12) {
  return db.select().from(reportDeliveries).where(eq(reportDeliveries.userId, userId)).orderBy(desc(reportDeliveries.createdAt)).limit(limit);
}

// Errores de BD (traen SQL y parámetros) no se muestran en el panel: solo un código; el detalle va al log.
function errorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /failed query|neondberror|syntax|relation|column/i.test(message) ? 'INTERNAL_ERROR' : message.slice(0, 300);
}
const html = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

/** Límite anti-abuso del envío manual (los destinatarios los elige el propio colaborador). */
export const MANUAL_SENDS_PER_DAY = 3;

/**
 * Arma y envía el Excel del mes a los destinatarios del colaborador y deja SIEMPRE su fila en la bitácora
 * (sent/failed). Nunca lanza por un fallo de envío: el estado se devuelve y queda visible en /panel/reporte.
 * `claimId`: fila 'pending' ya reservada por el cron (se actualiza en lugar de insertar).
 */
export async function deliverMonthlyReport(owner: { id: string; name: string | null }, month: string, trigger: 'cron' | 'manual', locale = 'es', claimId?: string) {
  const recipients = await getReportEmails(owner.id);
  const record = (status: 'sent' | 'failed', bookingCount: number, error: string | null) => claimId
    ? db.update(reportDeliveries).set({ status, recipients, bookingCount, error }).where(eq(reportDeliveries.id, claimId))
    : db.insert(reportDeliveries).values({ id: crypto.randomUUID(), userId: owner.id, month, trigger, status, recipients, bookingCount, error, createdAt: new Date() });
  if (!recipients.length) { await record('failed', 0, 'NO_RECIPIENTS'); return { status: 'failed' as const, error: 'NO_RECIPIENTS', bookingCount: 0 }; }
  let bookingCount = 0;
  try {
    const manager: PropertyManager = { id: owner.id, role: 'COLLABORATOR', canPublishProperties: false };
    const report = await loadMonthlyReport(manager, month, null, locale);
    bookingCount = report.totals.bookings;
    const t = await getTranslations({ locale, namespace: 'monthlyReport' });
    const file = await reportXlsx(report, locale);
    // T-5248 (fase 3): el Excel de gastos y mantenimientos va como segundo adjunto si el mes tiene algo. Si falla
    // armarlo, se manda igual el de comisiones (nunca se pierde el reporte principal por el secundario).
    // T-5417: cada reporte va en Excel (para hacer cuentas) y en PDF (para leerlo), en ese orden.
    const attachments = [{ filename: reportFilename(month), content: Buffer.from(file) },
      { filename: reportPdfFilename(month), content: Buffer.from(await reportPdf(report, locale)) }];
    let expenseLine = '';
    try {
      const expenses = await loadExpenseReport(manager, month, locale);
      if (expenses.groups.length) {
        const [sheet, pdf] = await Promise.all([expenseReportXlsx(expenses, locale), expenseReportPdf(expenses, locale)]);
        attachments.push({ filename: expenseReportFilename(month), content: Buffer.from(sheet) },
          { filename: expenseReportPdfFilename(month), content: Buffer.from(pdf) });
        const e = await getTranslations({ locale, namespace: 'expenseReport' });
        expenseLine = `<p>${html(e('emailLine', { paid: formatMoney(expenses.totals.paid, locale), pending: formatMoney(expenses.totals.pending, locale), count: expenses.totals.maintenances }))}</p>`;
      }
    } catch (expenseError) { console.error(`Reporte de gastos ${month} para ${owner.id} no se adjuntó:`, expenseError); }
    // Todo lo interpolado en el HTML se escapa (el nombre lo controla el usuario).
    await sendEmail({
      kind: 'monthly-report',
      to: recipients,
      subject: t('emailSubject', { month }),
      html: `<div style="font-family:sans-serif;max-width:520px"><p>${html(t('emailIntro', { month, name: owner.name ?? '' }))}</p>`
        + `<p>${html(t('emailTotals', { count: bookingCount, total: formatMoney(report.totals.total, locale), commission: formatMoney(report.totals.commission, locale) }))}</p>`
        + expenseLine
        + `<p style="color:#666;font-size:13px">${html(t('emailFooter'))}</p></div>`,
      attachments,
    });
    try { await record('sent', bookingCount, null); }
    catch (logError) { console.error('Reporte enviado pero no se pudo registrar como sent:', logError); }
    return { status: 'sent' as const, error: null, bookingCount };
  } catch (error) {
    const message = errorMessage(error);
    console.error(`Reporte mensual ${month} para ${owner.id} falló:`, error);
    try { await record('failed', bookingCount, message); }
    catch (logError) { console.error('Tampoco se pudo registrar el fallo del reporte mensual:', logError); }
    return { status: 'failed' as const, error: message, bookingCount };
  }
}

/** Envío manual (o reenvío) desde el panel del propio colaborador; máx. MANUAL_SENDS_PER_DAY en 24 h. */
export async function sendOwnReport(input: unknown, now = new Date()) {
  const manager = await requireReportOwner();
  const month = input && typeof input === 'object' ? (input as Record<string, unknown>).month : undefined;
  if (!isMonth(month)) throw new PanelValidationError('validation');
  const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(reportDeliveries)
    .where(and(eq(reportDeliveries.userId, manager.id), eq(reportDeliveries.trigger, 'manual'), gt(reportDeliveries.createdAt, new Date(now.getTime() - 86_400_000))));
  if (Number(count) >= MANUAL_SENDS_PER_DAY) return { status: 'failed' as const, error: 'RATE_LIMITED', bookingCount: 0 };
  const [owner] = await db.select({ id: users.id, name: users.name }).from(users).where(eq(users.id, manager.id)).limit(1);
  return deliverMonthlyReport(owner, month, 'manual');
}

/**
 * Cron mensual: a cada COLLABORATOR con destinatarios, el reporte del mes.
 * Idempotente y a prueba de concurrencia: antes de enviar se RESERVA una fila 'pending' (trigger cron) bajo el
 * índice único parcial (userId, month) WHERE trigger='cron' AND status IN ('pending','sent'). Un reintento de
 * Vercel o un curl simultáneo no puede reservar la misma → 'skipped'. Si el envío falla, la fila pasa a 'failed'
 * y libera el hueco para el siguiente intento. Si el proceso muere a mitad, la fila queda 'pending' y bloquea el
 * reenvío automático (mejor no duplicar): el colaborador puede usar «Enviar ahora».
 */
export async function runMonthlyReports(month: string) {
  const owners = await db.select({ id: users.id, name: users.name }).from(users)
    .where(and(eq(users.role, 'COLLABORATOR'), sql`jsonb_array_length(${users.reportEmails}) > 0`));
  const results = [];
  for (const owner of owners) {
    const claimId = crypto.randomUUID();
    const claimed = await db.insert(reportDeliveries)
      .values({ id: claimId, userId: owner.id, month, trigger: 'cron', status: 'pending', recipients: [], bookingCount: 0, error: null, createdAt: new Date() })
      .onConflictDoNothing().returning({ id: reportDeliveries.id });
    if (!claimed.length) { results.push({ userId: owner.id, status: 'skipped' as const }); continue; }
    results.push({ userId: owner.id, ...(await deliverMonthlyReport(owner, month, 'cron', 'es', claimId)) });
  }
  return { month, sent: results.filter(r => r.status === 'sent').length, failed: results.filter(r => r.status === 'failed').length,
    skipped: results.filter(r => r.status === 'skipped').length, results };
}
