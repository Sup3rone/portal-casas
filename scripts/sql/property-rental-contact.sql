-- PROPUESTA: Emma aplica manualmente en Respaldo y luego main, con restore point.
-- Convención no idempotente. No ejecutar dos veces.
BEGIN;
ALTER TABLE "Property"
  ADD COLUMN "rentalType" text NOT NULL DEFAULT 'nocturna',
  ADD COLUMN "contactName" text,
  ADD COLUMN "whatsapp" text;
ALTER TABLE "Property"
  ADD CONSTRAINT "Property_rentalType_check"
    CHECK ("rentalType" IN ('nocturna', 'anual')),
  ADD CONSTRAINT "Property_whatsapp_check"
    CHECK ("whatsapp" IS NULL OR "whatsapp" ~ '^[0-9]{8,15}$');
COMMIT;
-- Propiedades existentes: nocturna; contacto y WhatsApp quedan NULL.
