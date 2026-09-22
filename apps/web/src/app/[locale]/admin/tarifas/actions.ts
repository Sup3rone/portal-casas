'use server';

import { db, seasonRates } from '@portal/db';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { randomUUID } from 'crypto';

export async function addTarifa(formData: FormData) {
  const propertyId = String(formData.get('propertyId'));
  const name = String(formData.get('name') ?? '').trim();
  const startDate = String(formData.get('startDate'));
  const endDate = String(formData.get('endDate'));
  const weekdayPrice = Number(formData.get('weekdayPrice'));
  const weekendPrice = Number(formData.get('weekendPrice'));
  const priority = Number(formData.get('priority') ?? 0) || 0;

  if (!propertyId || !name || !startDate || !endDate || !weekdayPrice || !weekendPrice || startDate >= endDate) {
    redirect('/es/admin/tarifas?error=datos');
  }

  await db.insert(seasonRates).values({ id: randomUUID(), propertyId, name, startDate, endDate, weekdayPrice, weekendPrice, priority });
  revalidatePath('/es/admin/tarifas');
}

export async function deleteTarifa(formData: FormData) {
  const id = String(formData.get('id'));
  if (!id) return;
  await db.delete(seasonRates).where(eq(seasonRates.id, id));
  revalidatePath('/es/admin/tarifas');
}
