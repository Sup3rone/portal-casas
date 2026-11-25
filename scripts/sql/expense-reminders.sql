-- T-5248 (fase 4) — Bitácora de avisos diarios de pagos y mantenimientos por vencer.
-- Propuesta: aplicar MANUALMENTE en Respaldo, verificar, y después en main, ANTES del deploy.
-- Si el deploy llega antes que el SQL, solo falla el paso de avisos del cron diario (el iCal y el reporte siguen).
-- No modifica filas existentes.
BEGIN;

CREATE TABLE IF NOT EXISTS "ExpenseReminderDelivery" (
  "id" text PRIMARY KEY,
  "userId" text NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "day" date NOT NULL,
  "status" text NOT NULL CONSTRAINT "ExpenseReminderDelivery_status_check" CHECK ("status" IN ('pending', 'sent', 'failed')),
  "itemCount" integer NOT NULL DEFAULT 0,
  "error" text,
  "createdAt" timestamptz NOT NULL DEFAULT now()
);
-- Un solo aviso vivo por colaborador y día (el cron no duplica; un 'failed' libera el hueco para reintentar).
CREATE UNIQUE INDEX IF NOT EXISTS "ExpenseReminderDelivery_once"
  ON "ExpenseReminderDelivery" ("userId", "day") WHERE "status" IN ('pending', 'sent');

COMMIT;

-- Verificación (solo lectura):
-- SELECT indexname FROM pg_indexes WHERE tablename = 'ExpenseReminderDelivery';

-- Rollback (solo si el código que la usa NO está desplegado; borra la bitácora):
-- BEGIN; DROP TABLE IF EXISTS "ExpenseReminderDelivery"; COMMIT;
