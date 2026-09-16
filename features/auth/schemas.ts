import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string({ error: 'Informe seu e-mail.' })
    .trim()
    .toLowerCase()
    .pipe(z.email({ error: 'Informe um e-mail válido.' })),
  next: z.string().optional(),
});

export type LoginState =
  | { status: 'idle' }
  | { status: 'sent'; email: string }
  | { status: 'error'; message: string };

export const initialLoginState: LoginState = { status: 'idle' };

/** Erros do callback de login, recebidos em /entrar?erro=<código>. */
export const LOGIN_CALLBACK_ERRORS = {
  'link-expirado': 'Esse link expirou ou já foi usado. Peça um novo.',
  'link-invalido': 'Link de acesso inválido. Peça um novo.',
  falha: 'Não foi possível concluir o acesso. Tente de novo.',
} as const;

export type LoginCallbackError = keyof typeof LOGIN_CALLBACK_ERRORS;

export function getLoginCallbackErrorMessage(code: string | null | undefined) {
  // hasOwn: `in` aceitaria chaves herdadas como "toString".
  return code && Object.hasOwn(LOGIN_CALLBACK_ERRORS, code)
    ? LOGIN_CALLBACK_ERRORS[code as LoginCallbackError]
    : null;
}
