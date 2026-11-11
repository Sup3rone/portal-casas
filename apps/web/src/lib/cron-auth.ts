import 'server-only';
// Autorización de los cron jobs de Vercel: `Authorization: Bearer $CRON_SECRET`, comparación en tiempo constante.
// Falla cerrado: sin CRON_SECRET (o con menos de 16 caracteres) todo se rechaza y queda un aviso en el log.
import { timingSafeEqual } from 'node:crypto';

export function cronAuthorized(header: string | null) {
  const secret = process.env.CRON_SECRET;
  if (!secret) console.error('CRON_SECRET no configurado: los cron jobs no se pueden ejecutar.');
  else if (secret.length < 16) console.error('CRON_SECRET demasiado corto (< 16): el cron se rechaza. Configura uno aleatorio más largo.');
  if (!secret || secret.length < 16 || !header) return false;
  const expected = Buffer.from(`Bearer ${secret}`), received = Buffer.from(header);
  return expected.length === received.length && timingSafeEqual(expected, received);
}
