import { ForbiddenError, UnauthenticatedError } from '@/server/auth/errors';
import { describe, expect, it } from 'vitest';
import { errorResponse } from './errors';

describe('errorResponse', () => {
  it('sem sessão → 401', async () => {
    const response = errorResponse(new UnauthenticatedError());
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: 'unauthenticated' });
  });

  it('sem permissão → 403', () => {
    expect(errorResponse(new ForbiddenError()).status).toBe(403);
  });

  it('erro inesperado é relançado (vira 500 sem expor a mensagem)', () => {
    const error = new Error('detalhe interno');
    expect(() => errorResponse(error)).toThrow(error);
  });
});
