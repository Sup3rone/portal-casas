-- Ejecutar MANUALMENTE solo esta lectura y guardar el valor JSON como
-- uploads/photo-migration/media-respaldo.json (sin envoltorio de filas del cliente).
-- No se conecta a Neon desde el script Node.
SELECT COALESCE(json_agg(row_to_json(inventory) ORDER BY inventory.id), '[]'::json)
FROM (SELECT id, "propertyId", url, type FROM "Media") inventory;

-- El UPDATE ejecutable se genera con --apply en
-- scripts/sql/migrate-photos-to-blob.generated.sql.
-- No anticipar URLs ni ejecutar un UPDATE usando resultados de dry-run.
-- La transacción generada valida IDs/URLs actuales, bloquea escrituras concurrentes,
-- conserva una tabla temporal de mapeo y actualiza solo PHOTO subidas con éxito.
-- La BD no puede comprobar objetos remotos: revisar el reporte y abrir las URLs.
