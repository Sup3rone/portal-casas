// T-4739: el colaborador guarda hasta 2 correos para recibir su reporte mensual.
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { setReportEmails } from '@/lib/monthly-report-service';
import { panelError } from '@/lib/panel-response';

export async function PATCH(req: NextRequest) {
  try {
    const result = await setReportEmails(await req.json().catch(() => null));
    revalidatePath('/[locale]/panel/reporte', 'page');
    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return panelError(error); }
}
