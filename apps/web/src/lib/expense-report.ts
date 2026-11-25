// T-5248 (fase 3): reporte mensual de gastos y mantenimientos del COLABORADOR (puro, sin BD). Mismo patrón que el
// reporte de comisiones (monthly-report.ts): el servicio lee con el corte por casa y esto agrupa y suma.
// - Pagos: los que tienen fecha (date) dentro del mes.
// - Mantenimientos: los ACTIVOS en el mes = su periodo [inicio, fin] toca el mes. Sin inicio, cuenta desde que se
//   creó; sin fin, sigue activo mientras no esté terminado ni cancelado (si lo está, solo el día en que empezó).
// Dinero en centavos (BigInt), como el resto del módulo.
import { centsToAmount, toCents } from './booking-breakdown';
import { monthRange } from './monthly-report';
import { overBudget } from './property-expenses-rules';

export type ReportPayment = { id: string; propertyId: string; propertyTitle: string; date: string; typeName: string; amount: string;
  paid: boolean; paidAt: string | null; recurring: boolean; notes: string | null };
export type ReportMaintenance = { id: string; propertyId: string; propertyTitle: string; title: string; kind: string; status: string;
  budget: string | null; actualCost: string | null; startDate: string | null; endDate: string | null; createdOn: string };
export type ExpenseTotals = { paid: string; pending: string; total: string; budget: string; actualCost: string; overBudget: number; payments: number; maintenances: number };
export type ExpenseGroup = { propertyId: string; propertyTitle: string; payments: ReportPayment[]; maintenances: (ReportMaintenance & { overBudget: boolean })[]; totals: ExpenseTotals };
export type ExpenseReport = { month: string; groups: ExpenseGroup[]; totals: ExpenseTotals };

export function maintenanceInMonth(item: Pick<ReportMaintenance, 'status' | 'startDate' | 'endDate' | 'createdOn'>, month: string) {
  const { start, end } = monthRange(month); // end exclusivo
  const from = item.startDate ?? item.createdOn;
  const closed = item.status === 'terminado' || item.status === 'cancelado';
  const to = item.endDate ?? (closed ? from : '9999-12-31');
  return from < end && to >= start;
}

function totalsOf(payments: ReportPayment[], maintenances: ReportMaintenance[]): ExpenseTotals {
  const sum = (values: (string | null)[]) => centsToAmount(values.reduce((acc, value) => acc + (value == null ? BigInt(0) : toCents(value)), BigInt(0)));
  const paid = sum(payments.filter(p => p.paid).map(p => p.amount)), pending = sum(payments.filter(p => !p.paid).map(p => p.amount));
  return {
    paid, pending, total: sum([paid, pending]),
    budget: sum(maintenances.map(m => m.budget)), actualCost: sum(maintenances.map(m => m.actualCost)),
    overBudget: maintenances.filter(m => overBudget(m.budget, m.actualCost)).length,
    payments: payments.length, maintenances: maintenances.length,
  };
}

export function buildExpenseReport(month: string, payments: ReportPayment[], maintenances: ReportMaintenance[]): ExpenseReport {
  const { start, end } = monthRange(month);
  const inMonth = payments.filter(p => p.date >= start && p.date < end);
  const active = maintenances.filter(m => maintenanceInMonth(m, month));
  const ids = [...new Set([...inMonth, ...active].map(row => row.propertyId))];
  const groups = ids.map(propertyId => {
    const own = inMonth.filter(p => p.propertyId === propertyId).sort((a, b) => a.date.localeCompare(b.date) || a.typeName.localeCompare(b.typeName));
    const works = active.filter(m => m.propertyId === propertyId).sort((a, b) => (a.startDate ?? a.createdOn).localeCompare(b.startDate ?? b.createdOn));
    const propertyTitle = (own[0] ?? works[0]).propertyTitle;
    return { propertyId, propertyTitle, payments: own, maintenances: works.map(m => ({ ...m, overBudget: overBudget(m.budget, m.actualCost) })), totals: totalsOf(own, works) };
  }).sort((a, b) => a.propertyTitle.localeCompare(b.propertyTitle));
  return { month, groups, totals: totalsOf(inMonth, active) };
}
