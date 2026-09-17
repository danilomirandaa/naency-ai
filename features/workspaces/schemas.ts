import { z } from 'zod';

export const workspaceNameSchema = z
  .string({ error: 'Dê um nome ao espaço.' })
  .trim()
  .min(2, 'Use pelo menos 2 caracteres.')
  .max(60, 'Use no máximo 60 caracteres.');

export const createWorkspaceSchema = z.object({ name: workspaceNameSchema });

export type CreateWorkspaceState =
  | { status: 'idle' }
  | { status: 'error'; message: string; name?: string };

export const initialCreateWorkspaceState: CreateWorkspaceState = { status: 'idle' };
