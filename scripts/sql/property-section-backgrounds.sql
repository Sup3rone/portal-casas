-- PROPUESTA: Emma aplica en Respaldo; después restore point y main, antes de deploy.
-- Convención no idempotente: no ejecutar dos veces. Sin conexiones ejecutadas aquí.
-- URLs de PHOTO de la biblioteca propia, validadas por la API. No modifica Media.
BEGIN;
ALTER TABLE "Property"
  ADD COLUMN "sectionBgInicio" text,
  ADD COLUMN "sectionBgMapa" text,
  ADD COLUMN "sectionBgReserva" text;
COMMIT;
-- Filas existentes quedan NULL: se conserva el fondo actual del tema.
