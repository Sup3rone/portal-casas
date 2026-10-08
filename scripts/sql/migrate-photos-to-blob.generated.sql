-- Generado SOLO con respuestas exitosas de put(). Revisar reporte antes de ejecutar.
BEGIN;
LOCK TABLE "Media" IN SHARE ROW EXCLUSIVE MODE;
CREATE TEMP TABLE photo_blob_map (id text PRIMARY KEY, old_url text NOT NULL, new_url text NOT NULL) ON COMMIT DROP;
INSERT INTO photo_blob_map VALUES
('med-030', '/fotos/arian-ocean-vallarta/01.jpg', 'https://eorinf4h9dcvcdit.public.blob.vercel-storage.com/fotos/arian-ocean-vallarta/01.jpg'),
('med-031', '/fotos/arian-ocean-vallarta/02.jpg', 'https://eorinf4h9dcvcdit.public.blob.vercel-storage.com/fotos/arian-ocean-vallarta/02.jpg'),
('med-032', '/fotos/arian-ocean-vallarta/03.jpg', 'https://eorinf4h9dcvcdit.public.blob.vercel-storage.com/fotos/arian-ocean-vallarta/03.jpg'),
('med-033', '/fotos/arian-ocean-vallarta/04.jpg', 'https://eorinf4h9dcvcdit.public.blob.vercel-storage.com/fotos/arian-ocean-vallarta/04.jpg'),
('med-034', '/fotos/arian-ocean-vallarta/05.jpg', 'https://eorinf4h9dcvcdit.public.blob.vercel-storage.com/fotos/arian-ocean-vallarta/05.jpg'),
('med-035', '/fotos/arian-ocean-vallarta/06.jpg', 'https://eorinf4h9dcvcdit.public.blob.vercel-storage.com/fotos/arian-ocean-vallarta/06.jpg'),
('med-036', '/fotos/arian-ocean-vallarta/07.jpg', 'https://eorinf4h9dcvcdit.public.blob.vercel-storage.com/fotos/arian-ocean-vallarta/07.jpg'),
('med-037', '/fotos/arian-ocean-vallarta/08.jpg', 'https://eorinf4h9dcvcdit.public.blob.vercel-storage.com/fotos/arian-ocean-vallarta/08.jpg'),
('med-038', '/fotos/arian-ocean-vallarta/09.jpg', 'https://eorinf4h9dcvcdit.public.blob.vercel-storage.com/fotos/arian-ocean-vallarta/09.jpg'),
('med-039', '/fotos/arian-ocean-vallarta/10.jpg', 'https://eorinf4h9dcvcdit.public.blob.vercel-storage.com/fotos/arian-ocean-vallarta/10.jpg'),
('med-040', '/fotos/arian-ocean-vallarta/11.jpg', 'https://eorinf4h9dcvcdit.public.blob.vercel-storage.com/fotos/arian-ocean-vallarta/11.jpg'),
('med-041', '/fotos/arian-ocean-vallarta/12.jpg', 'https://eorinf4h9dcvcdit.public.blob.vercel-storage.com/fotos/arian-ocean-vallarta/12.jpg'),
('med-042', '/fotos/arian-ocean-vallarta/13.jpg', 'https://eorinf4h9dcvcdit.public.blob.vercel-storage.com/fotos/arian-ocean-vallarta/13.jpg'),
('med-043', '/fotos/arian-ocean-vallarta/14.jpg', 'https://eorinf4h9dcvcdit.public.blob.vercel-storage.com/fotos/arian-ocean-vallarta/14.jpg'),
('med-044', '/fotos/arian-ocean-vallarta/15.jpg', 'https://eorinf4h9dcvcdit.public.blob.vercel-storage.com/fotos/arian-ocean-vallarta/15.jpg'),
('med-045', '/fotos/arian-ocean-vallarta/16.jpg', 'https://eorinf4h9dcvcdit.public.blob.vercel-storage.com/fotos/arian-ocean-vallarta/16.jpg'),
('med-046', '/fotos/arian-ocean-vallarta/17.jpg', 'https://eorinf4h9dcvcdit.public.blob.vercel-storage.com/fotos/arian-ocean-vallarta/17.jpg'),
('med-047', '/fotos/arian-ocean-vallarta/18.jpg', 'https://eorinf4h9dcvcdit.public.blob.vercel-storage.com/fotos/arian-ocean-vallarta/18.jpg'),
('med-048', '/fotos/arian-ocean-vallarta/19.jpg', 'https://eorinf4h9dcvcdit.public.blob.vercel-storage.com/fotos/arian-ocean-vallarta/19.jpg'),
('med-049', '/fotos/arian-ocean-vallarta/20.jpg', 'https://eorinf4h9dcvcdit.public.blob.vercel-storage.com/fotos/arian-ocean-vallarta/20.jpg'),
('med-050', '/fotos/arian-ocean-vallarta/21.jpg', 'https://eorinf4h9dcvcdit.public.blob.vercel-storage.com/fotos/arian-ocean-vallarta/21.jpg'),
('med-051', '/fotos/arian-ocean-vallarta/22.jpg', 'https://eorinf4h9dcvcdit.public.blob.vercel-storage.com/fotos/arian-ocean-vallarta/22.jpg'),
('med-052', '/fotos/arian-ocean-vallarta/23.jpg', 'https://eorinf4h9dcvcdit.public.blob.vercel-storage.com/fotos/arian-ocean-vallarta/23.jpg'),
('med-053', '/fotos/arian-ocean-vallarta/24.jpg', 'https://eorinf4h9dcvcdit.public.blob.vercel-storage.com/fotos/arian-ocean-vallarta/24.jpg'),
('med-054', '/fotos/arian-ocean-vallarta/25.jpg', 'https://eorinf4h9dcvcdit.public.blob.vercel-storage.com/fotos/arian-ocean-vallarta/25.jpg'),
('med-055', '/fotos/arian-ocean-vallarta/26.jpg', 'https://eorinf4h9dcvcdit.public.blob.vercel-storage.com/fotos/arian-ocean-vallarta/26.jpg'),
('med-056', '/fotos/arian-ocean-vallarta/27.jpg', 'https://eorinf4h9dcvcdit.public.blob.vercel-storage.com/fotos/arian-ocean-vallarta/27.jpg'),
('med-057', '/fotos/arian-ocean-vallarta/28.jpg', 'https://eorinf4h9dcvcdit.public.blob.vercel-storage.com/fotos/arian-ocean-vallarta/28.jpg'),
('med-058', '/fotos/arian-ocean-vallarta/29.jpg', 'https://eorinf4h9dcvcdit.public.blob.vercel-storage.com/fotos/arian-ocean-vallarta/29.jpg'),
('med-059', '/fotos/arian-ocean-vallarta/30.jpg', 'https://eorinf4h9dcvcdit.public.blob.vercel-storage.com/fotos/arian-ocean-vallarta/30.jpg'),
('med-060', '/fotos/arian-ocean-vallarta/31.jpg', 'https://eorinf4h9dcvcdit.public.blob.vercel-storage.com/fotos/arian-ocean-vallarta/31.jpg'),
('med-061', '/fotos/arian-ocean-vallarta/32.jpg', 'https://eorinf4h9dcvcdit.public.blob.vercel-storage.com/fotos/arian-ocean-vallarta/32.jpg'),
('med-062', '/fotos/arian-ocean-vallarta/33.jpg', 'https://eorinf4h9dcvcdit.public.blob.vercel-storage.com/fotos/arian-ocean-vallarta/33.jpg'),
('med-063', '/fotos/arian-ocean-vallarta/34.jpg', 'https://eorinf4h9dcvcdit.public.blob.vercel-storage.com/fotos/arian-ocean-vallarta/34.jpg'),
('med-064', '/fotos/arian-ocean-vallarta/35.jpg', 'https://eorinf4h9dcvcdit.public.blob.vercel-storage.com/fotos/arian-ocean-vallarta/35.jpg'),
('med-065', '/fotos/arian-ocean-vallarta/36.jpg', 'https://eorinf4h9dcvcdit.public.blob.vercel-storage.com/fotos/arian-ocean-vallarta/36.jpg'),
('med-066', '/fotos/arian-ocean-vallarta/37.jpg', 'https://eorinf4h9dcvcdit.public.blob.vercel-storage.com/fotos/arian-ocean-vallarta/37.jpg'),
('med-067', '/fotos/arian-ocean-vallarta/38.jpg', 'https://eorinf4h9dcvcdit.public.blob.vercel-storage.com/fotos/arian-ocean-vallarta/38.jpg'),
('med-068', '/fotos/arian-ocean-vallarta/39.jpg', 'https://eorinf4h9dcvcdit.public.blob.vercel-storage.com/fotos/arian-ocean-vallarta/39.jpg'),
('med-069', '/fotos/arian-ocean-vallarta/40.jpg', 'https://eorinf4h9dcvcdit.public.blob.vercel-storage.com/fotos/arian-ocean-vallarta/40.jpg'),
('med-070', '/fotos/arian-ocean-vallarta/41.jpg', 'https://eorinf4h9dcvcdit.public.blob.vercel-storage.com/fotos/arian-ocean-vallarta/41.jpg'),
('med-071', '/fotos/arian-ocean-vallarta/42.jpg', 'https://eorinf4h9dcvcdit.public.blob.vercel-storage.com/fotos/arian-ocean-vallarta/42.jpg'),
('med-072', '/fotos/arian-ocean-vallarta/43.jpg', 'https://eorinf4h9dcvcdit.public.blob.vercel-storage.com/fotos/arian-ocean-vallarta/43.jpg'),
('med-073', '/fotos/arian-ocean-vallarta/44.jpg', 'https://eorinf4h9dcvcdit.public.blob.vercel-storage.com/fotos/arian-ocean-vallarta/44.jpg'),
('med-074', '/fotos/arian-ocean-vallarta/45.jpg', 'https://eorinf4h9dcvcdit.public.blob.vercel-storage.com/fotos/arian-ocean-vallarta/45.jpg'),
('med-075', '/fotos/arian-ocean-vallarta/46.jpg', 'https://eorinf4h9dcvcdit.public.blob.vercel-storage.com/fotos/arian-ocean-vallarta/46.jpg'),
('med-076', '/fotos/arian-ocean-vallarta/47.jpg', 'https://eorinf4h9dcvcdit.public.blob.vercel-storage.com/fotos/arian-ocean-vallarta/47.jpg'),
('med-077', '/fotos/arian-ocean-vallarta/48.jpg', 'https://eorinf4h9dcvcdit.public.blob.vercel-storage.com/fotos/arian-ocean-vallarta/48.jpg'),
('med-078', '/fotos/arian-ocean-vallarta/49.jpg', 'https://eorinf4h9dcvcdit.public.blob.vercel-storage.com/fotos/arian-ocean-vallarta/49.jpg'),
('med-079', '/fotos/arian-ocean-vallarta/50.jpg', 'https://eorinf4h9dcvcdit.public.blob.vercel-storage.com/fotos/arian-ocean-vallarta/50.jpg'),
('med-080', '/fotos/arian-ocean-vallarta/51.jpg', 'https://eorinf4h9dcvcdit.public.blob.vercel-storage.com/fotos/arian-ocean-vallarta/51.jpg'),
('med-081', '/fotos/arian-ocean-vallarta/52.jpg', 'https://eorinf4h9dcvcdit.public.blob.vercel-storage.com/fotos/arian-ocean-vallarta/52.jpg'),
('med-082', '/fotos/arian-ocean-vallarta/53.jpg', 'https://eorinf4h9dcvcdit.public.blob.vercel-storage.com/fotos/arian-ocean-vallarta/53.jpg'),
('med-083', '/fotos/arian-ocean-vallarta/54.jpg', 'https://eorinf4h9dcvcdit.public.blob.vercel-storage.com/fotos/arian-ocean-vallarta/54.jpg'),
('med-084', '/fotos/arian-ocean-vallarta/55.jpg', 'https://eorinf4h9dcvcdit.public.blob.vercel-storage.com/fotos/arian-ocean-vallarta/55.jpg'),
('med-001', '/fotos/del-canto-vallarta/01.jpg', 'https://eorinf4h9dcvcdit.public.blob.vercel-storage.com/fotos/del-canto-vallarta/01.jpg'),
('med-002', '/fotos/del-canto-vallarta/02.jpg', 'https://eorinf4h9dcvcdit.public.blob.vercel-storage.com/fotos/del-canto-vallarta/02.jpg'),
('med-003', '/fotos/del-canto-vallarta/03.jpg', 'https://eorinf4h9dcvcdit.public.blob.vercel-storage.com/fotos/del-canto-vallarta/03.jpg'),
('med-005', '/fotos/del-canto-vallarta/05.jpg', 'https://eorinf4h9dcvcdit.public.blob.vercel-storage.com/fotos/del-canto-vallarta/05.jpg'),
('med-006', '/fotos/del-canto-vallarta/06.jpg', 'https://eorinf4h9dcvcdit.public.blob.vercel-storage.com/fotos/del-canto-vallarta/06.jpg'),
('med-007', '/fotos/del-canto-vallarta/07.jpg', 'https://eorinf4h9dcvcdit.public.blob.vercel-storage.com/fotos/del-canto-vallarta/07.jpg'),
('med-008', '/fotos/del-canto-vallarta/08.jpg', 'https://eorinf4h9dcvcdit.public.blob.vercel-storage.com/fotos/del-canto-vallarta/08.jpg'),
('med-009', '/fotos/del-canto-vallarta/09.jpg', 'https://eorinf4h9dcvcdit.public.blob.vercel-storage.com/fotos/del-canto-vallarta/09.jpg'),
('med-010', '/fotos/del-canto-vallarta/10.jpg', 'https://eorinf4h9dcvcdit.public.blob.vercel-storage.com/fotos/del-canto-vallarta/10.jpg'),
('med-011', '/fotos/del-canto-vallarta/11.jpg', 'https://eorinf4h9dcvcdit.public.blob.vercel-storage.com/fotos/del-canto-vallarta/11.jpg'),
('med-012', '/fotos/del-canto-vallarta/12.jpg', 'https://eorinf4h9dcvcdit.public.blob.vercel-storage.com/fotos/del-canto-vallarta/12.jpg'),
('med-013', '/fotos/del-canto-vallarta/13.jpg', 'https://eorinf4h9dcvcdit.public.blob.vercel-storage.com/fotos/del-canto-vallarta/13.jpg'),
('med-014', '/fotos/del-canto-vallarta/14.jpg', 'https://eorinf4h9dcvcdit.public.blob.vercel-storage.com/fotos/del-canto-vallarta/14.jpg'),
('med-015', '/fotos/del-canto-vallarta/15.jpg', 'https://eorinf4h9dcvcdit.public.blob.vercel-storage.com/fotos/del-canto-vallarta/15.jpg'),
('med-016', '/fotos/del-canto-vallarta/16.jpg', 'https://eorinf4h9dcvcdit.public.blob.vercel-storage.com/fotos/del-canto-vallarta/16.jpg'),
('med-017', '/fotos/del-canto-vallarta/17.jpg', 'https://eorinf4h9dcvcdit.public.blob.vercel-storage.com/fotos/del-canto-vallarta/17.jpg'),
('med-018', '/fotos/del-canto-vallarta/18.jpg', 'https://eorinf4h9dcvcdit.public.blob.vercel-storage.com/fotos/del-canto-vallarta/18.jpg'),
('med-019', '/fotos/del-canto-vallarta/19.jpg', 'https://eorinf4h9dcvcdit.public.blob.vercel-storage.com/fotos/del-canto-vallarta/19.jpg'),
('med-020', '/fotos/del-canto-vallarta/20.jpg', 'https://eorinf4h9dcvcdit.public.blob.vercel-storage.com/fotos/del-canto-vallarta/20.jpg'),
('med-021', '/fotos/del-canto-vallarta/21.jpg', 'https://eorinf4h9dcvcdit.public.blob.vercel-storage.com/fotos/del-canto-vallarta/21.jpg'),
('med-022', '/fotos/del-canto-vallarta/22.jpg', 'https://eorinf4h9dcvcdit.public.blob.vercel-storage.com/fotos/del-canto-vallarta/22.jpg'),
('med-023', '/fotos/del-canto-vallarta/23.jpg', 'https://eorinf4h9dcvcdit.public.blob.vercel-storage.com/fotos/del-canto-vallarta/23.jpg'),
('med-024', '/fotos/del-canto-vallarta/24.jpg', 'https://eorinf4h9dcvcdit.public.blob.vercel-storage.com/fotos/del-canto-vallarta/24.jpg'),
('med-025', '/fotos/del-canto-vallarta/25.jpg', 'https://eorinf4h9dcvcdit.public.blob.vercel-storage.com/fotos/del-canto-vallarta/25.jpg'),
('med-026', '/fotos/del-canto-vallarta/26.jpg', 'https://eorinf4h9dcvcdit.public.blob.vercel-storage.com/fotos/del-canto-vallarta/26.jpg'),
('med-027', '/fotos/del-canto-vallarta/27.jpg', 'https://eorinf4h9dcvcdit.public.blob.vercel-storage.com/fotos/del-canto-vallarta/27.jpg'),
('med-028', '/fotos/del-canto-vallarta/28.jpg', 'https://eorinf4h9dcvcdit.public.blob.vercel-storage.com/fotos/del-canto-vallarta/28.jpg'),
('med-029', '/fotos/del-canto-vallarta/29.jpg', 'https://eorinf4h9dcvcdit.public.blob.vercel-storage.com/fotos/del-canto-vallarta/29.jpg');
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM photo_blob_map x LEFT JOIN "Media" m ON m.id = x.id WHERE m.id IS NULL OR m.type <> 'PHOTO' OR m.url NOT IN (x.old_url, x.new_url)) THEN
    RAISE EXCEPTION 'Media cambió desde el inventario: abortar y exportar de nuevo';
  END IF;
  IF EXISTS (SELECT 1 FROM photo_blob_map WHERE new_url !~ '^https://[a-zA-Z0-9.-]+\.public\.blob\.vercel-storage\.com/') THEN
    RAISE EXCEPTION 'URL Blob pública inválida';
  END IF;
END $$;
-- Conservar este resultado como respaldo antes del UPDATE.
SELECT m.id, m.url AS old_url, x.new_url FROM "Media" m JOIN photo_blob_map x ON x.id = m.id;
UPDATE "Media" m SET url = x.new_url FROM photo_blob_map x WHERE m.id = x.id AND m.url = x.old_url;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "Media" m JOIN photo_blob_map x ON x.id = m.id WHERE m.url <> x.new_url) THEN
    RAISE EXCEPTION 'Verificación posterior falló';
  END IF;
END $$;
SELECT id, url, type FROM "Media" WHERE url LIKE '/%' AND url NOT LIKE '//%';
COMMIT;
