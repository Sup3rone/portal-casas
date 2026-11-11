'use server';

import { db, users } from '@portal/db';
import { eq } from 'drizzle-orm';
import { consumeToken, resetTokens } from '@/lib/auth-tokens';
import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';

export async function resetPassword(formData: FormData) {
  const locale = String(formData.get('locale') || 'es');
  const token = String(formData.get('token') ?? '');
  const password = String(formData.get('password') ?? '');

  if (!token || password.length < 8) {
    redirect(`/${locale}/reset-password?token=${encodeURIComponent(token)}&error=corta`);
  }

  // T-4783: se consume ANTES de cambiar la contraseña, en un solo UPDATE (existe, no usado, no vencido):
  // dos envíos simultáneos del mismo enlace no pueden usarlo dos veces.
  const reset = await consumeToken(resetTokens, token);
  if (reset.status !== 'valid') {
    redirect(`/${locale}/reset-password?error=invalido`);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await db.update(users)
    .set({ passwordHash })
    .where(eq(users.id, reset.userId));

  redirect(`/${locale}/login?reset=1`);
}
