// T-5248 (fase 2): respuestas de error de facturas/recibos; el resto lo resuelve panelError (401/403/404/500).
import { NextResponse } from 'next/server';
import { AttachmentError } from './expense-attachment-rules';
import { panelError } from './panel-response';

export function attachmentError(error: unknown) {
  if (error instanceof AttachmentError) {
    return NextResponse.json({ error: 'validation', code: error.code }, { status: error.code === 'ATTACHMENTS_DISABLED' ? 503 : 400 });
  }
  return panelError(error);
}
