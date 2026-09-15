import { db, messages, properties } from '@portal/db';
import { desc, eq } from 'drizzle-orm';
import MarkAsReadButton from '@/components/MarkAsReadButton';

export const dynamic = 'force-dynamic';

export default async function AdminMensajesPage() {
  const rows = await db
    .select({
      id: messages.id,
      name: messages.name,
      email: messages.email,
      phone: messages.phone,
      lang: messages.lang,
      body: messages.body,
      startDate: messages.startDate,
      endDate: messages.endDate,
      read: messages.read,
      createdAt: messages.createdAt,
      propiedad: properties.slug,
    })
    .from(messages)
    .leftJoin(properties, eq(messages.propertyId, properties.id))
    .orderBy(desc(messages.createdAt));

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="mb-8 text-3xl font-bold">Mensajes recibidos ({rows.length})</h1>

      {rows.length === 0 && (
        <p className="text-gray-500">Todavía no hay mensajes.</p>
      )}

      <div className="space-y-4">
        {rows.map((m) => (
          <article key={m.id} className="rounded-2xl bg-white p-6 shadow-sm border">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h2 className="font-semibold text-lg">
                  {m.name} {!m.read && <span className="text-xs bg-purple-600 text-white rounded-full px-2 py-0.5 ml-2 align-middle">NUEVO</span>}
                </h2>
                <p className="text-sm text-gray-500">
                  <a href={`mailto:${m.email}`} className="underline">{m.email}</a>
                  {m.phone && <> · {m.phone}</>}
                  {' '} · 🌐 {m.lang.toUpperCase()}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <time className="text-xs text-gray-400">
                  {new Date(m.createdAt).toLocaleString('es')}
                </time>
                <MarkAsReadButton messageId={m.id} read={m.read} />
              </div>
            </div>

            <p className="text-gray-700 whitespace-pre-wrap my-3">{m.body}</p>

            <div className="text-sm text-gray-500 flex gap-4">
              <span>🏠 {m.propiedad ?? 'Propiedad eliminada'}</span>
              {m.startDate && m.endDate && (
                <span>📅 {m.startDate} → {m.endDate}</span>
              )}
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
