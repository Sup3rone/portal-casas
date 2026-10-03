-- Reversión de DATOS únicamente, con auditoría retenida. No elimina tablas,
-- columnas, enum ni FKs. Exige detener cambios de dueño y revisar el snapshot.
BEGIN;
DO $rollback$
DECLARE
  migration_key constant text := '001-collaborator-ownership';
BEGIN
  LOCK TABLE "Property" IN SHARE ROW EXCLUSIVE MODE;
  IF NOT EXISTS (SELECT 1 FROM "OwnershipMigration" WHERE "key" = migration_key AND "revertedAt" IS NULL) THEN
    RAISE EXCEPTION 'No hay una migración aplicada pendiente de revertir';
  END IF;
  IF EXISTS (
    SELECT 1 FROM "OwnershipMigrationAudit" a JOIN "Property" p ON p."id" = a."propertyId"
    WHERE a."migrationKey" = migration_key AND p."ownerId" IS DISTINCT FROM a."assignedOwnerId"
  ) THEN RAISE EXCEPTION 'Hay cambios de dueño posteriores: no sobrescribir'; END IF;
  IF EXISTS (
    SELECT 1 FROM "OwnershipMigrationAudit" a LEFT JOIN "User" u ON u."id" = a."previousOwnerId"
    WHERE a."migrationKey" = migration_key AND a."previousOwnerId" IS NOT NULL AND u."id" IS NULL
  ) THEN RAISE EXCEPTION 'Un dueño anterior ya no existe: revisar manualmente'; END IF;
  IF EXISTS (SELECT 1 FROM "OwnershipMigration" WHERE "key" = migration_key AND NOT "ownerWasRequired") THEN
    ALTER TABLE "Property" ALTER COLUMN "ownerId" DROP NOT NULL;
  END IF;
  UPDATE "Property" p SET "ownerId" = a."previousOwnerId"
    FROM "OwnershipMigrationAudit" a WHERE a."migrationKey" = migration_key AND a."propertyId" = p."id";
  UPDATE "OwnershipMigration" SET "revertedAt" = now() WHERE "key" = migration_key;
END
$rollback$;
COMMIT;
