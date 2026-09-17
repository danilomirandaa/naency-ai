'use client';

import { Button } from '@/components/ui/Button';
import { DialogClose, makeResponsiveDialog } from '@/components/ui/Dialog';
import { Field, Input } from '@/components/ui/Input';
import { Panel } from '@/components/ui/Panel';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import { CategoryStylePicker } from '@/features/categories/components/CategoryStylePicker';
import {
  type CategoryFormState,
  type CategoryFormValues,
  DEFAULT_NEW_CATEGORY_COLOR,
  initialCategoryFormState,
} from '@/features/categories/schemas';
import type { CategorySummary } from '@/features/categories/types';
import { CATEGORY_ICONS, type CategoryIconName, type CategoryKind } from '@/lib/categories';
import * as React from 'react';

export type CategoryFormAction = (
  state: CategoryFormState,
  formData: FormData,
) => Promise<CategoryFormState>;

export type CategoryFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Tipo das categorias da aba atual (fixo na edição). */
  kind: CategoryKind;
  /** Com categoria, edita; sem, cria. */
  category?: CategorySummary | null;
  /** Pai sugerido ao criar uma subcategoria. */
  defaultParentId?: string | null;
  /** Categorias do espaço, para escolher a principal. */
  categories: CategorySummary[];
  action: CategoryFormAction;
  onSaved?: (categoryId: string) => void;
};

const FORM_ID = 'category-form';
const NO_PARENT = 'none';

export function CategoryFormDialog(props: CategoryFormDialogProps) {
  const [openCount, setOpenCount] = React.useState(0);
  const [wasOpen, setWasOpen] = React.useState(props.open);
  if (props.open !== wasOpen) {
    setWasOpen(props.open);
    if (props.open) {
      setOpenCount((count) => count + 1);
    }
  }
  return <CategoryFormDialogContent key={openCount} {...props} />;
}

function isIconName(value: string): value is CategoryIconName {
  return (CATEGORY_ICONS as readonly string[]).includes(value);
}

function CategoryFormDialogContent({
  open,
  onOpenChange,
  kind,
  category,
  defaultParentId = null,
  categories,
  action,
  onSaved,
}: CategoryFormDialogProps) {
  const [state, formAction, isPending] = React.useActionState(action, initialCategoryFormState);
  const isEdit = Boolean(category);

  const [formKey, setFormKey] = React.useState(0);
  const [lastState, setLastState] = React.useState(state);
  if (state !== lastState) {
    setLastState(state);
    setFormKey((key) => key + 1);
  }

  React.useEffect(() => {
    if (state.status === 'saved') {
      onSaved?.(state.categoryId);
      onOpenChange(false);
    }
    // Só reage à mudança de estado da action.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const error = state.status === 'error' ? state : null;
  const values: CategoryFormValues = error?.values ?? {
    name: category?.name ?? '',
    kind: category?.kind ?? kind,
    parentId: category ? (category.parentId ?? '') : (defaultParentId ?? ''),
    icon: category?.icon ?? 'category-other',
    color: category?.color ?? DEFAULT_NEW_CATEGORY_COLOR,
  };
  const hasChildren = Boolean(category && categories.some((item) => item.parentId === category.id));
  const parents = categories.filter(
    (item) =>
      item.kind === (category?.kind ?? kind) &&
      item.parentId === null &&
      !item.archived &&
      item.id !== category?.id,
  );

  return makeResponsiveDialog({
    title: isEdit ? 'Editar categoria' : kind === 'income' ? 'Nova categoria de receita' : 'Nova categoria de despesa',
    open,
    onOpenChange,
    contentProps: { className: 'max-w-[520px]' },
    children: (
      <CategoryFormFields
        key={formKey}
        formAction={formAction}
        values={values}
        fieldErrors={error?.fieldErrors ?? {}}
        message={error?.message}
        parents={parents}
        parentLocked={hasChildren}
      />
    ),
    footer: (
      <>
        <DialogClose asChild>
          <Button variant="outline">Cancelar</Button>
        </DialogClose>
        <Button type="submit" form={FORM_ID} disabled={isPending}>
          {isPending && <Spinner label={null} data-icon="inline-start" />}
          {isPending ? 'Salvando…' : isEdit ? 'Salvar alterações' : 'Criar categoria'}
        </Button>
      </>
    ),
  });
}

function CategoryFormFields({
  formAction,
  values,
  fieldErrors,
  message,
  parents,
  parentLocked,
}: {
  formAction: (formData: FormData) => void;
  values: CategoryFormValues;
  fieldErrors: Partial<Record<keyof CategoryFormValues, string>>;
  message?: string;
  parents: CategorySummary[];
  parentLocked: boolean;
}) {
  const [icon, setIcon] = React.useState<CategoryIconName>(
    isIconName(values.icon) ? values.icon : 'category-other',
  );
  const [color, setColor] = React.useState(values.color || DEFAULT_NEW_CATEGORY_COLOR);
  const [parentId, setParentId] = React.useState(values.parentId);

  return (
    <form id={FORM_ID} action={formAction} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="kind" value={values.kind} />
      <Field label="Nome" error={fieldErrors.name}>
        {(control) => (
          <Input
            {...control}
            name="name"
            autoComplete="off"
            placeholder="Ex.: Academia"
            defaultValue={values.name}
            maxLength={40}
          />
        )}
      </Field>
      <Field
        label="Dentro de"
        error={fieldErrors.parentId}
        description={parentLocked ? 'Tem subcategorias, então continua como principal.' : undefined}
      >
        {(control) => (
          <>
            <Select.Root
              value={parentId || NO_PARENT}
              onValueChange={(next) => setParentId(next === NO_PARENT ? '' : next)}
              disabled={parentLocked}
            >
              <Select.Trigger {...control}>
                <Select.Value />
              </Select.Trigger>
              <Select.Content>
                <Select.Item value={NO_PARENT}>Nenhuma (categoria principal)</Select.Item>
                {parents.map((parent) => (
                  <Select.Item key={parent.id} value={parent.id}>
                    {parent.name}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
            <input type="hidden" name="parentId" value={parentId} />
          </>
        )}
      </Field>
      <CategoryStylePicker icon={icon} color={color} onIconChange={setIcon} onColorChange={setColor} />
      {message && (
        <Panel.Callout variant="critical" icon="alert-circle" role="alert" className="mt-0">
          {message}
        </Panel.Callout>
      )}
    </form>
  );
}
