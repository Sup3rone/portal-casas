// T-5248: alta de un mantenimiento, gasto recurrente o cargo de una casa. Cuerpo: { record, ...campos }, con
// record = maintenance | recurring | entry. (No «kind»: el mantenimiento ya tiene un campo kind = puntual | recurrente.)
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requirePropertyManager } from '@/lib/property-access';
import { createExpenseItem, expenseKind } from '@/lib/property-expenses';
import { PanelValidationError } from '@/lib/panel-validation';
import { panelError } from '@/lib/panel-response';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const manager = await requirePropertyManager(), { id } = await params;
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object' || Array.isArray(body) || typeof body.record !== 'string') throw new PanelValidationError('validation');
    const { record, ...fields } = body as Record<string, unknown> & { record: string };
    const itemId = await createExpenseItem(id, expenseKind(record), fields, manager);
    revalidatePath('/[locale]/panel/propiedades/[id]/gastos', 'page');
    return NextResponse.json({ id: itemId }, { status: 201 });
  } catch (error) { return panelError(error); }
}
