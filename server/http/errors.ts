import { ForbiddenError, UnauthenticatedError } from '@/server/auth/errors';

/** Converte erros do DAL em resposta de Route Handler, sem vazar detalhes internos. */
export function errorResponse(error: unknown) {
  if (error instanceof UnauthenticatedError) {
    return Response.json({ error: 'unauthenticated' }, { status: 401 });
  }
  if (error instanceof ForbiddenError) {
    return Response.json({ error: 'forbidden' }, { status: 403 });
  }
  throw error;
}
