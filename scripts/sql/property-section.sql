-- Fase B1: aplicar MANUALMENTE por Emma en Neon Respaldo tras revisar el destino.
-- No aplicado aquí. Sin backfill ni cambios en categorías/datos existentes.
-- No idempotente, siguiendo admin-user-audit.sql: ejecutar una sola vez.
BEGIN;

ALTER TABLE "Media"
  ADD CONSTRAINT "Media_id_propertyId_unique" UNIQUE ("id", "propertyId");

CREATE TABLE "PropertySection" (
  "propertyId" text NOT NULL,
  "section" varchar(20) NOT NULL,
  "descriptionEs" text,
  "descriptionEn" text,
  "descriptionFr" text,
  "heroMediaId" text,
  PRIMARY KEY ("propertyId", "section"),
  CONSTRAINT "PropertySection_section_check"
    CHECK ("section" IN ('destino', 'amenidades', 'habitaciones', 'lugar')),
  CONSTRAINT "PropertySection_property_fk"
    FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE CASCADE,
  CONSTRAINT "PropertySection_hero_property_fk"
    FOREIGN KEY ("heroMediaId", "propertyId") REFERENCES "Media" ("id", "propertyId")
    ON DELETE NO ACTION
);

COMMIT;
