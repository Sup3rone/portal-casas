// T-5248 (fase 4): qué entra en el aviso diario de un colaborador. Reglas puras (sin BD) para poder probarlas.
// Decisión del usuario (25-11-2026): correo, 3 días antes y el día; lo vencido sin pagar se repite en el siguiente
// correo; pagos recurrentes y mantenimientos; solo al colaborador dueño de la casa.
import { addDays, currentDueDate, nextDueDate, type Periodicity } from './property-expenses-rules';

export const REMINDER_LEAD_DAYS = 3;

export type ReminderRecurring = { id: string; propertyId: string; typeId: string; periodicity: string; amount: string | null; startDate: string };
export type ReminderEntry = { recurringExpenseId: string | null; date: string; paid: boolean };
export type ReminderMaintenance = { id: string; propertyId: string; title: string; status: string; startDate: string | null };
export type ReminderWhen = 'today' | 'soon' | 'overdue';
export type ReminderItem =
  | { kind: 'payment'; when: ReminderWhen; date: string; propertyId: string; recurringExpenseId: string; typeId: string; amount: string | null }
  | { kind: 'maintenance'; when: ReminderWhen; date: string; propertyId: string; maintenanceId: string; title: string };

const ORDER: Record<ReminderWhen, number> = { today: 0, soon: 1, overdue: 2 };

/**
 * Pagos: el periodo que vence HOY o dentro de REMINDER_LEAD_DAYS días y no tiene un pago marcado «pagado»
 * (ExpenseEntry del mismo gasto recurrente con la misma fecha, como el botón «Registrar pago del <periodo>»).
 * Atrasado: el último vencimiento ANTERIOR a hoy sin pagar (solo el último periodo, no la historia completa).
 * Mantenimientos: solo los «pendiente» con fecha de inicio; hoy, en 3 días, o ya pasada (atrasado).
 * `shouldSend`: solo si algo vence hoy o en 3 días. Lo atrasado acompaña, pero no dispara un correo diario por sí solo.
 */
export function buildReminders(today: string, recurring: ReminderRecurring[], entries: ReminderEntry[], maintenances: ReminderMaintenance[]) {
  const soon = addDays(today, REMINDER_LEAD_DAYS);
  const paid = new Set(entries.filter(entry => entry.paid && entry.recurringExpenseId).map(entry => `${entry.recurringExpenseId}|${entry.date}`));
  const items: ReminderItem[] = [];
  for (const item of recurring) {
    const periodicity = item.periodicity as Periodicity;
    const payment = (when: ReminderWhen, date: string) => {
      if (!paid.has(`${item.id}|${date}`)) items.push({ kind: 'payment', when, date, propertyId: item.propertyId, recurringExpenseId: item.id, typeId: item.typeId, amount: item.amount });
    };
    const next = nextDueDate(item.startDate, periodicity, today);
    if (next === today) payment('today', next);
    else if (next === soon) payment('soon', next);
    // Último vencimiento <= ayer. Si el ciclo aún no empezaba ayer, currentDueDate devuelve el inicio (> ayer).
    const yesterday = addDays(today, -1);
    const previous = currentDueDate(item.startDate, periodicity, yesterday);
    if (previous <= yesterday) payment('overdue', previous);
  }
  for (const item of maintenances) {
    if (item.status !== 'pendiente' || !item.startDate) continue;
    const when: ReminderWhen | null = item.startDate === today ? 'today' : item.startDate === soon ? 'soon' : item.startDate < today ? 'overdue' : null;
    if (when) items.push({ kind: 'maintenance', when, date: item.startDate, propertyId: item.propertyId, maintenanceId: item.id, title: item.title });
  }
  items.sort((a, b) => ORDER[a.when] - ORDER[b.when] || a.date.localeCompare(b.date) || a.propertyId.localeCompare(b.propertyId));
  return { today, soon, items, shouldSend: items.some(item => item.when !== 'overdue') };
}
