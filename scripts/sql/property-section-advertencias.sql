-- Ajuste B2b-2: aplicación MANUAL por Emma en Respaldo y después main.
-- NO ejecutado aquí. El CHECK anterior debe existir según Fase B1.
BEGIN;
ALTER TABLE "PropertySection" DROP CONSTRAINT "PropertySection_section_check";
ALTER TABLE "PropertySection"
  ADD CONSTRAINT "PropertySection_section_check"
  CHECK ("section" IN ('destino', 'amenidades', 'habitaciones', 'lugar', 'advertencias'));
COMMIT;
