// T-5248: el ADMIN agrega un tipo de gasto al catálogo global (luz y agua ya vienen sembrados por el SQL).
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createExpenseType } from '@/lib/property-expenses';
import { panelError } from '@/lib/panel-response';

export async function POST(req: NextRequest) {
  try {
    const id = await createExpenseType(await req.json().catch(() => null));
    revalidatePath('/[locale]/panel/propiedades/[id]/gastos', 'page');
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) { return panelError(error); }
}
