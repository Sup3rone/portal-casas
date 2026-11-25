// T-5248: editar (PATCH) o borrar (DELETE) un mantenimiento, gasto recurrente o cargo de una casa.
// kind = maintenance | recurring | entry; cualquier otro → 404.
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requirePropertyManager } from '@/lib/property-access';
import { deleteExpenseItem, expenseKind, updateExpenseItem } from '@/lib/property-expenses';
// attachmentError = panelError + el 503 de facturas (borrar un registro con archivos sin el almacén privado).
import { attachmentError as panelError } from '@/lib/attachment-response';

type Context = { params: Promise<{ id: string; kind: string; itemId: string }> };

async function mutate(req: NextRequest, context: Context, removing: boolean) {
  try {
    const manager = await requirePropertyManager(), { id, kind, itemId } = await context.params;
    if (removing) await deleteExpenseItem(id, expenseKind(kind), itemId, manager);
    else await updateExpenseItem(id, expenseKind(kind), itemId, await req.json().catch(() => null), manager);
    revalidatePath('/[locale]/panel/propiedades/[id]/gastos', 'page');
    return NextResponse.json({ success: true });
  } catch (error) { return panelError(error); }
}
export async function PATCH(req: NextRequest, context: Context) { return mutate(req, context, false); }
export async function DELETE(req: NextRequest, context: Context) { return mutate(req, context, true); }
