"use client";

import { useState } from "react";
import MessageModal, { MessageData } from "@/components/MessageModal";
import MarkAsReadButton from "@/components/MarkAsReadButton";

type Row = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  lang: string;
  body: string;
  startDate: string | null;
  endDate: string | null;
  read: boolean;
  createdAt: Date;
  propiedad: string | null;
  propertyId: string;
  propertyTitle: string | null;
};

export default function MensajesList({ rows }: { rows: Row[] }) {
  const [selected, setSelected] = useState<MessageData | null>(null);

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="mb-8 text-3xl font-bold">Mensajes recibidos ({rows.length})</h1>

      {rows.length === 0 && (
        <p className="text-gray-500">Todavía no hay mensajes.</p>
      )}

      <div className="space-y-4">
        {rows.map((m) => (
          <article
            key={m.id}
            onClick={() =>
              setSelected({
                id: m.id,
                name: m.name,
                email: m.email,
                phone: m.phone,
                body: m.body,
                startDate: m.startDate,
                endDate: m.endDate,
                propertyId: m.propertyId,
                propertyName: m.propertyTitle ?? m.propiedad ?? 'Propiedad eliminada',
                propertySlug: m.propiedad ?? '',
              })
            }
            className="cursor-pointer rounded-2xl bg-white p-6 shadow-sm border transition hover:shadow-md"
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <h2 className="font-semibold text-lg">
                  {m.name}{" "}
                  {!m.read && (
                    <span className="ml-2 inline-block rounded-full bg-purple-600 px-2 py-0.5 align-middle text-xs text-white">
                      NUEVO
                    </span>
                  )}
                </h2>
                <p className="text-sm text-gray-500">
                  <a href={`mailto:${m.email}`} className="underline">
                    {m.email}
                  </a>
                  {m.phone && <> · {m.phone}</>} · 🌐 {m.lang.toUpperCase()}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <time className="text-xs text-gray-400">
                  {new Date(m.createdAt).toLocaleString("es")}
                </time>
                <MarkAsReadButton messageId={m.id} read={m.read} />
              </div>
            </div>

            <p className="my-3 whitespace-pre-wrap text-gray-700">
              {m.body.length > 150 ? `${m.body.slice(0, 150)}…` : m.body}
            </p>

            <div className="flex gap-4 text-sm text-gray-500">
              <span>🏠 {m.propertyTitle ?? m.propiedad ?? "Propiedad eliminada"}</span>
              {m.startDate && m.endDate && (
                <span>
                  📅 {new Date(m.startDate).toLocaleDateString("es")} →{" "}
                  {new Date(m.endDate).toLocaleDateString("es")}
                </span>
              )}
            </div>
            <p className="mt-2 text-right text-xs font-medium text-purple-600">
              Click para ver detalle y confirmar fechas →
            </p>
          </article>
        ))}
      </div>

      {selected && (
        <MessageModal
          message={selected}
          onClose={() => setSelected(null)}
          onSuccess={() => {
            setSelected(null);
            window.location.reload();
          }}
          onDelete={async (id) => {
            const res = await fetch("/api/messages/delete", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Error al eliminar");
            setSelected(null);
            window.location.reload();
          }}
        />
      )}
      {selected && (
        <MessageModal
          message={selected}
          onClose={() => setSelected(null)}
          onSuccess={() => {
            setSelected(null);
            window.location.reload();
          }}
          onDelete={async (id) => {
            const res = await fetch("/api/messages/delete", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Error al eliminar");
            setSelected(null);
            window.location.reload();
          }}
        />
      )}
    </main>
  );
}
