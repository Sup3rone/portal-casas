"use client";

import { useEffect, useState } from "react";

export type MessageData = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  body: string;
  startDate: string | null;
  endDate: string | null;
  propertyId: string;
  propertyName: string;
  propertySlug: string;
};

// Formato YYYY-MM-DD seguro (evita desfases de zona horaria)
function toDateInput(d: string | Date | null): string {
  if (!d) return "";
  const dt = typeof d === "string" ? new Date(`${d}T00:00:00`) : d;
  if (isNaN(dt.getTime())) return "";
  return dt.toISOString().slice(0, 10);
}

export default function MessageModal({
  message,
  onClose,
  onSuccess,
}: {
  message: MessageData;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [startDate, setStartDate] = useState(toDateInput(message.startDate));
  const [endDate, setEndDate] = useState(toDateInput(message.endDate));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Resetear fechas si se abre otro mensaje
  useEffect(() => {
    setStartDate(toDateInput(message.startDate));
    setEndDate(toDateInput(message.endDate));
    setError(null);
  }, [message]);

  const valid = startDate && endDate && startDate <= endDate;

  const handleConfirm = async () => {
    if (!valid || saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/bookings/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: message.propertyId,
          startDate,
          endDate,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al confirmar");
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado");
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-3 top-3 text-gray-400 hover:text-gray-700"
          aria-label="Cerrar"
        >
          ✕
        </button>

        <h3 className="mb-4 text-xl font-bold text-gray-900">
          Consulta de renta
        </h3>

        <div className="space-y-4 text-sm">
          <div>
            <strong className="block text-xs uppercase text-gray-500">Propiedad</strong>
            <span className="font-semibold text-purple-600">
              {message.propertyName}
            </span>
          </div>

          <div>
            <strong className="block text-xs uppercase text-gray-500">Remitente</strong>
            <p className="font-medium text-gray-900">{message.name}</p>
            <a
              href={`mailto:${message.email}`}
              className="text-gray-600 underline-offset-2 hover:underline"
            >
              {message.email}
            </a>
            {message.phone && (
              <p className="text-gray-600">📞 {message.phone}</p>
            )}
          </div>

          <div>
            <strong className="block mb-2 text-xs uppercase text-gray-500">
              Fechas (editable)
            </strong>
            <div className="flex items-center gap-3">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="flex-1 rounded-lg border border-gray-300 p-2 focus:border-purple-500 focus:outline-none"
              />
              <span className="text-gray-400">→</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="flex-1 rounded-lg border border-gray-300 p-2 focus:border-purple-500 focus:outline-none"
              />
            </div>
            {!valid && startDate && endDate && (
              <p className="mt-1 text-xs text-red-600">
                La fecha de salida debe ser posterior a la de entrada
              </p>
            )}
          </div>

          <div>
            <strong className="block text-xs uppercase text-gray-500">Mensaje</strong>
            <p className="whitespace-pre-wrap rounded-lg bg-gray-50 p-3 text-gray-700">
              {message.body}
            </p>
          </div>
        </div>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="mt-6 flex gap-3">
          <button
            onClick={handleConfirm}
            disabled={!valid || saving}
            className="flex-1 rounded-lg bg-purple-600 py-3 font-bold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Confirmando..." : "✅ Confirmar fechas"}
          </button>
          <button
            onClick={onClose}
            className="flex-1 rounded-lg bg-gray-200 py-3 font-bold text-gray-800 transition hover:bg-gray-300"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
