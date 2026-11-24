-- T-5248 — Mantenimientos y gastos por casa (fase 1: sin adjuntos).
-- Propuesta: aplicar MANUALMENTE en Respaldo, verificar, y después en main, ANTES del deploy.
-- No modifica filas existentes. Siembra los tipos fijos «Luz» y «Agua».
BEGIN;

CREATE TABLE IF NOT EXISTS "ExpenseType" (
  "id" text PRIMARY KEY,
  "name" text NOT NULL CONSTRAINT "ExpenseType_name_check" CHECK (btrim("name") <> ''),
  "fixed" boolean NOT NULL DEFAULT false,
  "active" boolean NOT NULL DEFAULT true,
  "createdAt" timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "ExpenseType_name_unique" ON "ExpenseType" (lower("name"));

CREATE TABLE IF NOT EXISTS "RecurringExpense" (
  "id" text PRIMARY KEY,
  "propertyId" text NOT NULL REFERENCES "Property"("id") ON DELETE CASCADE,
  "typeId" text NOT NULL REFERENCES "ExpenseType"("id") ON DELETE RESTRICT,
  "periodicity" text NOT NULL CONSTRAINT "RecurringExpense_periodicity_check"
    CHECK ("periodicity" IN ('semanal', 'mensual', 'bimestral', 'trimestral', 'anual')),
  "amount" numeric(12,2) CONSTRAINT "RecurringExpense_amount_check" CHECK ("amount" IS NULL OR "amount" >= 0),
  "startDate" date NOT NULL,
  "active" boolean NOT NULL DEFAULT true,
  "notes" text,
  "createdAt" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "RecurringExpense_propertyId_idx" ON "RecurringExpense" ("propertyId");

CREATE TABLE IF NOT EXISTS "ExpenseEntry" (
  "id" text PRIMARY KEY,
  "propertyId" text NOT NULL REFERENCES "Property"("id") ON DELETE CASCADE,
  "recurringExpenseId" text REFERENCES "RecurringExpense"("id") ON DELETE SET NULL,
  "typeId" text NOT NULL REFERENCES "ExpenseType"("id") ON DELETE RESTRICT,
  "date" date NOT NULL,
  "amount" numeric(12,2) NOT NULL CONSTRAINT "ExpenseEntry_amount_check" CHECK ("amount" >= 0),
  "paid" boolean NOT NULL DEFAULT false,
  "paidAt" date,
  "notes" text,
  "createdBy" text NOT NULL REFERENCES "User"("id"),
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "ExpenseEntry_paid_check" CHECK ("paid" OR "paidAt" IS NULL)
);
CREATE INDEX IF NOT EXISTS "ExpenseEntry_property_date_idx" ON "ExpenseEntry" ("propertyId", "date");

CREATE TABLE IF NOT EXISTS "Maintenance" (
  "id" text PRIMARY KEY,
  "propertyId" text NOT NULL REFERENCES "Property"("id") ON DELETE CASCADE,
  "title" text NOT NULL CONSTRAINT "Maintenance_title_check" CHECK (btrim("title") <> ''),
  "kind" text NOT NULL CONSTRAINT "Maintenance_kind_check" CHECK ("kind" IN ('puntual', 'recurrente')),
  "status" text NOT NULL DEFAULT 'pendiente'
    CONSTRAINT "Maintenance_status_check" CHECK ("status" IN ('pendiente', 'en_proceso', 'terminado', 'cancelado')),
  "budget" numeric(12,2) CONSTRAINT "Maintenance_budget_check" CHECK ("budget" IS NULL OR "budget" >= 0),
  "actualCost" numeric(12,2) CONSTRAINT "Maintenance_actualCost_check" CHECK ("actualCost" IS NULL OR "actualCost" >= 0),
  "startDate" date,
  "endDate" date,
  "notes" text,
  "createdBy" text NOT NULL REFERENCES "User"("id"),
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "Maintenance_dates_check" CHECK ("startDate" IS NULL OR "endDate" IS NULL OR "endDate" >= "startDate")
);
CREATE INDEX IF NOT EXISTS "Maintenance_propertyId_idx" ON "Maintenance" ("propertyId");

-- Tipos fijos precargados (no se pueden desactivar desde el panel).
INSERT INTO "ExpenseType" ("id", "name", "fixed") VALUES ('luz', 'Luz', true), ('agua', 'Agua', true)
ON CONFLICT ("id") DO NOTHING;

COMMIT;

-- Verificación (solo lectura): 4 tablas y los 2 tipos fijos.
-- SELECT table_name FROM information_schema.tables WHERE table_name IN ('ExpenseType', 'RecurringExpense', 'ExpenseEntry', 'Maintenance');
-- SELECT "id", "name", "fixed" FROM "ExpenseType" ORDER BY "name";

-- Rollback (solo si el código que las usa NO está desplegado; borra los datos capturados):
-- BEGIN;
-- DROP TABLE IF EXISTS "ExpenseEntry";
-- DROP TABLE IF EXISTS "RecurringExpense";
-- DROP TABLE IF EXISTS "Maintenance";
-- DROP TABLE IF EXISTS "ExpenseType";
-- COMMIT;
