// T-5248: mantenimientos y gastos por casa (servidor). Toda lectura y escritura pasa por el corte del panel:
// managedProperty (la casa o 404) y managedResource (ADMIN todas; COLLABORATOR las suyas). Ocultar un botón no es
// seguridad: un dueño que manda el id de otra casa, o de un registro de otra casa, recibe 404 sin datos.
import 'server-only';
import { db, expenseEntries, expenseTypes, maintenances, recurringExpenses } from '@portal/db';
import { and, asc, desc, eq } from 'drizzle-orm';
import { AccessError, managedResource, requireAdmin, type PropertyManager } from './property-access';
import { managedProperty } from './panel-server';
import { PanelValidationError } from './panel-validation';
import { inquiryToday } from './inquiry-validation';
import { entryInput, expenseKinds, expenseTotals, expenseTypeInput, maintenanceInput, recurringInput, type ExpenseKind } from './property-expenses-rules';

const ENTRY_LIMIT = 200;

export function expenseKind(value: string): ExpenseKind {
  if (!(expenseKinds as readonly string[]).includes(value)) throw new AccessError(404);
  return value as ExpenseKind;
}

export async function listExpenseTypes() {
  return db.select({ id: expenseTypes.id, name: expenseTypes.name, fixed: expenseTypes.fixed, active: expenseTypes.active })
    .from(expenseTypes).orderBy(desc(expenseTypes.fixed), asc(expenseTypes.name));
}

export async function loadPropertyExpenses(propertyId: string, manager: PropertyManager) {
  await managedProperty(propertyId, manager);
  const [types, works, recurring, entries, amounts] = await Promise.all([
    listExpenseTypes(),
    db.select().from(maintenances)
      .where(and(eq(maintenances.propertyId, propertyId), managedResource(maintenances.propertyId, manager)))
      .orderBy(desc(maintenances.createdAt)),
    db.select().from(recurringExpenses)
      .where(and(eq(recurringExpenses.propertyId, propertyId), managedResource(recurringExpenses.propertyId, manager)))
      .orderBy(desc(recurringExpenses.active), asc(recurringExpenses.startDate)),
    db.select().from(expenseEntries)
      .where(and(eq(expenseEntries.propertyId, propertyId), managedResource(expenseEntries.propertyId, manager)))
      .orderBy(desc(expenseEntries.date), desc(expenseEntries.createdAt)).limit(ENTRY_LIMIT),
    // Totales con TODOS los cargos de la casa (la lista de arriba se recorta a ENTRY_LIMIT solo para mostrar).
    db.select({ amount: expenseEntries.amount, paid: expenseEntries.paid }).from(expenseEntries)
      .where(and(eq(expenseEntries.propertyId, propertyId), managedResource(expenseEntries.propertyId, manager))),
  ]);
  const totals = expenseTotals(amounts.map(row => ({ amount: row.amount, paid: Boolean(row.paid) })));
  return { types, maintenances: works, recurring, entries, totals, truncated: amounts.length > entries.length };
}

/** Un tipo existente y activo; uno desactivado solo se acepta si el registro ya lo tenía. */
async function assertType(typeId: string, current?: string) {
  if (typeId === current) return;
  const [type] = await db.select({ active: expenseTypes.active }).from(expenseTypes).where(eq(expenseTypes.id, typeId)).limit(1);
  if (!type?.active) throw new PanelValidationError('validation');
}
async function assertRecurring(propertyId: string, recurringId: string | null | undefined) {
  if (!recurringId) return;
  const [row] = await db.select({ id: recurringExpenses.id }).from(recurringExpenses)
    .where(and(eq(recurringExpenses.id, recurringId), eq(recurringExpenses.propertyId, propertyId))).limit(1);
  if (!row) throw new PanelValidationError('validation');
}

export async function createExpenseItem(propertyId: string, kind: ExpenseKind, input: unknown, manager: PropertyManager) {
  await managedProperty(propertyId, manager);
  const id = crypto.randomUUID();
  // Los opcionales van explícitos (null / valor por omisión): mismo resultado en Postgres y sin «default» en VALUES.
  if (kind === 'maintenance') {
    const value = maintenanceInput(input);
    await db.insert(maintenances).values({ budget: null, actualCost: null, startDate: null, endDate: null, notes: null, ...value,
      title: value.title!, kind: value.kind!, id, propertyId, createdBy: manager.id, createdAt: new Date(), updatedAt: new Date() });
  } else if (kind === 'recurring') {
    const value = recurringInput(input);
    await assertType(value.typeId!);
    await db.insert(recurringExpenses).values({ amount: null, active: true, notes: null, ...value,
      typeId: value.typeId!, periodicity: value.periodicity!, startDate: value.startDate!, id, propertyId, createdAt: new Date() });
  } else {
    const value = entryInput(input, inquiryToday());
    await assertType(value.typeId!);
    await assertRecurring(propertyId, value.recurringExpenseId);
    await db.insert(expenseEntries).values({ recurringExpenseId: null, paid: false, paidAt: null, notes: null, ...value,
      typeId: value.typeId!, date: value.date!, amount: value.amount!, id, propertyId, createdBy: manager.id, createdAt: new Date() });
  }
  return id;
}

const tables = { maintenance: maintenances, recurring: recurringExpenses, entry: expenseEntries } as const;

async function ownedRow(propertyId: string, kind: ExpenseKind, itemId: string, manager: PropertyManager) {
  await managedProperty(propertyId, manager);
  const table = tables[kind];
  const [row] = await db.select().from(table)
    .where(and(eq(table.id, itemId), eq(table.propertyId, propertyId), managedResource(table.propertyId, manager))).limit(1);
  if (!row) throw new AccessError(404);
  return row;
}

export async function updateExpenseItem(propertyId: string, kind: ExpenseKind, itemId: string, input: unknown, manager: PropertyManager) {
  const row = await ownedRow(propertyId, kind, itemId, manager);
  const where = (table: typeof tables[ExpenseKind]) => and(eq(table.id, itemId), eq(table.propertyId, propertyId));
  if (kind === 'maintenance') {
    const value = maintenanceInput(input, true), current = row as typeof maintenances.$inferSelect;
    const start = value.startDate === undefined ? current.startDate : value.startDate, end = value.endDate === undefined ? current.endDate : value.endDate;
    if (start && end && end < start) throw new PanelValidationError('validation');
    await db.update(maintenances).set({ ...value, updatedAt: new Date() }).where(where(maintenances));
  } else if (kind === 'recurring') {
    const value = recurringInput(input, true);
    if (value.typeId) await assertType(value.typeId, (row as typeof recurringExpenses.$inferSelect).typeId);
    await db.update(recurringExpenses).set(value).where(where(recurringExpenses));
  } else {
    const value = entryInput(input, inquiryToday(), true), current = row as typeof expenseEntries.$inferSelect;
    const sentPaidAt = Boolean(input && typeof input === 'object' && 'paidAt' in input);
    if (value.typeId) await assertType(value.typeId, current.typeId);
    await assertRecurring(propertyId, value.recurringExpenseId);
    // Volver a marcar «pagado» lo que ya estaba pagado conserva la fecha real (no la cambia por hoy).
    if (value.paid === true && current.paid && !sentPaidAt) delete value.paidAt;
    // paidAt sin tocar «paid»: solo vale si ya estaba pagado, y un pagado nunca queda sin fecha.
    if (value.paid === undefined && value.paidAt !== undefined && (!current.paid || value.paidAt === null)) throw new PanelValidationError('validation');
    await db.update(expenseEntries).set(value).where(where(expenseEntries));
  }
}

export async function deleteExpenseItem(propertyId: string, kind: ExpenseKind, itemId: string, manager: PropertyManager) {
  await ownedRow(propertyId, kind, itemId, manager);
  const table = tables[kind];
  await db.delete(table).where(and(eq(table.id, itemId), eq(table.propertyId, propertyId)));
}

/** Catálogo global: solo el ADMIN agrega tipos (los dueños eligen). Nombre repetido (sin distinguir mayúsculas) → 409. */
export async function createExpenseType(input: unknown) {
  await requireAdmin();
  const { name } = expenseTypeInput(input);
  const id = crypto.randomUUID();
  await db.insert(expenseTypes).values({ id, name, fixed: false, active: true, createdAt: new Date() });
  return id;
}

export type PropertyExpenses = Awaited<ReturnType<typeof loadPropertyExpenses>>;
