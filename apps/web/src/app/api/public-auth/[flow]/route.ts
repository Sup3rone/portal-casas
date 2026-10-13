import { loginAction } from '@/app/[locale]/login/actions';
import { registerAction } from '@/app/[locale]/registro/actions';
import { requestPasswordReset } from '@/app/[locale]/olvide-password/actions';
import { isRedirectError } from 'next/dist/client/components/redirect-error';
import { getURLFromRedirectError } from 'next/dist/client/components/redirect';
import { rateLimitResponse } from '@/lib/rate-limit';

export async function POST(request: Request, { params }: { params: Promise<{ flow: string }> }) {
  // El transporte JSON conserva la defensa de mismo origen de Server Actions.
  if (request.headers.get('origin') !== new URL(request.url).origin) {
    return Response.json({ code: 'INVALID_ORIGIN' }, { status: 403 });
  }
  const { flow } = await params;
  if (!['login', 'register', 'recovery'].includes(flow)) return Response.json({ code: 'NOT_FOUND' }, { status: 404 });
  const action = { login: loginAction, register: registerAction, recovery: requestPasswordReset }[flow];
  if (!action) return Response.json({ code: 'NOT_FOUND' }, { status: 404 });
  const data = await request.formData().catch(() => null);
  if (!data) return Response.json({ code: 'INVALID_FORM_DATA' }, { status: 400 });
  const locale = String(data.get('locale') || 'es');
  if (!['es', 'en', 'fr'].includes(locale)) return Response.json({ code: 'INVALID_LANG' }, { status: 400 });
  try {
    const result = await action(data);
    if (result?.retryAfter) return rateLimitResponse(result.retryAfter, locale);
    return Response.json({ code: 'INTERNAL_ERROR' }, { status: 500 });
  } catch (error) {
    if (isRedirectError(error)) return Response.json({ redirect: getURLFromRedirectError(error) });
    throw error;
  }
}
