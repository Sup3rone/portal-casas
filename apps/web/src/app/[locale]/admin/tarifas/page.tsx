import { db, properties, seasonRates } from '@portal/db';
import { asc } from 'drizzle-orm';
import { managedProperties, managedResource, requireAdmin } from '@/lib/property-access';
import { AddTarifaForm, DeleteTarifaButton } from './components';

export const dynamic = 'force-dynamic';

export default async function AdminTarifasPage() {
  const manager = await requireAdmin();
  const propiedades = await db.select().from(properties).where(managedProperties(manager)).orderBy(asc(properties.slug));
  const tarifas = await db.select().from(seasonRates).where(managedResource(seasonRates.propertyId, manager)).orderBy(asc(seasonRates.propertyId), asc(seasonRates.startDate));

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="mb-8 text-3xl font-bold">Tarifas por temporada</h1>

      <AddTarifaForm propiedades={propiedades.map(p => ({ id: p.id, slug: p.slug }))} />

      <div className="mt-8 space-y-4">
        {tarifas.length === 0 && <p className="text-gray-500 dark:text-gray-400">Todavía no hay tarifas de temporada.</p>}
        {tarifas.map((t) => (
          <article key={t.id} className="flex items-center justify-between rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-sm border dark:border-gray-700">
            <div>
              <h2 className="font-semibold text-lg">
                {t.name} <span className="text-sm text-gray-400 dark:text-gray-300">· {propiedades.find(p => p.id === t.propertyId)?.slug ?? '?'}</span>
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                📅 {t.startDate} → {t.endDate} · Prioridad {t.priority}
              </p>
              <p className="text-sm font-medium text-purple-600 dark:text-purple-400">
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
