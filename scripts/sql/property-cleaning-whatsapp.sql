-- T-4683 — WhatsApp de la persona de limpieza por propiedad.
-- Propuesta: aplicar MANUALMENTE en Respaldo, verificar, y después en main, ANTES del deploy.
-- No fue ejecutado por el agente. No modifica filas.
BEGIN;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "cleaningWhatsapp" text;
ALTER TABLE "Property" DROP CONSTRAINT IF EXISTS "Property_cleaningWhatsapp_check";
ALTER TABLE "Property" ADD CONSTRAINT "Property_cleaningWhatsapp_check"
  CHECK ("cleaningWhatsapp" IS NULL OR "cleaningWhatsapp" ~ '^[0-9]{8,15}$');
COMMIT;

-- Verificación (solo lectura):
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'Property' AND column_name = 'cleaningWhatsapp';
-- SELECT conname FROM pg_constraint WHERE conname = 'Property_cleaningWhatsapp_check';
