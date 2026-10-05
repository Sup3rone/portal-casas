import { NextRequest, NextResponse } from 'next/server';
import { requirePropertyManager } from '@/lib/property-access';
import { managedProperty } from '@/lib/panel-server';
import { propertyResources } from '@/lib/panel-resources';
import { panelError } from '@/lib/panel-response';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const manager = await requirePropertyManager(), { id } = await params;
    await managedProperty(id, manager);
    return NextResponse.json(await propertyResources(id, manager));
  } catch (error) { return panelError(error); }
}
