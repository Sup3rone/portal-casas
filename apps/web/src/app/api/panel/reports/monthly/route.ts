// T-4739: descarga manual del Excel del reporte mensual (solo COLLABORATOR, sus propiedades).
import { NextRequest, NextResponse } from 'next/server';
import { isMonth } from '@/lib/monthly-report';
import { loadMonthlyReport, reportFilename, reportXlsx, requireReportOwner } from '@/lib/monthly-report-service';
import { panelError } from '@/lib/panel-response';

export async function GET(req: NextRequest) {
  try {
    const manager = await requireReportOwner();
    const params = new URL(req.url).searchParams;
    const month = params.get('month'), partner = params.get('partner') || null;
    const locale = ['es', 'en', 'fr'].includes(params.get('locale') ?? '') ? params.get('locale')! : 'es';
    if (!isMonth(month)) return NextResponse.json({ error: 'validation' }, { status: 400 });
    const file = await reportXlsx(await loadMonthlyReport(manager, month, partner, locale), locale);
    return new NextResponse(Buffer.from(file), { headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${reportFilename(month)}"`,
      'Cache-Control': 'no-store',
    } });
  } catch (error) { return panelError(error); }
}
