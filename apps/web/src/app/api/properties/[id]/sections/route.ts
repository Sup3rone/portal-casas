import { NextRequest, NextResponse } from 'next/server';
import { requirePropertyManager } from '@/lib/property-access';
import { managedProperty } from '@/lib/panel-server';
import { sectionsForProperty, sectionError } from '@/lib/property-sections';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const manager = await requirePropertyManager(), { id } = await params;
    await managedProperty(id, manager);
    return NextResponse.json({ sections: await sectionsForProperty(id, manager) }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return sectionError(error); }
}
