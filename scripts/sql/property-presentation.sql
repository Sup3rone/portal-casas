-- PROPUESTA: NO ejecutar automáticamente. Emma: Respaldo primero y después main.
-- Aplicar ANTES de desplegar código que consulta estas columnas.
-- Video requiere almacenamiento por propiedad; títulos no crean un modelo nuevo.
BEGIN;
ALTER TABLE "Property"
  ADD COLUMN "sectionTitles" jsonb;
ALTER TABLE "Property" ADD CONSTRAINT "Property_section_titles_check"
  CHECK ("sectionTitles" IS NULL OR jsonb_typeof("sectionTitles") = 'object');
COMMENT ON COLUMN "Property"."sectionTitles" IS 'Presentación: {titles:{destino:{es,en,fr},...},heroVideoUrl:HTTPS/null}; NULL usa defaults.';
COMMIT;
