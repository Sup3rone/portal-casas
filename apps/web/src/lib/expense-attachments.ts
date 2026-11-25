// T-5248 (fase 2): facturas y recibos en el almacén PRIVADO de Vercel Blob. El almacén de fotos es público y Vercel no
// admite archivos privados en él, por eso hay un segundo almacén con su propio token (BLOB_PRIVATE_READ_WRITE_TOKEN).
// Sin el token, subir responde 503 ATTACHMENTS_DISABLED y el resto del módulo sigue funcionando.
// Permisos: el mismo corte por casa del panel en subir, descargar y borrar (casa ajena o registro ajeno → 404).
import 'server-only';
import { put, get, del } from '@vercel/blob';
import { db, expenseAttachments, expenseEntries, maintenances } from '@portal/db';
import { and, eq } from 'drizzle-orm';
import { AccessError, managedResource, type PropertyManager } from './property-access';
import { managedProperty } from './panel-server';
import { AttachmentError, attachmentMetadata, attachmentPath, safeFileName } from './expense-attachment-rules';

export const attachmentTargets = ['maintenance', 'entry'] as const;
export type AttachmentTarget = typeof attachmentTargets[number];

export function privateBlobToken() { return process.env.BLOB_PRIVATE_READ_WRITE_TOKEN || ''; }
export function attachmentsEnabled() { return Boolean(privateBlobToken()); }

export function attachmentTarget(value: string): AttachmentTarget {
  if (!(attachmentTargets as readonly string[]).includes(value)) throw new AccessError(404);
  return value as AttachmentTarget;
}

async function assertTarget(propertyId: string, target: AttachmentTarget, targetId: string, manager: PropertyManager) {
  const table = target === 'maintenance' ? maintenances : expenseEntries;
  const [row] = await db.select({ id: table.id }).from(table)
    .where(and(eq(table.id, targetId), eq(table.propertyId, propertyId), managedResource(table.propertyId, manager))).limit(1);
  if (!row) throw new AccessError(404);
}

export async function uploadAttachment(propertyId: string, target: AttachmentTarget, targetId: string, form: FormData | null, manager: PropertyManager) {
  await managedProperty(propertyId, manager);
  await assertTarget(propertyId, target, targetId, manager);
  if (!form || form.getAll('file').length !== 1 || [...form.keys()].some(key => key !== 'file')) throw new AttachmentError('INVALID_ATTACHMENT_REQUEST');
  const file = form.get('file');
  if (!(file instanceof File)) throw new AttachmentError('INVALID_ATTACHMENT_REQUEST');
  const { contentType, size } = attachmentMetadata(file.type, file.size);
  const token = privateBlobToken();
  if (!token) throw new AttachmentError('ATTACHMENTS_DISABLED');
  const id = crypto.randomUUID(), pathname = attachmentPath(propertyId, id, contentType);
  // Revalidar el permiso justo antes de escribir (como la subida de fotos).
  await assertTarget(propertyId, target, targetId, manager);
  await put(pathname, file, { access: 'private', contentType, addRandomSuffix: false, allowOverwrite: false, token });
  try {
    await db.insert(expenseAttachments).values({
      id, propertyId, maintenanceId: target === 'maintenance' ? targetId : null, entryId: target === 'entry' ? targetId : null,
      pathname, contentType, size, fileName: safeFileName(file.name, contentType), uploadedBy: manager.id, createdAt: new Date(),
    });
  } catch (error) {
    await del(pathname, { token }).catch(() => {}); // sin fila no debe quedar un archivo huérfano
    throw error;
  }
  return id;
}

async function ownedAttachment(propertyId: string, attachmentId: string, manager: PropertyManager) {
  await managedProperty(propertyId, manager);
  const [row] = await db.select().from(expenseAttachments)
    .where(and(eq(expenseAttachments.id, attachmentId), eq(expenseAttachments.propertyId, propertyId), managedResource(expenseAttachments.propertyId, manager))).limit(1);
  if (!row) throw new AccessError(404);
  return row;
}

/** Descarga: devuelve el flujo del archivo privado; nunca su URL. */
export async function readAttachment(propertyId: string, attachmentId: string, manager: PropertyManager) {
  const row = await ownedAttachment(propertyId, attachmentId, manager);
  const token = privateBlobToken();
  if (!token) throw new AttachmentError('ATTACHMENTS_DISABLED');
  const blob = await get(row.pathname, { access: 'private', token, useCache: false });
  if (!blob) throw new AccessError(404);
  return { row, stream: blob.stream };
}

export async function deleteAttachment(propertyId: string, attachmentId: string, manager: PropertyManager) {
  const row = await ownedAttachment(propertyId, attachmentId, manager);
  const token = privateBlobToken();
  if (!token) throw new AttachmentError('ATTACHMENTS_DISABLED');
  await del(row.pathname, { token });
  await db.delete(expenseAttachments).where(and(eq(expenseAttachments.id, attachmentId), eq(expenseAttachments.propertyId, propertyId)));
}

/** Antes de borrar un mantenimiento o un pago: borra sus archivos del almacén (las filas caen por cascada). */
export async function deleteTargetFiles(propertyId: string, target: AttachmentTarget, targetId: string) {
  const column = target === 'maintenance' ? expenseAttachments.maintenanceId : expenseAttachments.entryId;
  const rows = await db.select({ pathname: expenseAttachments.pathname }).from(expenseAttachments)
    .where(and(eq(column, targetId), eq(expenseAttachments.propertyId, propertyId)));
  if (!rows.length) return;
  // Sin token no se puede borrar del almacén: se rechaza (503) en vez de borrar el registro y dejar archivos huérfanos.
  const token = privateBlobToken();
  if (!token) throw new AttachmentError('ATTACHMENTS_DISABLED');
  await del(rows.map(row => row.pathname), { token });
}

export async function listAttachments(propertyId: string, manager: PropertyManager) {
  return db.select({ id: expenseAttachments.id, maintenanceId: expenseAttachments.maintenanceId, entryId: expenseAttachments.entryId,
    fileName: expenseAttachments.fileName, contentType: expenseAttachments.contentType, size: expenseAttachments.size })
    .from(expenseAttachments)
    .where(and(eq(expenseAttachments.propertyId, propertyId), managedResource(expenseAttachments.propertyId, manager)))
    .orderBy(expenseAttachments.createdAt);
}
