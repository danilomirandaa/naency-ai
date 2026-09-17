import { z } from 'zod';

/** Papéis que podem ser convidados (administrador só quem cria o espaço, por ora). */
export const INVITABLE_ROLES = ['editor', 'viewer'] as const;

export const inviteMemberSchema = z.object({
  email: z
    .string({ error: 'Informe o e-mail da pessoa.' })
    .trim()
    .toLowerCase()
    .pipe(z.email({ error: 'Informe um e-mail válido.' })),
  role: z.enum(INVITABLE_ROLES, { error: 'Escolha o papel da pessoa.' }),
});

export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;

export type InviteMemberState =
  | { status: 'idle' }
  | { status: 'created'; email: string; link: string }
  | { status: 'error'; message: string; email?: string; role?: string };

export const initialInviteMemberState: InviteMemberState = { status: 'idle' };

export type AcceptInvitationState = { status: 'idle' } | { status: 'error'; message: string };
