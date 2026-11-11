-- T-4739 · Estado de sincronización por calendario iCal (cron diario, refresco antes de una consulta, panel).
-- PROPUESTA NO EJECUTADA. Orden: Respaldo → verificar → main (restore point) → deploy.
-- ⚠️ Sin este SQL falla la FICHA DE LA PROPIEDAD en el panel (lee "lastSyncedAt") y agregar calendarios (Drizzle
--    inserta las columnas nuevas). La sincronización y el envío de consultas NO fallan (el estado se guarda en un
--    try/catch y el refresco previo a la consulta nunca lanza), pero no quedaría estado ni refresco por antigüedad.
--    Aplicar ANTES del deploy.
-- Aditivo y nullable: los calendarios existentes quedan «sin sincronizar todavía» hasta el próximo sync.
BEGIN;

ALTER TABLE "IcalFeed"
  ADD COLUMN "lastAttemptAt" timestamptz,
  ADD COLUMN "lastSyncedAt" timestamptz,
  ADD COLUMN "lastError" text;

COMMIT;

-- Verificación (solo lectura):
-- SELECT column_name, data_type FROM information_schema.columns
--   WHERE table_name = 'IcalFeed' AND column_name IN ('lastAttemptAt', 'lastSyncedAt', 'lastError');  -- 3 filas
--
-- Reversa (solo en Respaldo):
-- BEGIN; ALTER TABLE "IcalFeed" DROP COLUMN "lastError", DROP COLUMN "lastSyncedAt", DROP COLUMN "lastAttemptAt"; COMMIT;
