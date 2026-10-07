import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requirePropertyManager } from '@/lib/property-access';
import { managedProperty } from '@/lib/panel-server';
import { createCalendarBlock } from '@/lib/occupation-calendar';
import { panelError } from '@/lib/panel-response';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const manager = await requirePropertyManager();
    const { id } = await context.params;
    await managedProperty(id, manager);
    await createCalendarBlock(id, await request.json(), manager);
    revalidatePath('/[locale]/panel', 'layout');
    revalidatePath('/[locale]/casas/[slug]', 'page');
    revalidatePath('/[locale]/admin/calendario', 'page');
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    if (error instanceof SyntaxError) return NextResponse.json({ error: 'validation', code: 'INVALID_JSON' }, { status: 400 });
    return panelError(error);
  }
}
