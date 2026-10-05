import { NextResponse } from 'next/server';
import { accessFailure } from './property-access';
import { PanelValidationError } from './panel-validation';

export function panelError(error: unknown) {
  const denied = accessFailure(error);
  if (denied) return NextResponse.json({ error: denied.message, code: denied.code }, { status: denied.status });
  if (error instanceof PanelValidationError) return NextResponse.json({ error: 'validation' }, { status: 400 });
  if (error && typeof error === 'object' && 'cause' in error && error.cause && typeof error.cause === 'object' && 'code' in error.cause && error.cause.code === '23505') {
    return NextResponse.json({ error: 'conflict' }, { status: 409 });
  }
  console.error('Error en panel:', error);
  return NextResponse.json({ error: 'error' }, { status: 500 });
}
