import 'server-only';
// T-4783: tokens de un solo uso para confirmar el correo y para «olvidé mi contraseña».
// El enlace lleva el token (32 bytes al azar, hex); la base guarda solo su SHA-256. Pedir uno nuevo
// invalida los anteriores del mismo usuario. Consumir es un solo UPDATE condicionado (sin carreras).
import { createHash, randomBytes, randomUUID } from 'crypto';
import { and, eq, gt, isNull } from 'drizzle-orm';
import { db, emailVerificationTokens, passwordResetTokens } from '@portal/db';

export const VERIFY_TTL_MS = 24 * 60 * 60 * 1000;
export const RESET_TTL_MS = 60 * 60 * 1000;

export const verifyTokens = { table: emailVerificationTokens, hash: emailVerificationTokens.tokenHash, hashKey: 'tokenHash' } as const;
export const resetTokens = { table: passwordResetTokens, hash: passwordResetTokens.token, hashKey: 'token' } as const;
type Tokens = typeof verifyTokens | typeof resetTokens;
// Las dos tablas tienen las mismas columnas salvo el nombre del hash: se tipan como una.
const tableOf = (tokens: Tokens) => tokens.table as typeof emailVerificationTokens;

export type TokenStatus = 'valid' | 'used' | 'expired' | 'invalid';

export function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export function newToken() {
  const token = randomBytes(32).toString('hex');
  return { token, tokenHash: hashToken(token) };
}

/** Estado de una fila de token (lógica pura). Vence justo a la hora de `expiresAt`. */
export function tokenStatus(row: { usedAt: Date | string | null; expiresAt: Date | string } | undefined, now = new Date()): TokenStatus {
  if (!row) return 'invalid';
  if (row.usedAt) return 'used';
  return new Date(row.expiresAt).getTime() > now.getTime() ? 'valid' : 'expired';
}

/** Invalida los tokens vivos del usuario y guarda uno nuevo. Devuelve el token para el enlace. */
export async function issueToken(tokens: Tokens, userId: string, ttlMs: number) {
  const table = tableOf(tokens);
  const now = new Date();
  await db.update(table).set({ usedAt: now }).where(and(eq(table.userId, userId), isNull(table.usedAt)));
  const { token, tokenHash } = newToken();
  await db.insert(table).values({
    id: randomUUID(), userId, [tokens.hashKey]: tokenHash, expiresAt: new Date(now.getTime() + ttlMs), usedAt: null, createdAt: now,
  } as typeof emailVerificationTokens.$inferInsert);
  return token;
}

/** ¿El token sirve todavía? Solo lectura (para mostrar el formulario antes de usarlo). */
export async function peekToken(tokens: Tokens, token: string): Promise<TokenStatus> {
  if (!token) return 'invalid';
  const table = tableOf(tokens);
  const [row] = await db.select({ usedAt: table.usedAt, expiresAt: table.expiresAt }).from(table)
    .where(eq(tokens.hash, hashToken(token))).limit(1);
  return tokenStatus(row);
}

/** Marca el token como usado si sigue vivo y devuelve su usuario; si no, por qué no sirve. */
export async function consumeToken(tokens: Tokens, token: string): Promise<{ status: 'valid'; userId: string } | { status: Exclude<TokenStatus, 'valid'> }> {
  if (!token) return { status: 'invalid' };
  const table = tableOf(tokens);
  const now = new Date();
  const [hit] = await db.update(table).set({ usedAt: now })
    .where(and(eq(tokens.hash, hashToken(token)), isNull(table.usedAt), gt(table.expiresAt, now)))
    .returning({ userId: table.userId });
  if (hit) return { status: 'valid', userId: hit.userId };
  const status = await peekToken(tokens, token);
  return { status: status === 'valid' ? 'used' : status }; // 'valid' aquí = carrera perdida: otro lo usó
}
