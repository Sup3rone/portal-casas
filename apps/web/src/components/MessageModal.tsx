"use client";

import { useState } from "react";

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
  userId: string | null;
};

// Convierte cualquier formato de fecha a YYYY-MM-DD para el input date
function toDateInput(d: string | Date | null | undefined): string {
  if (!d) return "";

  if (typeof d === "string") {
    if (/^\d{4}-\d{2}-\d{2}/.test(d)) return d.slice(0, 10);
    const parsed = new Date(d);
    if (!isNaN(parsed.getTime())) {
      return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}-${String(parsed.getDate()).padStart(2, "0")}`;
    }
    return "";
  }

  if (d instanceof Date && !isNaN(d.getTime())) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  return "";
}

export default function MessageModal({
  message,
  onClose,
  onSuccess,
  onDelete,
}: {
  message: MessageData;
  onClose: () => void;
  onSuccess: () => void;
  onDelete: (id: string) => Promise<void>;
}) {
  const [startDate, setStartDate] = useState(toDateInput(message.startDate));
  const [endDate, setEndDate] = useState(toDateInput(message.endDate));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prevMessage, setPrevMessage] = useState(message);

  // Resetear fechas si se abre otro mensaje
  if (message !== prevMessage) {
    setPrevMessage(message);
    setStartDate(toDateInput(message.startDate));
    setEndDate(toDateInput(message.endDate));
    setError(null);
  }

  const valid = Boolean(startDate && endDate && startDate <= endDate);

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
          guestUserId: message.userId ?? undefined,
          guestName: message.name,
          guestEmail: message.email,
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

  const handleDelete = async () => {
    const confirmado = window.confirm(
      "¿Eliminar este mensaje permanentemente?\n\nEsta acción no se puede deshacer."
    );
    if (!confirmado) return;
    setSaving(true);
    setError(null);
    try {
      await onDelete(message.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado");
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/75 p-4"
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white dark:bg-gray-900 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-3 top-3 text-gray-400 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-200"
          aria-label="Cerrar"
        >
          ✕
        </button>

        <h3 className="mb-4 text-xl font-bold text-gray-900 dark:text-gray-100">
          Consulta de renta
        </h3>

        <div className="space-y-4 text-sm">
          <div>
            <strong className="block text-xs uppercase text-gray-500 dark:text-gray-400">Propiedad</strong>
            <span className="font-semibold text-purple-600 dark:text-purple-400">
              {message.propertyName}
            </span>
          </div>

          <div>
            <strong className="block text-xs uppercase text-gray-500 dark:text-gray-400">Remitente</strong>
            <p className="font-medium text-gray-900 dark:text-gray-100">{message.name}</p>
            <a
              href={`mailto:${message.email}`}
              className="text-gray-600 dark:text-gray-300 underline-offset-2 hover:underline"
            >
              {message.email}
            </a>
            {message.phone && (
              <p className="text-gray-600 dark:text-gray-300">📞 {message.phone}</p>
            )}
          </div>

          <div>
            <strong className="block mb-2 text-xs uppercase text-gray-500 dark:text-gray-400">
              Fechas (editable)
            </strong>
            <div className="flex items-center gap-3">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 p-2 focus:border-purple-500 focus:outline-none dark:bg-gray-800 dark:text-gray-100"
              />
              <span className="text-gray-400 dark:text-gray-300">→</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 p-2 focus:border-purple-500 focus:outline-none dark:bg-gray-800 dark:text-gray-100"
              />
            </div>
            {startDate && endDate && !valid && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                La fecha de salida debe ser posterior a la de entrada
              </p>
            )}
          </div>

          <div>
            <strong className="block text-xs uppercase text-gray-500 dark:text-gray-400">Mensaje</strong>
            <p className="whitespace-pre-wrap rounded-lg bg-gray-50 dark:bg-gray-950 p-3 text-gray-700 dark:text-gray-200">
              {message.body}
            </p>
          </div>
        </div>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 dark:bg-red-950 p-3 text-sm text-red-700 dark:text-red-400">
            {error}
          </p>
        )}

        <div className="mt-6 flex gap-3">
          <button
            onClick={handleConfirm}
            disabled={!valid || saving}
            className="flex-1 rounded-lg bg-purple-600 py-3 font-bold text-white dark:text-gray-100 transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Confirmando..." : "✅ Confirmar fechas"}
          </button>
          <button
            onClick={onClose}
            className="flex-1 rounded-lg bg-gray-200 dark:bg-gray-700 py-3 font-bold text-gray-800 dark:text-gray-100 transition hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Cerrar
          </button>
        </div>

        <button
          onClick={handleDelete}
          disabled={saving}
          className="mt-4 w-full rounded-lg border border-red-200 dark:border-red-800 py-2 text-sm font-medium text-red-600 dark:text-red-400 transition hover:bg-red-50 dark:hover:bg-red-950 disabled:cursor-not-allowed disabled:opacity-50"
        >
          🗑 Eliminar mensaje
        </button>
      </div>
    </div>
  );
}
