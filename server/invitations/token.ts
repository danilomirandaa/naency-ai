import { createHash, randomBytes } from 'node:crypto';

/** 32 bytes aleatórios: o token vai no link; o banco guarda só o hash. */
export function createInvitationToken() {
  const token = randomBytes(32).toString('base64url');
  return { token, tokenHash: hashInvitationToken(token) };
}

export function hashInvitationToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

/** Formato válido antes de consultar o banco (evita consulta com lixo). */
export function isWellFormedInvitationToken(token: string) {
  return /^[A-Za-z0-9_-]{43}$/.test(token);
}
