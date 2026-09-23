'use server';

import { db, users, passwordResetTokens } from '@portal/db';
import { eq, and, gt, isNull } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';

export async function resetPassword(formData: FormData) {
  const locale = String(formData.get('locale') || 'es');
  const token = String(formData.get('token') ?? '');
  const password = String(formData.get('password') ?? '');

  if (!token || password.length < 8) {
    redirect(`/${locale}/reset-password?token=${encodeURIComponent(token)}&error=corta`);
  }

  // Token válido: existe, no usado, no expirado
  const [reset] = await db
    .select()
    .from(passwordResetTokens)
    .where(and(
      eq(passwordResetTokens.token, token),
      isNull(passwordResetTokens.usedAt),
      gt(passwordResetTokens.expiresAt, new Date())
    ))
    .limit(1);

  if (!reset) {
    redirect(`/${locale}/reset-password?error=invalido`);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await db.update(users)
    .set({ passwordHash })
    .where(eq(users.id, reset.userId));

  await db.update(passwordResetTokens)
    .set({ usedAt: new Date() })
    .where(eq(passwordResetTokens.id, reset.id));

  redirect(`/${locale}/login?reset=1`);
}
