import { NextResponse } from 'next/server';
import { accessFailure } from './property-access';
import { PanelValidationError } from './panel-validation';

export function panelError(error: unknown) {
  if (error instanceof PanelValidationError && error.message === 'invalidContactEmail') return NextResponse.json({ error: 'invalidContactEmail', code: 'INVALID_CONTACT_EMAIL' }, { status: 400 });
  if (error instanceof PanelValidationError && ['invalidHeroVideo', 'invalidSectionTitles'].includes(error.message)) return NextResponse.json({ error: error.message, code: error.message === 'invalidHeroVideo' ? 'INVALID_HERO_VIDEO' : 'INVALID_SECTION_TITLES' }, { status: 400 });
  const denied = accessFailure(error);
  if (denied) return NextResponse.json({ error: denied.message, code: denied.code }, { status: denied.status });
  if (error instanceof PanelValidationError) return NextResponse.json(error.message === 'invalidDestination' ? { error: 'invalidDestination', code: 'INVALID_DESTINATION' } : { error: 'validation' }, { status: 400 });
  if (error && typeof error === 'object' && 'cause' in error && error.cause && typeof error.cause === 'object' && 'code' in error.cause && error.cause.code === '23505') {
    return NextResponse.json({ error: 'conflict' }, { status: 409 });
  }
  console.error('Error en panel:', error);
  return NextResponse.json({ error: 'error' }, { status: 500 });
}
