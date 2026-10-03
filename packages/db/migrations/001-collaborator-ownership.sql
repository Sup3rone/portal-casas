-- Ejecución MANUAL: reemplazar REEMPLAZAR_ID_ADMIN por el id del admin actual.
-- Basado exclusivamente en packages/db/src/schema.ts, sin consultar Neon.
-- No usar db:push. No ejecutar dentro de otra transacción.
-- Criterio: TODAS las propiedades preexistentes se asignan al admin elegido.
-- Se conserva un snapshot por propiedad, incluso si ya pertenecía a ese admin.
BEGIN;
SELECT set_config('portal.phase1_owner', 'REEMPLAZAR_ID_ADMIN', true);
DO $migration$
DECLARE
  migration_key constant text := '001-collaborator-ownership';
  default_owner text := current_setting('portal.phase1_owner', true);
  owner_existed boolean;
  owner_required boolean;
BEGIN
  LOCK TABLE "User" IN SHARE MODE;
  LOCK TABLE "Property", "Media", "Message", "IcalFeed", "Booking", "SeasonRate" IN SHARE ROW EXCLUSIVE MODE;

  IF default_owner IS NULL OR NOT EXISTS (
    SELECT 1 FROM "User" WHERE "id" = default_owner AND "role"::text = 'ADMIN'
  ) THEN
    RAISE EXCEPTION 'Se requiere el id de un ADMIN existente como dueño por defecto';
  END IF;

  CREATE TABLE IF NOT EXISTS "OwnershipMigration" (
    "key" text PRIMARY KEY,
    "defaultOwnerId" text NOT NULL,
    "ownerColumnExisted" boolean NOT NULL,
    "ownerWasRequired" boolean NOT NULL,
    "appliedAt" timestamptz NOT NULL DEFAULT now(),
    "revertedAt" timestamptz
  );
  CREATE TABLE IF NOT EXISTS "OwnershipMigrationAudit" (
    "migrationKey" text NOT NULL,
    "propertyId" text NOT NULL,
    "previousOwnerId" text,
    "assignedOwnerId" text NOT NULL,
    "changed" boolean NOT NULL,
    "recordedAt" timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY ("migrationKey", "propertyId")
  );
  -- Sin FK en el historial: la auditoría debe sobrevivir a borrar una propiedad.
  IF EXISTS (SELECT 1 FROM "OwnershipMigration" WHERE "key" = migration_key) THEN
    IF EXISTS (SELECT 1 FROM "OwnershipMigration" WHERE "key" = migration_key AND "revertedAt" IS NOT NULL) THEN
      RAISE EXCEPTION 'Migración revertida: requiere una nueva migración revisada, no sobrescribir auditoría';
    END IF;
    RETURN; -- Idempotente: no reasigna propiedades creadas o transferidas después.
  END IF;

  -- No corregir huérfanos ni cruces entre feeds y propiedades silenciosamente.
  IF EXISTS (
    SELECT 1 FROM (
      SELECT "propertyId" FROM "Media" UNION ALL SELECT "propertyId" FROM "Message"
      UNION ALL SELECT "propertyId" FROM "IcalFeed" UNION ALL SELECT "propertyId" FROM "Booking"
      UNION ALL SELECT "propertyId" FROM "SeasonRate"
    ) child LEFT JOIN "Property" p ON p."id" = child."propertyId" WHERE p."id" IS NULL
  ) THEN RAISE EXCEPTION 'Recursos huérfanos: revisar antes de migrar'; END IF;
  IF EXISTS (
    SELECT 1 FROM "Booking" b LEFT JOIN "IcalFeed" f ON f."id" = b."icalFeedId"
    WHERE b."icalFeedId" IS NOT NULL AND (f."id" IS NULL OR b."propertyId" <> f."propertyId")
  ) THEN RAISE EXCEPTION 'Reservas con feed ausente o de otra propiedad'; END IF;

  SELECT EXISTS (
    SELECT 1 FROM pg_attribute WHERE attrelid = '"Property"'::regclass
      AND attname = 'ownerId' AND NOT attisdropped
  ) INTO owner_existed;
  SELECT COALESCE(bool_or(attnotnull), false) INTO owner_required
    FROM pg_attribute WHERE attrelid = '"Property"'::regclass AND attname = 'ownerId' AND NOT attisdropped;

  ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'COLLABORATOR';
  ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "ownerId" text;
  IF EXISTS (
    SELECT 1 FROM "Property" p LEFT JOIN "User" u ON u."id" = p."ownerId"
      WHERE p."ownerId" IS NOT NULL AND u."id" IS NULL
  ) THEN RAISE EXCEPTION 'Dueño anterior inexistente: revisar para conservar reversibilidad'; END IF;
  INSERT INTO "OwnershipMigration" ("key", "defaultOwnerId", "ownerColumnExisted", "ownerWasRequired")
    VALUES (migration_key, default_owner, owner_existed, owner_required);
  INSERT INTO "OwnershipMigrationAudit" ("migrationKey", "propertyId", "previousOwnerId", "assignedOwnerId", "changed")
    SELECT migration_key, "id", "ownerId", default_owner, "ownerId" IS DISTINCT FROM default_owner FROM "Property";
  UPDATE "Property" SET "ownerId" = default_owner WHERE "ownerId" IS DISTINCT FROM default_owner;
  ALTER TABLE "Property" ALTER COLUMN "ownerId" SET NOT NULL;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c WHERE c.conrelid = '"Property"'::regclass AND c.confrelid = '"User"'::regclass
      AND c.contype = 'f' AND c.conkey = ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid = '"Property"'::regclass AND attname = 'ownerId')]
  ) THEN
    ALTER TABLE "Property" ADD CONSTRAINT "Property_ownerId_User_fk" FOREIGN KEY ("ownerId") REFERENCES "User"("id");
  END IF;
  CREATE INDEX IF NOT EXISTS "Property_ownerId_idx" ON "Property"("ownerId");
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c WHERE c.conrelid = '"Booking"'::regclass AND c.confrelid = '"Property"'::regclass
      AND c.contype = 'f' AND c.conkey = ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid = '"Booking"'::regclass AND attname = 'propertyId')]
  ) THEN
    ALTER TABLE "Booking" ADD CONSTRAINT "Booking_propertyId_Property_fk" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = '"IcalFeed"'::regclass AND conname = 'IcalFeed_id_propertyId_unique') THEN
    ALTER TABLE "IcalFeed" ADD CONSTRAINT "IcalFeed_id_propertyId_unique" UNIQUE ("id", "propertyId");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = '"Booking"'::regclass AND conname = 'Booking_icalFeed_property_fk') THEN
    ALTER TABLE "Booking" ADD CONSTRAINT "Booking_icalFeed_property_fk" FOREIGN KEY ("icalFeedId", "propertyId") REFERENCES "IcalFeed"("id", "propertyId");
  END IF;
END
$migration$;
COMMIT;
