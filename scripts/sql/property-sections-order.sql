-- PROPUESTA NO EJECUTADA: Emma aplica en Respaldo, QA, luego main antes del deploy.
-- NULL conserva la composición histórica; no hay UPDATE ni cambio de activaciones.
BEGIN;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "sectionsOrder" jsonb;
COMMIT;
-- Verificar: SELECT "id", "sectionsOrder" FROM "Property";
-- API exige siete nombres únicos y 'reserva' al final; probar payload inválido (400).
