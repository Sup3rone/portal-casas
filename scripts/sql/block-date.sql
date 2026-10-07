-- Emma: ejecutar manualmente en Respaldo y luego main antes de desplegar.
-- No modifica ni mueve los bloqueos históricos Booking.source = host-block.
BEGIN;
CREATE TABLE "BlockDate" (
  "id" text PRIMARY KEY,
  "propertyId" text NOT NULL REFERENCES "Property"("id") ON DELETE CASCADE,
  "startDate" date NOT NULL,
  "endDate" date NOT NULL,
  "createdBy" text NOT NULL REFERENCES "User"("id") ON DELETE NO ACTION,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "BlockDate_range_check" CHECK ("endDate" > "startDate")
);
CREATE INDEX "BlockDate_property_dates_idx" ON "BlockDate" ("propertyId", "startDate", "endDate");
COMMIT;
