import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requirePropertyManager } from '@/lib/property-access';
import { managedProperty } from '@/lib/panel-server';
import { createResource } from '@/lib/panel-mutations';
import { panelError } from '@/lib/panel-response';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string; resource: string }> }) {
  try {
    const manager = await requirePropertyManager(), { id, resource } = await params;
    await managedProperty(id, manager);
    const resourceId = await createResource(id, resource, await req.json().catch(() => null), manager);
    revalidatePath('/[locale]/panel', 'layout');
    revalidatePath('/[locale]/casas/[slug]', 'page');
    return NextResponse.json({ id: resourceId }, { status: 201 });
  } catch (error) { return panelError(error); }
}
