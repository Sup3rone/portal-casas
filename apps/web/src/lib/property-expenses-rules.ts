// T-5248: reglas puras de mantenimientos y gastos por casa (sin BD ni red). Las usan la API (validación) y la pantalla
// (próximo pago, «sobre presupuesto», totales), así que servidor y panel dan el mismo resultado.
// Dinero: el mismo parseAmount/toCents de las reservas (centavos con BigInt, nunca flotantes).
// Sin importar @portal/db: este archivo también lo usa la pantalla (cliente). test-property-expenses.cjs comprueba que
// estas listas sean idénticas a las del esquema (schema.ts) y a los CHECK del SQL.
import { centsToAmount, parseAmount, toCents } from './booking-breakdown';
import { PanelValidationError } from './panel-validation';

export const expensePeriodicities = ['semanal', 'mensual', 'bimestral', 'trimestral', 'anual'] as const;
export const maintenanceKinds = ['puntual', 'recurrente'] as const;
export const maintenanceStatuses = ['pendiente', 'en_proceso', 'terminado', 'cancelado'] as const;

export type Periodicity = typeof expensePeriodicities[number];
export type MaintenanceKind = typeof maintenanceKinds[number];
export type MaintenanceStatus = typeof maintenanceStatuses[number];
export const expenseKinds = ['maintenance', 'recurring', 'entry'] as const;
export type ExpenseKind = typeof expenseKinds[number];

const MAX_TITLE = 200, MAX_NOTES = 2000, MAX_TYPE_NAME = 60;
const fail = (): never => { throw new PanelValidationError('validation'); };

/** YYYY-MM-DD real, de 1900 a 2999 (un año 0000 lo rechazaría Postgres con un 500 en vez de un 400). */
export function isCivilDate(value: unknown): value is string {
  return typeof value === 'string' && /^(19|2\d)\d{2}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value))
    && new Date(value + 'T00:00:00Z').toISOString().slice(0, 10) === value;
}
function body(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail();
  return value as Record<string, unknown>;
}
function only(input: Record<string, unknown>, allowed: readonly string[]) {
  if (Object.keys(input).some(key => !allowed.includes(key))) fail();
}
function requiredText(value: unknown, max: number) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max) fail();
  return (value as string).trim();
}
function optionalText(value: unknown, max: number) {
  if (value === null || value === undefined || (typeof value === 'string' && !value.trim())) return null;
  if (typeof value !== 'string' || value.trim().length > max) fail();
  return (value as string).trim();
}
function optionalDate(value: unknown) {
  if (value === null || value === undefined || value === '') return null;
  return isCivilDate(value) ? value : fail();
}
function requiredDate(value: unknown) { return isCivilDate(value) ? value : fail(); }
function amount(value: unknown, required: boolean) {
  const parsed = parseAmount(value);
  if (!parsed.ok || (required && parsed.value === null)) fail();
  return (parsed as { value: string | null }).value;
}
function oneOf<T extends string>(value: unknown, options: readonly T[]) {
  return options.includes(value as T) ? value as T : fail();
}
function bool(value: unknown) { return typeof value === 'boolean' ? value : fail(); }
function id(value: unknown) {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(value) ? value : fail();
}
/** En una edición solo se validan los campos enviados; un alta los exige todos los obligatorios. */
function pick<T>(input: Record<string, unknown>, key: string, partial: boolean, read: (value: unknown) => T): T | undefined {
  return partial && !(key in input) ? undefined : read(input[key]);
}
function clean<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as Partial<T>;
}

export function maintenanceInput(value: unknown, partial = false) {
  const input = body(value);
  only(input, ['title', 'kind', 'status', 'budget', 'actualCost', 'startDate', 'endDate', 'notes']);
  const result = clean({
    title: pick(input, 'title', partial, v => requiredText(v, MAX_TITLE)),
    kind: pick(input, 'kind', partial, v => oneOf(v, maintenanceKinds)),
    status: partial || 'status' in input ? pick(input, 'status', partial, v => oneOf(v, maintenanceStatuses)) : 'pendiente' as const,
    budget: pick(input, 'budget', true, v => amount(v, false)),
    actualCost: pick(input, 'actualCost', true, v => amount(v, false)),
    startDate: pick(input, 'startDate', true, optionalDate),
    endDate: pick(input, 'endDate', true, optionalDate),
    notes: pick(input, 'notes', true, v => optionalText(v, MAX_NOTES)),
  });
  if (partial && !Object.keys(result).length) fail();
  if (result.startDate && result.endDate && result.endDate < result.startDate) fail();
  return result;
}

export function recurringInput(value: unknown, partial = false) {
  const input = body(value);
  only(input, ['typeId', 'periodicity', 'amount', 'startDate', 'active', 'notes']);
  const result = clean({
    typeId: pick(input, 'typeId', partial, id),
    periodicity: pick(input, 'periodicity', partial, v => oneOf(v, expensePeriodicities)),
    amount: pick(input, 'amount', true, v => amount(v, false)),
    startDate: pick(input, 'startDate', partial, requiredDate),
    active: pick(input, 'active', true, bool),
    notes: pick(input, 'notes', true, v => optionalText(v, MAX_NOTES)),
  });
  if (partial && !Object.keys(result).length) fail();
  return result;
}

/** `today` (YYYY-MM-DD en México) llena paidAt cuando se marca pagado sin fecha; desmarcar la borra. */
export function entryInput(value: unknown, today: string, partial = false) {
  const input = body(value);
  only(input, ['typeId', 'recurringExpenseId', 'date', 'amount', 'paid', 'paidAt', 'notes']);
  const result = clean({
    typeId: pick(input, 'typeId', partial, id),
    recurringExpenseId: pick(input, 'recurringExpenseId', true, v => v === null || v === '' || v === undefined ? null : id(v)),
    date: pick(input, 'date', partial, requiredDate),
    amount: pick(input, 'amount', partial, v => amount(v, true) as string),
    paid: pick(input, 'paid', true, bool),
    paidAt: pick(input, 'paidAt', true, optionalDate),
    notes: pick(input, 'notes', true, v => optionalText(v, MAX_NOTES)),
  });
  if (partial && !Object.keys(result).length) fail();
  if (result.paidAt && result.paidAt > today) fail(); // no se registra un pago en el futuro
  if (result.paid === false) { if (result.paidAt) fail(); result.paidAt = null; }
  else if (result.paid === true && !result.paidAt) result.paidAt = today;
  // Al crear, una fecha de pago sin «pagado» no tiene sentido. Al editar lo decide el servicio: vale si ya estaba pagado.
  else if (!partial && result.paid === undefined && result.paidAt) fail();
  if (!partial && result.paid === undefined) result.paid = false;
  return result;
}

export function expenseTypeInput(value: unknown) {
  const input = body(value);
  only(input, ['name']);
  return { name: requiredText(input.name, MAX_TYPE_NAME) };
}

const MONTHS: Record<Exclude<Periodicity, 'semanal'>, number> = { mensual: 1, bimestral: 2, trimestral: 3, anual: 12 };
function addMonths(date: string, months: number) {
  const [y, m, d] = date.split('-').map(Number);
  const total = (m - 1) + months, year = y + Math.floor(total / 12), month = total % 12;
  const last = new Date(Date.UTC(year, month + 1, 0)).getUTCDate(); // el 31 cae en el último día de un mes corto
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(Math.min(d, last)).padStart(2, '0')}`;
}
function addDays(date: string, days: number) {
  return new Date(Date.parse(date + 'T00:00:00Z') + days * 86_400_000).toISOString().slice(0, 10);
}
/** Próxima fecha (>= today) del ciclo que empieza en startDate. Cada paso se cuenta desde startDate, no desde el
 *  anterior, para que un día 31 no se vaya corriendo a 28. */
export function nextDueDate(startDate: string, periodicity: Periodicity, today: string) {
  if (startDate >= today) return startDate;
  if (periodicity === 'semanal') {
    const days = Math.round((Date.parse(today + 'T00:00:00Z') - Date.parse(startDate + 'T00:00:00Z')) / 86_400_000);
    return addDays(startDate, Math.ceil(days / 7) * 7);
  }
  const step = MONTHS[periodicity];
  const [sy, sm] = startDate.split('-').map(Number), [ty, tm] = today.split('-').map(Number);
  let k = Math.max(0, Math.floor(((ty - sy) * 12 + (tm - sm)) / step));
  while (addMonths(startDate, k * step) < today) k++;
  return addMonths(startDate, k * step);
}

/** Periodo que toca pagar hoy: el último vencimiento <= today (el recibo que ya llegó). Si el ciclo aún no
 *  empieza, el primero. Ej.: luz bimestral desde 10-ene, hoy 24-nov → 10-nov (el próximo sería 10-ene). */
export function currentDueDate(startDate: string, periodicity: Periodicity, today: string) {
  const next = nextDueDate(startDate, periodicity, today);
  if (next <= today || startDate >= today) return next;
  if (periodicity === 'semanal') return addDays(next, -7);
  const step = MONTHS[periodicity];
  const [sy, sm] = startDate.split('-').map(Number), [ny, nm] = next.split('-').map(Number);
  return addMonths(startDate, ((ny - sy) * 12 + (nm - sm)) - step); // un paso antes, contado desde el inicio
}

/** Costo real mayor que el presupuesto. Sin alguno de los dos no hay alerta. */
export function overBudget(budget: string | null | undefined, actualCost: string | null | undefined) {
  return budget != null && actualCost != null && toCents(actualCost) > toCents(budget);
}

export function expenseTotals(entries: { amount: string; paid: boolean }[]) {
  let paid = BigInt(0), pending = BigInt(0);
  for (const entry of entries) {
    if (entry.paid) paid += toCents(entry.amount); else pending += toCents(entry.amount);
  }
  return { paid: centsToAmount(paid), pending: centsToAmount(pending), total: centsToAmount(paid + pending) };
}
