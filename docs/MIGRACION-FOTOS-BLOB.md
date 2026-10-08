# Migración manual de fotos a Blob

Preparación offline; no se ejecutaron subidas, SQL ni conexiones a Neon. No cambia Media, C1 ni la web. Inventario local inicial: 84 JPG en public/fotos. Las URLs reales de Media se contrastan mediante exportación manual, no mediante supuestos basados en nombres de carpetas.

## Procedimiento de Emma

1. Conservar los archivos locales y un respaldo de BD. En Respaldo, ejecutar la lectura de `scripts/sql/migrate-photos-to-blob.sql`. Guardar el valor JSON como `uploads/photo-migration/media-respaldo.json`: array de objetos con id, propertyId, url y type, sin envoltorio del cliente SQL. Crear esa carpeta si hace falta. No incluir credenciales. `/uploads/` está ignorada por Git.
2. Desde la raíz, con Node 24 y dependencias instaladas:

```powershell
node scripts/migrate-photos-to-blob.cjs --media uploads/photo-migration/media-respaldo.json
```

El default es dry-run: no carga el SDK, no lee tokens, no sube ni genera UPDATE. Lista archivos y escribe `uploads/photo-migration/report.json`. Recorre fotos y las carpetas padre de rutas locales del inventario, incluyendo imágenes no referenciadas dentro de ellas. Revisar files, orphans (con IDs), unsupported y pendingVideos. orphanMediaCount cuenta filas, no URLs únicas. Los videos pueden aparecer como fila y como archivo pendiente; el resumen de pendientes cuenta entradas, no videos únicos.

3. Resolver huérfanos antes de retirar archivos del repo. VIDEO y extensiones de video quedan pendientes, sin subir ni modificar URLs. JPG/JPEG/PNG/WebP/GIF/AVIF/SVG se reconocen por extensión; no se comprimen ni transforman. Revisar volumen y presupuesto del store antes de subir. El límite de 4 MB de C1 no aplica: este script corre localmente, fuera de Vercel Functions.
4. Configurar BLOB_READ_WRITE_TOKEN en el entorno o .env local. Prioridad: entorno, apps/web/.env.local, .env.local, apps/web/.env, .env. `--env ruta` selecciona exclusivamente otro archivo. Nunca se imprime el token. Ejecutar:

```powershell
node scripts/migrate-photos-to-blob.cjs --media uploads/photo-migration/media-respaldo.json --apply --report uploads/photo-migration/applied.json
```

Usa put() del SDK instalado en apps/web, acceso público, pathname relativo exacto, sin sufijo aleatorio ni sobrescritura. Una URL compartida por varias Media se sube una vez. URLs externas no se modifican. Rutas con traversal/enlaces simbólicos se rechazan.

5. Abrir las URLs de applied.json, verificar imágenes y revisar `scripts/sql/migrate-photos-to-blob.generated.sql`. Contiene BEGIN/COMMIT, mapeo temporal exclusivamente de respuestas exitosas, validación de dominio/ruta en Node, comprobación de IDs/tipo/URL anterior en SQL, bloqueo contra escrituras concurrentes y comprobación posterior. Guardar el SELECT de URLs anteriores como respaldo. SQL no puede consultar Blob: la evidencia del upload es el reporte, y la comprobación remota es manual. No se generan URLs anticipadas ni UPDATE con dry-run.
6. Aplicar ese SQL manualmente en Respaldo; verificar galería, lightbox, presentación, hero/editor y archivos pendientes. Consultar las URLs locales restantes (query al final del SQL). La transacción acepta una segunda aplicación si las filas ya tienen exactamente la nueva URL.
7. Exportar también Media de main y comparar IDs/URLs con Respaldo. Si son distintos, NO usar ciegamente el mismo SQL: preparar inventario/mapeo correspondiente revisando el reporte de objetos ya subidos. Crear restore point en main, aplicar manualmente el SQL validado y verificar. Ninguno de estos pasos lo ejecuta Codex.
8. Solo después de resolver TODAS las referencias locales (incluidos videos, referencias de código/CSS y otros assets), Emma puede autorizar y borrar los archivos migrados del repo, y ordenar redeploy. No borrar toda fotos si conserva videos u otros archivos necesarios. Este cambio no borra archivos ni despliega.

## Fallos y reversión

Cada fallo de put se lista por pathname sin revelar detalles sensibles del SDK; salida 1. El reporte y SQL pueden contener solo el subconjunto exitoso: revisarlos antes de aplicar. No hay reintentos automáticos ni sobrescritura. Conservar el reporte tras cada ejecución; usar nombres distintos con --report/--sql para lotes posteriores. El script rechaza un SQL de salida existente ANTES de subir. Para reanudar, revisar objetos en Storage y aislar archivos pendientes en una copia local del proyecto; no volver a subir ciegamente objetos existentes. No se borra Blob automáticamente.

Si falla la transacción, ejecutar ROLLBACK en esa sesión. Para revertir después de COMMIT, usar el mapeo preservado, revisado manualmente, por ejemplo:

```sql
BEGIN;
-- Repetir con id/oldUrl/url EXACTOS de applied.json; sin inventar valores.
UPDATE "Media" SET url = '/fotos/slug/1.jpg'
WHERE id = 'ID_REAL' AND url = 'URL_BLOB_DEL_REPORTE';
COMMIT;
```

Mantener los archivos originales para que la reversión funcione. No borrar objetos remotos hasta verificar que no los usa ninguna BD.

## Pruebas

```powershell
node scripts/test-migrate-photos-to-blob.cjs
```

SDK mock, sin red ni BD: dry-run sin put, dos carpetas, MIME, duplicados, huérfano, exclusión VIDEO, rutas inseguras, SQL escapado y fallo sin mapeo. Fixtures temporales conservadas. QA real y aplicación manual pendientes de Emma.

Supuestos: store público compatible con *.public.blob.vercel-storage.com; inventario reciente y completo exportado por Emma; Node 24 disponible. Sin exportación no se afirma cuántas Media reales están huérfanas. SQL generado no requiere migración de schema.
