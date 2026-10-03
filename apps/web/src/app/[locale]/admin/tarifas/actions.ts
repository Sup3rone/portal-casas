'use server';

import { db, properties, seasonRates } from '@portal/db';
import { and, eq, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { randomUUID } from 'crypto';
import { AccessError, managedProperties, managedResource, requirePropertyManager } from '@/lib/property-access';

export async function addTarifa(formData: FormData) {
  const manager = await requirePropertyManager();
  const propertyId = String(formData.get('propertyId') ?? '');
  const name = String(formData.get('name') ?? '').trim();
  const startDate = String(formData.get('startDate'));
  const endDate = String(formData.get('endDate'));
  const weekdayPrice = Number(formData.get('weekdayPrice'));
  const weekendPrice = Number(formData.get('weekendPrice'));
  const priority = Number(formData.get('priority') ?? 0) || 0;

  if (!propertyId || !name || !startDate || !endDate || !weekdayPrice || !weekendPrice || startDate >= endDate) {
    redirect('/es/admin/tarifas?error=datos');
  }

  const result = await db.execute(sql`
    insert into "SeasonRate" ("id", "propertyId", "name", "startDate", "endDate", "weekdayPrice", "weekendPrice", "priority")
    select ${randomUUID()}, ${properties.id}, ${name}, ${startDate}::date, ${endDate}::date,
      ${weekdayPrice}, ${weekendPrice}, ${priority}
    from ${properties} where ${and(eq(properties.id, propertyId), managedProperties(manager))}
    returning "id"
  `);
  if (!result.rows.length) throw new AccessError(404);
  revalidatePath('/es/admin/tarifas');
}

export async function deleteTarifa(formData: FormData) {
  const manager = await requirePropertyManager();
  const id = String(formData.get('id') ?? '');
  if (!id) return;
  const rows = await db.delete(seasonRates)
    .where(and(eq(seasonRates.id, id), managedResource(seasonRates.propertyId, manager)))
    .returning({ id: seasonRates.id });
  if (!rows.length) throw new AccessError(404);
  revalidatePath('/es/admin/tarifas');
}
