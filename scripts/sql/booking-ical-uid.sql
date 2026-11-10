-- T-4680 — Sync iCal idempotente por UID.
-- Propuesta: aplicar MANUALMENTE en Respaldo, verificar, y después en main, ANTES del deploy.
-- No fue ejecutado por el agente.
-- Añade el UID del evento y un índice único parcial por feed. No modifica filas:
-- las reservas iCal antiguas quedan con "icalUid" NULL y el primer sync tras el deploy
-- las reemplaza por una fila por UID (borra las antiguas de ese feed).
BEGIN;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "icalUid" text;
CREATE UNIQUE INDEX IF NOT EXISTS "Booking_icalFeed_uid_unique"
  ON "Booking" ("icalFeedId", "icalUid") WHERE "icalFeedId" IS NOT NULL;
COMMIT;

-- Verificación (solo lectura):
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'Booking' AND column_name = 'icalUid';
-- SELECT indexdef FROM pg_indexes WHERE indexname = 'Booking_icalFeed_uid_unique';
-- Duplicados previos (para saber cuántas filas limpiará el primer sync):
-- SELECT "icalFeedId", "startDate", "endDate", count(*) FROM "Booking" WHERE "icalFeedId" IS NOT NULL GROUP BY 1,2,3 HAVING count(*) > 1;
