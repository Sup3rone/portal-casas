-- PROPUESTA DE MAPEO: NO ejecutada por el agente.
-- Ejecutar DESPUÉS de property-destinations.sql, Respaldo primero y luego main.
-- Inventario proporcionado por Emma: Nuevo Vallarta x2, Guadalajara, Jalisco x1,
-- mas aya x1. No es un inventario verificado por el agente.
-- No toca city legacy ni reemplaza selecciones nuevas ya guardadas.
BEGIN;
LOCK TABLE "Property" IN SHARE ROW EXCLUSIVE MODE;
SELECT city AS legacy_city, count(*) FROM "Property" GROUP BY city ORDER BY city;
DO $$
BEGIN
  IF (SELECT count(*) FROM "Property" WHERE lower(btrim(city)) = 'nuevo vallarta') <> 2
    OR (SELECT count(*) FROM "Property" WHERE lower(btrim(city)) = 'guadalajara, jalisco') <> 1
    OR (SELECT count(*) FROM "Property" WHERE lower(btrim(city)) = 'mas aya') <> 1 THEN
    RAISE EXCEPTION 'Inventario cambió: revisar las filas antes de aplicar este mapeo';
  END IF;
END $$;

UPDATE "Property" SET "state" = 'Nayarit', "destinationCity" = 'Nuevo Vallarta'
WHERE lower(btrim(city)) = 'nuevo vallarta' AND "state" IS NULL AND "destinationCity" IS NULL
RETURNING id, city AS legacy_city, "state", "destinationCity";

UPDATE "Property" SET "state" = 'Jalisco', "destinationCity" = 'Guadalajara'
WHERE lower(btrim(city)) = 'guadalajara, jalisco' AND "state" IS NULL AND "destinationCity" IS NULL
RETURNING id, city AS legacy_city, "state", "destinationCity";

-- mas aya NO se migra ni se corrige automáticamente. Con columnas recién
-- añadidas queda NULL/NULL; Emma debe elegir el destino real en el editor.
SELECT id, slug, city AS legacy_city, "state", "destinationCity",
       'REVISIÓN MANUAL: destino desconocido, no inferir ubicación' AS review
FROM "Property" WHERE lower(btrim(city)) = 'mas aya';

-- Las demás filas sin par también quedan pendientes, sin inferencias.
SELECT id, slug, city AS legacy_city FROM "Property"
WHERE "state" IS NULL AND "destinationCity" IS NULL ORDER BY id;
COMMIT;
