const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { migrate, localPath, sqlFor } = require('./migrate-photos-to-blob.cjs');

(async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'portal-photo-migration-'));
  const publicDir = path.join(directory, 'public');
  fs.mkdirSync(path.join(publicDir, 'fotos/casa'), { recursive: true });
  fs.mkdirSync(path.join(publicDir, 'images'), { recursive: true });
  fs.writeFileSync(path.join(publicDir, 'fotos/casa/1.jpg'), 'photo');
  fs.writeFileSync(path.join(publicDir, 'fotos/casa/video.mp4'), 'video');
  fs.writeFileSync(path.join(publicDir, 'images/otra.png'), 'photo');
  const media = [
    { id: "p'1", url: '/fotos/casa/1.jpg', type: 'PHOTO' },
    { id: 'p2', url: '/fotos/casa/1.jpg', type: 'PHOTO' },
    { id: 'p3', url: '/images/otra.png', type: 'PHOTO' },
    { id: 'missing', url: '/fotos/casa/missing.jpg', type: 'PHOTO' },
    { id: 'video', url: '/fotos/casa/video.mp4', type: 'VIDEO' },
    { id: 'external', url: 'https://example.com/photo.jpg', type: 'PHOTO' }
  ];
  const calls = [];
  const put = async (pathname, body, options) => {
    calls.push({ pathname, body, options });
    return { pathname, url: `https://test.public.blob.vercel-storage.com/${pathname}` };
  };
  const reportFile = path.join(directory, 'report.json');
  const sqlFile = path.join(directory, 'migration.sql');
  const dry = await migrate({ publicDir, media, put, reportFile, sqlFile });
  assert.equal(calls.length, 0);
  assert.equal(dry.files.length, 2);
  assert.equal(dry.orphanMediaCount, 1);
  assert.equal(fs.existsSync(sqlFile), false);
  const applied = await migrate({ publicDir, media, put, token: 'mock', apply: true, reportFile, sqlFile });
  assert.equal(applied.uploadedFileCount, 2);
  assert.equal(applied.mappings.length, 3);
  assert.deepEqual(calls.map(call => call.pathname), ['fotos/casa/1.jpg', 'images/otra.png']);
  assert.equal(calls[0].options.contentType, 'image/jpeg');
  assert.equal(calls[1].options.contentType, 'image/png');
  assert.equal(calls[0].options.allowOverwrite, false);
  const sql = fs.readFileSync(sqlFile, 'utf8');
  assert.ok(sql.includes("'p''1'"));
  assert.ok(sql.includes('BEGIN;') && sql.includes('COMMIT;'));
  assert.ok(sql.includes('RAISE EXCEPTION') && !sql.includes("('video',"));
  assert.throws(() => localPath('/../secret.jpg'));
  assert.throws(() => localPath('/%2e%2e/secret.jpg'));
  assert.equal(localPath('//example.com/a.jpg'), null);
  assert.throws(() => sqlFor([]));
  const failed = await migrate({ publicDir, media, put: async () => { throw new Error('SDK secret'); }, token: 'mock', apply: true, reportFile, sqlFile: path.join(directory, 'failed.sql') });
  assert.equal(failed.failures.length, 2);
  assert.equal(failed.mappings.length, 0);
  assert.equal(fs.existsSync(path.join(directory, 'failed.sql')), false);
  assert.ok(!fs.readFileSync(reportFile, 'utf8').includes('SDK secret'));
  console.log('Migración fotos: dry-run, rutas, MIME, duplicados, videos, huérfanos, SQL y fallos OK.');
  // Fixture temporal conservada; no borrar carpetas durante esta tarea.
})().catch(error => { console.error(error); process.exitCode = 1; });
