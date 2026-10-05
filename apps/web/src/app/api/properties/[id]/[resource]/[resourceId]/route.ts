import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requirePropertyManager } from '@/lib/property-access';
import { managedProperty } from '@/lib/panel-server';
import { changeResource } from '@/lib/panel-mutations';
import { panelError } from '@/lib/panel-response';
type Context = { params: Promise<{ id: string; resource: string; resourceId: string }> };

async function mutate(req: NextRequest, context: Context, removing: boolean) {
  try {
    const manager = await requirePropertyManager(), { id, resource, resourceId } = await context.params;
    await managedProperty(id, manager);
    await changeResource(id, resource, resourceId, removing ? null : await req.json().catch(() => null), manager, removing);
    revalidatePath('/[locale]/panel', 'layout');
    revalidatePath('/[locale]/casas/[slug]', 'page');
    return NextResponse.json({ success: true });
  } catch (error) { return panelError(error); }
}
export async function PATCH(req: NextRequest, context: Context) { return mutate(req, context, false); }
export async function DELETE(req: NextRequest, context: Context) { return mutate(req, context, true); }
