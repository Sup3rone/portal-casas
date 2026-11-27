// T-5248 (fase 3): reporte mensual de gastos y mantenimientos (servidor). Solo para el COLABORADOR y sus casas
// (el ADMIN solo administra funcionalidades, igual que en el reporte de comisiones): mismo requireReportOwner y
// mismo corte managedResource. El Excel usa el generador propio (lib/xlsx.ts), una hoja con dos bloques.
import 'server-only';
import { db, expenseEntries, expenseTypes, maintenances, properties } from '@portal/db';
import { and, eq, gte, lt } from 'drizzle-orm';
import { getTranslations } from 'next-intl/server';
import { managedResource, type PropertyManager } from './property-access';
import { inquiryToday } from './inquiry-validation';
import { monthRange } from './monthly-report';
import { buildExpenseReport, type ExpenseReport } from './expense-report';
import { buildXlsx, type Row } from './xlsx';
import { buildPdf } from './pdf';
import { formatMoney } from './booking-breakdown';

const title = (row: { titleEs: string | null; titleEn: string | null; titleFr: string | null; slug: string }, locale: string) =>
  (locale === 'en' ? row.titleEn : locale === 'fr' ? row.titleFr : row.titleEs) || row.slug;

export async function loadExpenseReport(manager: PropertyManager, month: string, locale = 'es'): Promise<ExpenseReport> {
  const { start, end } = monthRange(month);
  const property = { titleEs: properties.titleEs, titleEn: properties.titleEn, titleFr: properties.titleFr, slug: properties.slug };
  const [payments, works] = await Promise.all([
    db.select({ id: expenseEntries.id, propertyId: expenseEntries.propertyId, date: expenseEntries.date, amount: expenseEntries.amount,
      paid: expenseEntries.paid, paidAt: expenseEntries.paidAt, recurringExpenseId: expenseEntries.recurringExpenseId, notes: expenseEntries.notes,
      typeName: expenseTypes.name, ...property })
      .from(expenseEntries)
      .innerJoin(properties, eq(properties.id, expenseEntries.propertyId))
      .innerJoin(expenseTypes, eq(expenseTypes.id, expenseEntries.typeId))
      .where(and(managedResource(expenseEntries.propertyId, manager), gte(expenseEntries.date, start), lt(expenseEntries.date, end))),
    db.select({ id: maintenances.id, propertyId: maintenances.propertyId, title: maintenances.title, kind: maintenances.kind, status: maintenances.status,
      budget: maintenances.budget, actualCost: maintenances.actualCost, startDate: maintenances.startDate, endDate: maintenances.endDate,
      createdAt: maintenances.createdAt, ...property })
      .from(maintenances)
      .innerJoin(properties, eq(properties.id, maintenances.propertyId))
      .where(managedResource(maintenances.propertyId, manager)),
  ]);
  return buildExpenseReport(month,
    payments.map(row => ({ id: row.id, propertyId: row.propertyId, propertyTitle: title(row, locale), date: row.date, typeName: row.typeName,
      amount: row.amount, paid: Boolean(row.paid), paidAt: row.paidAt, recurring: Boolean(row.recurringExpenseId), notes: row.notes })),
    works.map(row => ({ id: row.id, propertyId: row.propertyId, propertyTitle: title(row, locale), title: row.title, kind: row.kind, status: row.status,
      budget: row.budget, actualCost: row.actualCost, startDate: row.startDate, endDate: row.endDate,
      createdOn: inquiryToday(row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt)) })));
}

/** Una hoja: bloque de pagos y bloque de mantenimientos, con subtotales por casa. Fechas ISO, montos con 2 decimales. */
export async function expenseReportSheet(report: ExpenseReport, locale: string) {
  const t = await getTranslations({ locale, namespace: 'expenseReport' });
  const e = await getTranslations({ locale, namespace: 'expenses' });
  const money = (value: string | null) => value == null ? null : { number: value };
  const rows: Row[] = [{ bold: true, cells: [t('sheetTitle', { month: report.month })] }, { cells: [] }];
  rows.push({ bold: true, cells: [t('paymentsTitle')] });
  rows.push({ bold: true, header: true, cells: [t('property'), t('date'), t('type'), t('recurring'), t('amount'), t('status'), t('paidAt'), t('notes')] });
  for (const group of report.groups) for (const p of group.payments) {
    rows.push({ cells: [p.propertyTitle, p.date, p.typeName, p.recurring ? t('yes') : t('no'), money(p.amount), p.paid ? e('paid') : e('unpaid'), p.paidAt ?? '', p.notes ?? ''] });
  }
  rows.push({ bold: true, cells: [t('paymentsTotal', { count: report.totals.payments }), '', '', '', money(report.totals.total),
    `${e('paid')}: ${formatMoney(report.totals.paid, locale)} · ${e('unpaid')}: ${formatMoney(report.totals.pending, locale)}`] });
  rows.push({ cells: [] });
  rows.push({ bold: true, cells: [t('maintenanceTitle')] });
  rows.push({ bold: true, header: true, cells: [t('property'), t('work'), t('kind'), t('status'), t('start'), t('end'), t('budget'), t('actualCost'), t('overBudget')] });
  for (const group of report.groups) for (const m of group.maintenances) {
    rows.push({ cells: [m.propertyTitle, m.title, e(`kinds.${m.kind}`), e(`statuses.${m.status}`), m.startDate ?? '', m.endDate ?? '', money(m.budget), money(m.actualCost), m.overBudget ? t('yes') : ''] });
  }
  rows.push({ bold: true, cells: [t('maintenanceTotal', { count: report.totals.maintenances }), '', '', '', '', '', money(report.totals.budget), money(report.totals.actualCost),
    report.totals.overBudget ? String(report.totals.overBudget) : ''] });
  return rows;
}
const EXPENSE_WIDTHS = [32, 28, 16, 14, 14, 14, 14, 14, 14];
export async function expenseReportXlsx(report: ExpenseReport, locale: string) {
  return buildXlsx(`${report.month}`, await expenseReportSheet(report, locale), EXPENSE_WIDTHS);
}
/** T-5417: las MISMAS filas que el Excel (la hoja ya empieza con su título). */
export async function expenseReportPdf(report: ExpenseReport, locale: string) {
  const t = await getTranslations({ locale, namespace: 'expenseReport' });
  return buildPdf(t('sheetTitle', { month: report.month }), await expenseReportSheet(report, locale), EXPENSE_WIDTHS, { locale });
}
export const expenseReportFilename = (month: string) => `reporte-gastos-${month}.xlsx`;
export const expenseReportPdfFilename = (month: string) => `reporte-gastos-${month}.pdf`;
