// T-4739: envío manual / reenvío del reporte de un mes a los correos del propio colaborador.
// Responde 200 también si el envío falla: el resultado (sent/failed + error) queda en la bitácora y en la respuesta.
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { sendOwnReport } from '@/lib/monthly-report-service';
import { panelError } from '@/lib/panel-response';

export async function POST(req: NextRequest) {
  try {
    const result = await sendOwnReport(await req.json().catch(() => null));
    revalidatePath('/[locale]/panel/reporte', 'page');
    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return panelError(error); }
}
