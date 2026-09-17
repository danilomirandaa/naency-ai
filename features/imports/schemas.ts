import { z } from 'zod';

/** 2 MB de texto: extratos de anos cabem com folga. */
export const MAX_STATEMENT_CHARS = 2_000_000;

export const createImportSchema = z.object({
  accountId: z.uuid({ error: 'Escolha a conta do extrato.' }),
  fileName: z.string().trim().min(1, 'Escolha um arquivo.').max(200),
  text: z.string().min(1, 'O arquivo está vazio.').max(MAX_STATEMENT_CHARS, 'Arquivo grande demais (máximo 2 MB).'),
});

export type CreateImportInput = z.infer<typeof createImportSchema>;

export const updateImportRowSchema = z
  .object({
    categoryId: z.uuid().nullable(),
    include: z.boolean(),
    rememberCategory: z.boolean(),
    description: z.string().trim().min(1).max(120),
  })
  .partial();

export type UpdateImportRowInput = z.infer<typeof updateImportRowSchema>;
