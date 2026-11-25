-- T-5310 — Bitácora de correos enviados (para /panel/correos, solo ADMIN). No guarda el contenido de los correos.
-- Propuesta: aplicar MANUALMENTE en Respaldo, verificar, y después en main, ANTES del deploy.
-- Si el deploy llega antes que el SQL, los correos se envían igual: solo falla el registro (queda en el log).
-- No modifica filas existentes.
BEGIN;

CREATE TABLE IF NOT EXISTS "EmailLog" (
  "id" text PRIMARY KEY,
  "kind" text NOT NULL CONSTRAINT "EmailLog_kind_check"
    CHECK ("kind" IN ('password-reset', 'password-changed', 'booking-guest', 'booking-owner', 'inquiry', 'monthly-report', 'expense-reminder', 'other')),
  "recipients" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "subject" text NOT NULL,
  "status" text NOT NULL CONSTRAINT "EmailLog_status_check" CHECK ("status" IN ('sent', 'failed')),
  "provider" text NOT NULL CONSTRAINT "EmailLog_provider_check" CHECK ("provider" IN ('gmail', 'resend')),
  "error" text,
  "createdAt" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "EmailLog_createdAt_idx" ON "EmailLog" ("createdAt");

COMMIT;

-- Verificación (solo lectura):
-- SELECT indexname FROM pg_indexes WHERE tablename = 'EmailLog';

-- Rollback (solo si el código que la usa NO está desplegado; borra la bitácora):
-- BEGIN; DROP TABLE IF EXISTS "EmailLog"; COMMIT;
