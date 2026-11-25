-- T-5248 (fase 2) — Facturas y recibos adjuntos a mantenimientos y pagos.
-- Requiere property-expenses.sql (fase 1). Propuesta: aplicar MANUALMENTE en Respaldo, verificar, y después en main,
-- ANTES del deploy. No modifica filas existentes.
-- Los archivos van al almacén PRIVADO de Vercel Blob (variable BLOB_PRIVATE_READ_WRITE_TOKEN), no al de fotos.
BEGIN;

CREATE TABLE IF NOT EXISTS "ExpenseAttachment" (
  "id" text PRIMARY KEY,
  "propertyId" text NOT NULL REFERENCES "Property"("id") ON DELETE CASCADE,
  "maintenanceId" text REFERENCES "Maintenance"("id") ON DELETE CASCADE,
  "entryId" text REFERENCES "ExpenseEntry"("id") ON DELETE CASCADE,
  "pathname" text NOT NULL CONSTRAINT "ExpenseAttachment_pathname_unique" UNIQUE,
  "contentType" text NOT NULL CONSTRAINT "ExpenseAttachment_type_check"
    CHECK ("contentType" IN ('image/jpeg', 'image/png', 'image/webp', 'application/pdf')),
  "size" integer NOT NULL CONSTRAINT "ExpenseAttachment_size_check" CHECK ("size" > 0 AND "size" <= 4000000),
  "fileName" text NOT NULL,
  "uploadedBy" text NOT NULL REFERENCES "User"("id"),
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  -- Pertenece a un mantenimiento O a un pago, nunca a los dos ni a ninguno.
  CONSTRAINT "ExpenseAttachment_target_check" CHECK (("maintenanceId" IS NULL) <> ("entryId" IS NULL))
);
CREATE INDEX IF NOT EXISTS "ExpenseAttachment_propertyId_idx" ON "ExpenseAttachment" ("propertyId");

COMMIT;

-- Verificación (solo lectura):
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'ExpenseAttachment' ORDER BY ordinal_position;

-- Rollback (solo si el código que la usa NO está desplegado; los archivos en Blob quedan y se borran aparte):
-- BEGIN; DROP TABLE IF EXISTS "ExpenseAttachment"; COMMIT;
