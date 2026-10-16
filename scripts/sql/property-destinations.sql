-- PROPUESTA: NO ejecutada por el agente.
-- Emma: aplicar primero en Respaldo; verificar, después en main con respaldo.
-- Aplicar ANTES de desplegar el código que consulta las columnas nuevas.
-- city ya existe: se conserva íntegro como legacy, sin renombrar ni borrar.
BEGIN;
ALTER TABLE "Property"
  ADD COLUMN "state" text,
  ADD COLUMN "destinationCity" text;
ALTER TABLE "Property" ADD CONSTRAINT "Property_destination_pair_check" CHECK (
  ("state" IS NULL AND "destinationCity" IS NULL)
  OR ("state" IS NOT NULL AND "destinationCity" IS NOT NULL
      AND btrim("state") <> '' AND btrim("destinationCity") <> '')
);
COMMENT ON COLUMN "Property"."city" IS 'Legacy: texto libre conservado para fallback; el editor usa state + destinationCity.';
COMMENT ON COLUMN "Property"."state" IS 'Entidad del catálogo SECTUR de destinations.ts; NULL junto con destinationCity durante transición.';
COMMENT ON COLUMN "Property"."destinationCity" IS 'Destino del catálogo, emparejado con state; no confundir con city legacy.';
COMMIT;

-- Verificación manual posterior (solo lectura):
SELECT id, city AS legacy_city, "state", "destinationCity" FROM "Property" ORDER BY id;
