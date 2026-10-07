import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requirePropertyManager } from '@/lib/property-access';
import { managedProperty } from '@/lib/panel-server';
import { savePropertySection, sectionError } from '@/lib/property-sections';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string; section: string }> }) {
  try {
    const manager = await requirePropertyManager(), { id, section } = await params;
    await managedProperty(id, manager);
    await savePropertySection(id, section, await req.json().catch(() => null), manager);
    revalidatePath('/[locale]/panel', 'layout');
    return NextResponse.json({ success: true });
  } catch (error) { return sectionError(error); }
}
