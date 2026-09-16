/** Sem sessão válida. */
export class UnauthenticatedError extends Error {
  constructor() {
    super('Sessão ausente ou expirada.');
    this.name = 'UnauthenticatedError';
  }
}

/** Com sessão, mas sem permissão (ou o recurso não pertence ao usuário). */
export class ForbiddenError extends Error {
  constructor(message = 'Sem permissão para esta ação.') {
    super(message);
    this.name = 'ForbiddenError';
  }
}
