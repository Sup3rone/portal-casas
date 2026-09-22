import { db, properties, seasonRates } from '@portal/db';
import { asc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { AddTarifaForm, DeleteTarifaButton } from './components';

export const dynamic = 'force-dynamic';

export default async function AdminTarifasPage() {
  const propiedades = await db.select().from(properties).orderBy(asc(properties.slug));
  const tarifas = await db.select().from(seasonRates).orderBy(asc(seasonRates.propertyId), asc(seasonRates.startDate));

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="mb-8 text-3xl font-bold">Tarifas por temporada</h1>

      <AddTarifaForm propiedades={propiedades.map(p => ({ id: p.id, slug: p.slug }))} />

      <div className="mt-8 space-y-4">
        {tarifas.length === 0 && <p className="text-gray-500">Todavía no hay tarifas de temporada.</p>}
        {tarifas.map((t) => (
          <article key={t.id} className="flex items-center justify-between rounded-2xl bg-white p-6 shadow-sm border">
            <div>
              <h2 className="font-semibold text-lg">
                {t.name} <span className="text-sm text-gray-400">· {propiedades.find(p => p.id === t.propertyId)?.slug ?? '?'}</span>
              </h2>
              <p className="text-sm text-gray-500">
                📅 {t.startDate} → {t.endDate} · Prioridad {t.priority}
              </p>
              <p className="text-sm font-medium text-purple-600">
                ${t.weekdayPrice.toLocaleString('es-MX')} entre semana · ${t.weekendPrice.toLocaleString('es-MX')} fin de semana
              </p>
            </div>
            <DeleteTarifaButton id={t.id} />
          </article>
        ))}
      </div>
    </main>
  );
}
