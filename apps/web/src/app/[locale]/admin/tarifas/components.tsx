import { addTarifa, deleteTarifa } from './actions';

export function AddTarifaForm({ propiedades }: { propiedades: { id: string; slug: string }[] }) {
  return (
    <form action={addTarifa} className="grid grid-cols-2 gap-3 rounded-2xl bg-white p-6 shadow-sm border md:grid-cols-3">
      <select name="propertyId" required className="col-span-2 rounded-lg border p-2 md:col-span-1">
        {propiedades.map(p => <option key={p.id} value={p.id}>{p.slug}</option>)}
      </select>
      <input name="name" placeholder="Nombre (ej: Navidad)" required className="rounded-lg border p-2" />
      <input name="priority" type="number" defaultValue={0} placeholder="Prioridad" className="rounded-lg border p-2" />
      <input name="startDate" type="date" required className="rounded-lg border p-2" />
      <input name="endDate" type="date" required className="rounded-lg border p-2" />
      <input name="weekdayPrice" type="number" placeholder="$ entre semana" required className="rounded-lg border p-2" />
      <input name="weekendPrice" type="number" placeholder="$ finde" required className="rounded-lg border p-2" />
      <button className="col-span-2 rounded-lg bg-purple-600 py-2 font-bold text-white hover:bg-purple-700 md:col-span-3">
        ➕ Agregar tarifa
      </button>
    </form>
  );
}

export function DeleteTarifaButton({ id }: { id: string }) {
  return (
    <form action={deleteTarifa}>
      <input type="hidden" name="id" value={id} />
      <button className="rounded-lg bg-red-50 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-100">Eliminar</button>
    </form>
  );
}
