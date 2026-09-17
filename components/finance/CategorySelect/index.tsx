'use client';

import { CategoryIcon } from '@/components/finance/CategoryIcon';
import type { FieldControlProps } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import {
  CATEGORY_KINDS,
  CATEGORY_KIND_LABELS,
  type CategoryIconName,
  type CategoryKind,
  buildCategoryTree,
} from '@/lib/categories';
import * as React from 'react';

export type CategoryOption = {
  id: string;
  parentId: string | null;
  name: string;
  kind: CategoryKind;
  icon: CategoryIconName;
  color: string;
};

export type CategorySelectProps = Partial<FieldControlProps> & {
  categories: CategoryOption[];
  /** Só as categorias deste tipo; `null` mostra os dois, separados por tipo. */
  kind: CategoryKind | null;
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (categoryId: string | null) => void;
  /** Com `name`, envia o id (ou "" sem categoria) no formulário. */
  name?: string;
  placeholder?: string;
  /** Texto da opção "sem categoria"; `null` esconde a opção. */
  noneLabel?: string | null;
  disabled?: boolean;
  /** Abre a lista ao montar (stories). */
  defaultOpen?: boolean;
};

const NONE = 'none';

/** Escolha de categoria com subcategorias agrupadas sob a principal. */
export function CategorySelect({
  categories,
  kind,
  value,
  defaultValue = null,
  onValueChange,
  name,
  placeholder = 'Escolha a categoria',
  noneLabel = 'Sem categoria',
  disabled,
  defaultOpen,
  ...control
}: CategorySelectProps) {
  const isControlled = value !== undefined;
  const [internal, setInternal] = React.useState<string | null>(defaultValue);
  const selected = isControlled ? value : internal;
  const kinds = kind ? [kind] : CATEGORY_KINDS;

  const handleChange = (next: string) => {
    const id = next === NONE ? null : next;
    if (!isControlled) {
      setInternal(id);
    }
    onValueChange?.(id);
  };

  // Valor que não está na lista (ex.: categoria arquivada) mostra o placeholder.
  const known =
    selected !== null &&
    categories.some((category) => category.id === selected && (kind === null || category.kind === kind));

  return (
    <>
      <Select.Root
        // "" mostra o placeholder; sem categoria aparece como a opção "Sem categoria".
        value={known ? (selected as string) : noneLabel !== null ? NONE : ''}
        onValueChange={handleChange}
        disabled={disabled}
        defaultOpen={defaultOpen}
      >
        <Select.Trigger {...control}>
          <Select.Value placeholder={placeholder} />
        </Select.Trigger>
        <Select.Content className="max-h-80">
          {noneLabel !== null && <Select.Item value={NONE}>{noneLabel}</Select.Item>}
          {kinds.map((groupKind) => {
            const tree = buildCategoryTree(categories.filter((category) => category.kind === groupKind));
            return (
              <Select.Group key={groupKind}>
                {kind === null && <Select.Label>{CATEGORY_KIND_LABELS[groupKind]}</Select.Label>}
                {tree.flatMap((root) => [
                  <Select.Item key={root.id} value={root.id}>
                    <CategoryIcon icon={root.icon} color={root.color} size="sm" />
                    {root.name}
                  </Select.Item>,
                  ...root.children.map((child) => (
                    <Select.Item key={child.id} value={child.id} className="pl-9">
                      {child.name}
                    </Select.Item>
                  )),
                ])}
              </Select.Group>
            );
          })}
        </Select.Content>
      </Select.Root>
      {name && <input type="hidden" name={name} value={known ? (selected as string) : ''} />}
    </>
  );
}
