-- T-5072 — Traducción automática al guardar en el panel: estado por campo e idioma.
-- Propuesta: aplicar MANUALMENTE en Respaldo, verificar, y después en main, ANTES del deploy.
-- No fue ejecutado por el agente. No modifica filas existentes.
-- Sin esta tabla el panel sigue funcionando: traduce solo los idiomas vacíos y no recuerda cuáles son automáticos.
BEGIN;
CREATE TABLE IF NOT EXISTS "AutoTranslation" (
  "key" text PRIMARY KEY,
  "sourceHash" text NOT NULL,
  "valueHash" text NOT NULL,
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);
COMMIT;

-- Verificación (solo lectura):
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'AutoTranslation' ORDER BY ordinal_position;
