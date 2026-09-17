import { CATEGORY_COLORS, CATEGORY_ICONS, CATEGORY_KINDS } from '@/lib/categories';
import { isHexColor } from '@/lib/color';
import { z } from 'zod';

export const categoryInputSchema = z.object({
  name: z
    .string({ error: 'Dê um nome à categoria.' })
    .trim()
    .min(1, 'Dê um nome à categoria.')
    .max(40, 'Use no máximo 40 caracteres.'),
  kind: z.enum(CATEGORY_KINDS, { error: 'Escolha receita ou despesa.' }),
  parentId: z.preprocess(
    (value) => (value === '' || value === undefined ? null : value),
    z.uuid({ error: 'Categoria principal inválida.' }).nullable(),
  ),
  icon: z.enum(CATEGORY_ICONS, { error: 'Escolha um ícone.' }),
  color: z
    .string({ error: 'Escolha uma cor.' })
    .refine((value) => isHexColor(value), 'Escolha uma cor.')
    .transform((value) => value.toUpperCase()),
});

export type CategoryInput = z.infer<typeof categoryInputSchema>;

export type CategoryFormValues = {
  name: string;
  kind: string;
  parentId: string;
  icon: string;
  color: string;
};

export type CategoryFormState =
  | { status: 'idle' }
  | { status: 'saved'; categoryId: string }
  | {
      status: 'error';
      message: string;
      fieldErrors: Partial<Record<keyof CategoryInput, string>>;
      values: CategoryFormValues;
    };

export const initialCategoryFormState: CategoryFormState = { status: 'idle' };

export const DEFAULT_NEW_CATEGORY_COLOR = CATEGORY_COLORS[0];

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' ? value : '';
}

export function readCategoryForm(formData: FormData): CategoryFormValues {
  return {
    name: text(formData, 'name'),
    kind: text(formData, 'kind'),
    parentId: text(formData, 'parentId'),
    icon: text(formData, 'icon'),
    color: text(formData, 'color'),
  };
}

export function parseCategoryForm(
  formData: FormData,
): { success: true; data: CategoryInput } | Extract<CategoryFormState, { status: 'error' }> {
  const values = readCategoryForm(formData);
  const parsed = categoryInputSchema.safeParse({
    name: formData.get('name') ?? undefined,
    kind: formData.get('kind') ?? undefined,
    parentId: formData.get('parentId') ?? undefined,
    icon: formData.get('icon') ?? undefined,
    color: formData.get('color') ?? undefined,
  });
  if (parsed.success) {
    return { success: true, data: parsed.data };
  }
  const fieldErrors: Partial<Record<keyof CategoryInput, string>> = {};
  for (const issue of parsed.error.issues) {
    const field = issue.path[0] as keyof CategoryInput;
    fieldErrors[field] ??= issue.message;
  }
  return { status: 'error', message: 'Revise os campos destacados.', fieldErrors, values };
}
