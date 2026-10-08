const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const { parseEnv } = require('node:util');

const root = path.resolve(__dirname, '..');
const imageTypes = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif', '.avif': 'image/avif', '.svg': 'image/svg+xml' };
const videoExtensions = new Set(['.mp4', '.webm', '.mov', '.m4v', '.avi', '.mkv', '.ogv']);
const quote = value => `'${String(value).replace(/'/g, "''")}'`;

function localPath(url) {
  if (!url.startsWith('/') || url.startsWith('//')) return null;
  const decoded = decodeURIComponent(url.split(/[?#]/)[0]);
  if (decoded.includes('\\') || decoded.includes('\0') || decoded.split('/').some(part => part === '..' || part === '.')) throw new Error(`Ruta local insegura: ${url}`);
  return decoded.slice(1);
}

function sqlFor(mappings) {
  if (!mappings.length) throw new Error('No hay Media subidas para generar SQL.');
  const values = mappings.map(row => `(${quote(row.id)}, ${quote(row.oldUrl)}, ${quote(row.url)})`).join(',\n');
  return `-- Generado SOLO con respuestas exitosas de put(). Revisar reporte antes de ejecutar.\nBEGIN;\nLOCK TABLE "Media" IN SHARE ROW EXCLUSIVE MODE;\nCREATE TEMP TABLE photo_blob_map (id text PRIMARY KEY, old_url text NOT NULL, new_url text NOT NULL) ON COMMIT DROP;\nINSERT INTO photo_blob_map VALUES\n${values};\nDO $$\nBEGIN\n  IF EXISTS (SELECT 1 FROM photo_blob_map x LEFT JOIN "Media" m ON m.id = x.id WHERE m.id IS NULL OR m.type <> 'PHOTO' OR m.url NOT IN (x.old_url, x.new_url)) THEN\n    RAISE EXCEPTION 'Media cambió desde el inventario: abortar y exportar de nuevo';\n  END IF;\n  IF EXISTS (SELECT 1 FROM photo_blob_map WHERE new_url !~ '^https://[a-zA-Z0-9.-]+\\.public\\.blob\\.vercel-storage\\.com/') THEN\n    RAISE EXCEPTION 'URL Blob pública inválida';\n  END IF;\nEND $$;\n-- Conservar este resultado como respaldo antes del UPDATE.\nSELECT m.id, m.url AS old_url, x.new_url FROM "Media" m JOIN photo_blob_map x ON x.id = m.id;\nUPDATE "Media" m SET url = x.new_url FROM photo_blob_map x WHERE m.id = x.id AND m.url = x.old_url;\nDO $$\nBEGIN\n  IF EXISTS (SELECT 1 FROM "Media" m JOIN photo_blob_map x ON x.id = m.id WHERE m.url <> x.new_url) THEN\n    RAISE EXCEPTION 'Verificación posterior falló';\n  END IF;\nEND $$;\nSELECT id, url, type FROM "Media" WHERE url LIKE '/%' AND url NOT LIKE '//%';\nCOMMIT;\n`;
}

function readToken(envFile) {
  if (envFile) return parseEnv(fs.readFileSync(envFile, 'utf8')).BLOB_READ_WRITE_TOKEN;
  if (process.env.BLOB_READ_WRITE_TOKEN) return process.env.BLOB_READ_WRITE_TOKEN;
  for (const relative of ['apps/web/.env.local', '.env.local', 'apps/web/.env', '.env']) {
    const file = path.join(root, relative);
    if (fs.existsSync(file)) {
      const token = parseEnv(fs.readFileSync(file, 'utf8')).BLOB_READ_WRITE_TOKEN;
      if (token) return token;
    }
  }
}

async function migrate({ publicDir, media, apply = false, put, token, reportFile, sqlFile }) {
  if (!Array.isArray(media) || media.some(row => !row || typeof row.id !== 'string' || typeof row.url !== 'string' || !['PHOTO', 'VIDEO'].includes(row.type)) || new Set(media.map(row => row.id)).size !== media.length) throw new Error('Inventario inválido: se requieren id único, url y type PHOTO/VIDEO.');
  const base = fs.realpathSync(publicDir);
  const files = new Map();
  const report = { mode: apply ? 'apply' : 'dry-run', files: [], pendingVideos: [], unsupported: [], orphans: [], mappings: [], failures: [] };
  function safeFile(relative) {
    const absolute = path.resolve(base, relative);
    if (!absolute.startsWith(base + path.sep)) throw new Error('Archivo fuera de public.');
    if (fs.existsSync(absolute) && !fs.realpathSync(absolute).startsWith(base + path.sep)) throw new Error('Enlace fuera de public.');
    return absolute;
  }
  function walk(relative) {
    const absolute = safeFile(relative);
    if (!fs.existsSync(absolute)) return;
    if (fs.lstatSync(absolute).isSymbolicLink()) throw new Error(`Enlace simbólico no permitido: ${relative}`);
    if (fs.statSync(absolute).isDirectory()) {
      for (const name of fs.readdirSync(absolute).sort()) walk(path.posix.join(relative, name));
    } else files.set(relative, absolute);
  }
  walk('fotos');
  const references = new Map();
  for (const row of media) {
    const relative = localPath(row.url);
    if (relative === null) continue;
    if (!relative) throw new Error('Media no puede referenciar la raíz public.');
    const absolute = safeFile(relative);
    if (!fs.existsSync(absolute) || !fs.statSync(absolute).isFile()) report.orphans.push({ id: row.id, url: row.url, type: row.type });
    if (row.type === 'VIDEO') report.pendingVideos.push({ id: row.id, url: row.url });
    const rows = references.get(relative) || [];
    rows.push(row);
    references.set(relative, rows);
    const parent = path.posix.dirname(relative);
    if (parent === '.') { if (fs.existsSync(absolute) && fs.statSync(absolute).isFile()) files.set(relative, absolute); }
    else walk(parent);
  }
  if (apply && (!token || typeof put !== 'function')) throw new Error('Falta BLOB_READ_WRITE_TOKEN o SDK put().');
  for (const [relative, absolute] of [...files].sort(([a], [b]) => a.localeCompare(b))) {
    const rows = references.get(relative) || [];
    const extension = path.extname(relative).toLowerCase();
    if (videoExtensions.has(extension) || rows.some(row => row.type === 'VIDEO')) {
      report.pendingVideos.push({ pathname: relative });
      continue;
    }
    const contentType = imageTypes[extension];
    if (!contentType) { report.unsupported.push(relative); continue; }
    const entry = { pathname: relative, bytes: fs.statSync(absolute).size, contentType, mediaIds: rows.map(row => row.id) };
    report.files.push(entry);
    if (apply) {
      try {
        const blob = await put(relative, fs.readFileSync(absolute), { access: 'public', contentType, addRandomSuffix: false, allowOverwrite: false, token });
        const url = new URL(blob.url);
        if (url.protocol !== 'https:' || !url.hostname.endsWith('.public.blob.vercel-storage.com') || blob.pathname !== relative || decodeURIComponent(url.pathname.slice(1)) !== relative) throw new Error('Respuesta Blob inesperada.');
        entry.url = blob.url;
        for (const row of rows) report.mappings.push({ id: row.id, oldUrl: row.url, url: blob.url });
      } catch { report.failures.push(relative); }
    }
  }
  report.orphanMediaCount = report.orphans.length;
  report.uploadedFileCount = report.files.filter(file => file.url).length;
  fs.mkdirSync(path.dirname(reportFile), { recursive: true });
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2) + '\n');
  if (apply && report.mappings.length) {
    fs.mkdirSync(path.dirname(sqlFile), { recursive: true });
    // No sobrescribir un SQL anterior con otra ejecución parcial.
    fs.writeFileSync(sqlFile, sqlFor(report.mappings), { flag: 'wx' });
  }
  return report;
}

async function main() {
  const args = process.argv.slice(2);
  const options = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--apply' || arg === '--dry-run') options[arg.slice(2)] = true;
    else if (['--media', '--env', '--report', '--sql'].includes(arg) && args[i + 1] && !args[i + 1].startsWith('--')) options[arg.slice(2)] = path.resolve(args[++i]);
    else throw new Error(`Argumento inválido: ${arg}`);
  }
  if (!options.media || (options.apply && options['dry-run'])) throw new Error('Uso: node scripts/migrate-photos-to-blob.cjs --media <inventario.json> [--apply | --dry-run] [--env <archivo>] [--report <reporte.json>] [--sql <salida.sql>]');
  const reportFile = options.report || path.join(root, 'uploads/photo-migration/report.json');
  const sqlFile = options.sql || path.join(root, 'scripts/sql/migrate-photos-to-blob.generated.sql');
  if (options.apply && fs.existsSync(sqlFile)) throw new Error('SQL de salida ya existe: revisarlo y elegir otro --sql antes de subir.');
  const put = options.apply ? createRequire(path.join(root, 'apps/web/package.json'))('@vercel/blob').put : undefined;
  const report = await migrate({ publicDir: path.join(root, 'apps/web/public'), media: JSON.parse(fs.readFileSync(options.media, 'utf8')), apply: !!options.apply, put, token: options.apply ? readToken(options.env) : undefined, reportFile, sqlFile });
  for (const file of report.files) console.log(`${file.pathname} (${file.bytes} bytes)${file.url ? ` → ${file.url}` : ''}`);
  console.log(JSON.stringify({ mode: report.mode, candidates: report.files.length, uploaded: report.uploadedFileCount, orphanMedia: report.orphanMediaCount, pendingVideoEntries: report.pendingVideos.length, failures: report.failures.length, reportFile, sqlFile: report.mappings.length ? sqlFile : null }, null, 2));
  if (report.failures.length) process.exitCode = 1;
}

module.exports = { migrate, sqlFor, localPath };
if (require.main === module) main().catch(error => { console.error(error.message); process.exitCode = 1; });
