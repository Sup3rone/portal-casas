-- T-4739 · Reporte mensual de comisiones del colaborador: destinatarios por colaborador + bitácora de envíos.
-- PROPUESTA NO EJECUTADA. Requiere booking-price-breakdown.sql (T-4738) ya aplicado.
-- Orden: Respaldo → verificar → QA (/panel/reporte, descargar Excel, envío manual) → main (restore point) → deploy.
-- ⚠️ Sin este SQL NO solo fallan /panel/reporte y el cron: Drizzle incluye "User"."reportEmails" en cada
--    select() sin columnas y en cada INSERT de "User", así que también fallarían el REGISTRO de usuarios
--    (registro/actions.ts) y «olvidé mi contraseña» (olvide-password/actions.ts). Aplicar SIEMPRE antes del deploy.
-- Aditivo: ningún colaborador tiene destinatarios al aplicar, así que el cron no envía nada hasta que alguien los capture.
BEGIN;

-- Hasta 2 correos por colaborador (los captura él mismo en /panel/reporte). El formato lo valida la app.
ALTER TABLE "User"
  ADD COLUMN "reportEmails" jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE "User"
  ADD CONSTRAINT "User_reportEmails_check"
  CHECK (jsonb_typeof("reportEmails") = 'array' AND jsonb_array_length("reportEmails") <= 2);

-- Bitácora de envíos: cada intento (automático o manual) deja una fila; los fallos se ven en el panel.
CREATE TABLE "ReportDelivery" (
  "id" text PRIMARY KEY,
  "userId" text NOT NULL REFERENCES "User"("id") ON DELETE RESTRICT,
  "month" text NOT NULL,
  "trigger" text NOT NULL,
  "status" text NOT NULL,
  "recipients" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "bookingCount" integer NOT NULL DEFAULT 0,
  "error" text,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "ReportDelivery_month_check" CHECK ("month" ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
  CONSTRAINT "ReportDelivery_trigger_check" CHECK ("trigger" IN ('cron', 'manual')),
  CONSTRAINT "ReportDelivery_status_check" CHECK ("status" IN ('pending', 'sent', 'failed'))
);
CREATE INDEX "ReportDelivery_user_month_idx" ON "ReportDelivery" ("userId", "month", "createdAt");
-- Un solo envío automático vivo por colaborador y mes: el cron reserva 'pending' antes de enviar
-- (INSERT … ON CONFLICT DO NOTHING); un reintento o una ejecución simultánea no puede duplicar el correo.
CREATE UNIQUE INDEX "ReportDelivery_cron_once" ON "ReportDelivery" ("userId", "month")
  WHERE "trigger" = 'cron' AND "status" IN ('pending', 'sent');

COMMIT;

-- Verificación (solo lectura):
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'reportEmails';
-- SELECT count(*) FROM "ReportDelivery";  -- 0
-- SELECT indexname FROM pg_indexes WHERE indexname = 'ReportDelivery_cron_once';  -- 1 fila
-- SELECT count(*) FROM "User" WHERE jsonb_array_length("reportEmails") > 0;  -- 0
--
-- Reversa (solo en Respaldo):
-- BEGIN; DROP TABLE "ReportDelivery"; ALTER TABLE "User" DROP CONSTRAINT "User_reportEmails_check", DROP COLUMN "reportEmails"; COMMIT;
