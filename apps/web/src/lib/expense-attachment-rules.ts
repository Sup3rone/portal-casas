// T-5248 (fase 2): reglas puras de facturas y recibos (sin BD ni red; también las usa la pantalla para avisar antes
// de subir). El servidor vuelve a validar todo. Mismo tope que las fotos: el archivo pasa por la función de Vercel.
export const attachmentTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'] as const;
export type AttachmentType = typeof attachmentTypes[number];
export const maxAttachmentBytes = 4_000_000;
export const attachmentAccept = attachmentTypes.join(',');
const extensions: Record<AttachmentType, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'application/pdf': 'pdf' };

export class AttachmentError extends Error {
  constructor(public code: 'INVALID_ATTACHMENT_TYPE' | 'INVALID_ATTACHMENT_SIZE' | 'INVALID_ATTACHMENT_REQUEST' | 'ATTACHMENTS_DISABLED') { super(code); }
}

export function attachmentMetadata(type: unknown, size: unknown): { contentType: AttachmentType; size: number } {
  if (!attachmentTypes.includes(type as AttachmentType)) throw new AttachmentError('INVALID_ATTACHMENT_TYPE');
  if (typeof size !== 'number' || !Number.isSafeInteger(size) || size <= 0 || size > maxAttachmentBytes) throw new AttachmentError('INVALID_ATTACHMENT_SIZE');
  return { contentType: type as AttachmentType, size };
}

/** Ruta en el almacén privado: nunca el nombre original (puede traer datos o caracteres raros). */
export function attachmentPath(propertyId: string, uuid: string, type: AttachmentType) {
  return `expenses/${encodeURIComponent(propertyId).replace(/\./g, '%2E')}/${uuid}.${extensions[type]}`;
}

/** Nombre para mostrar y para la descarga: sin rutas ni caracteres de control, máximo 120, con la extensión real. */
export function safeFileName(name: unknown, type: AttachmentType) {
  const base = (typeof name === 'string' ? name : '').split(/[\\/]/).pop()!
    .replace(/[\u0000-\u001f\u007f"<>:|?*]/g, '').replace(/\s+/g, ' ').trim().replace(/\.[A-Za-z0-9]{1,5}$/, '');
  return `${(base || 'archivo').slice(0, 110)}.${extensions[type]}`;
}

/** Content-Disposition seguro (ASCII + filename* UTF-8). Las imágenes y PDF se abren en el navegador. */
export function contentDisposition(fileName: string) {
  const ascii = fileName.normalize('NFD').replace(/[^\x20-\x7e]/g, '').replace(/["\\]/g, '') || 'archivo';
  return `inline; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}
