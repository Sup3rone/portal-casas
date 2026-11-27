// T-4739: descarga manual del Excel del reporte mensual (solo COLLABORATOR, sus propiedades). T-5417: ?format=pdf.
import { NextRequest, NextResponse } from 'next/server';
import { isMonth } from '@/lib/monthly-report';
import { loadMonthlyReport, reportFilename, reportPdf, reportPdfFilename, reportXlsx, requireReportOwner } from '@/lib/monthly-report-service';
import { PDF_MIME } from '@/lib/pdf';
import { reportFormat } from '@/lib/report-format';
import { panelError } from '@/lib/panel-response';

export async function GET(req: NextRequest) {
  try {
    const manager = await requireReportOwner();
    const params = new URL(req.url).searchParams;
    const month = params.get('month'), partner = params.get('partner') || null;
    const locale = ['es', 'en', 'fr'].includes(params.get('locale') ?? '') ? params.get('locale')! : 'es';
    const format = reportFormat(params.get('format'));
    if (!isMonth(month) || !format) return NextResponse.json({ error: 'validation' }, { status: 400 });
    const report = await loadMonthlyReport(manager, month, partner, locale);
    const pdf = format === 'pdf';
    const file = pdf ? await reportPdf(report, locale) : await reportXlsx(report, locale);
    return new NextResponse(Buffer.from(file), { headers: {
      'Content-Type': pdf ? PDF_MIME : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${pdf ? reportPdfFilename(month) : reportFilename(month)}"`,
      'Cache-Control': 'no-store',
    } });
  } catch (error) { return panelError(error); }
}
