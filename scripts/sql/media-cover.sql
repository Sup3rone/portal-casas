-- PENDIENTE: Emma aplica manualmente en Respaldo, después main con restore point.
-- Convención no idempotente. No volver a ejecutar después de elegir portadas.
BEGIN;
ALTER TABLE "Media" ADD COLUMN "isCover" boolean NOT NULL DEFAULT false;
ALTER TABLE "Media" ADD COLUMN "coverOrder" integer;
-- Preservar la portada actual: PHOTO principal, order asc, id asc.
WITH ranked AS (
  SELECT id, row_number() OVER (
    PARTITION BY "propertyId"
    ORDER BY CASE WHEN category = 'principal' THEN 0 ELSE 1 END, "order", id
  ) AS position
  FROM "Media" WHERE type = 'PHOTO'
)
UPDATE "Media" AS m SET "isCover" = true, "coverOrder" = 0
FROM ranked r WHERE r.id = m.id AND r.position = 1;
ALTER TABLE "Media" ADD CONSTRAINT "Media_cover_check" CHECK (
  ("isCover" AND type = 'PHOTO' AND "coverOrder" IS NOT NULL AND "coverOrder" BETWEEN 0 AND 4)
  OR (NOT "isCover" AND "coverOrder" IS NULL)
);
COMMIT;
-- Rollback manual, pierde SOLO selección de portada; category/order no cambian:
-- BEGIN;
-- ALTER TABLE "Media" DROP CONSTRAINT "Media_cover_check";
-- ALTER TABLE "Media" DROP COLUMN "coverOrder";
-- ALTER TABLE "Media" DROP COLUMN "isCover";
-- COMMIT;
