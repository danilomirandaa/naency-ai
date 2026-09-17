'use client';

import { CategoryIcon } from '@/components/finance/CategoryIcon';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/Command';
import { Icon } from '@/components/ui/Icon';
import { type FieldControlProps, inputControlClassName } from '@/components/ui/Input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import {
  CATEGORY_KINDS,
  CATEGORY_KIND_LABELS,
  type CategoryIconName,
  type CategoryKind,
  buildCategoryTree,
} from '@/lib/categories';
import { normalizeDescription } from '@/lib/transactions';
import { classMerge } from '@/lib/utils';
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
  'aria-label'?: string;
};

/** Busca sem acento pelo nome (o id no `value` só diferencia nomes repetidos). */
export function filterCategories(value: string, search: string, keywords: string[] = []) {
  const term = normalizeDescription(search);
  if (!term) {
    return 1;
  }
  const name = normalizeDescription(value.slice(value.indexOf('|') + 1));
  if (name.includes(term)) {
    return name.startsWith(term) ? 1 : 0.8;
  }
  return keywords.some((keyword) => normalizeDescription(keyword).includes(term)) ? 0.5 : 0;
}

/**
 * Escolha de categoria com busca (combobox do shadcn: Popover + Command). As
 * subcategorias aparecem sob a principal; buscar pelo nome da principal mostra
 * as subcategorias dela.
 */
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
  defaultOpen = false,
  id,
  'aria-describedby': describedBy,
  'aria-invalid': invalid,
  'aria-label': ariaLabel,
}: CategorySelectProps) {
  const [open, setOpen] = React.useState(defaultOpen);
  const isControlled = value !== undefined;
  const [internal, setInternal] = React.useState<string | null>(defaultValue);
  const selectedId = isControlled ? value : internal;
  const kinds = kind ? [kind] : CATEGORY_KINDS;
  const available = categories.filter((category) => kind === null || category.kind === kind);
  const selected = available.find((category) => category.id === selectedId) ?? null;
  const parent = selected?.parentId ? categories.find((category) => category.id === selected.parentId) : null;

  const choose = (next: string | null) => {
    if (!isControlled) {
      setInternal(next);
    }
    onValueChange?.(next);
    setOpen(false);
  };

  const listboxId = React.useId();

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild disabled={disabled}>
          <button
            type="button"
            id={id}
            role="combobox"
            aria-expanded={open}
            aria-controls={open ? listboxId : undefined}
            aria-describedby={describedBy}
            aria-invalid={invalid}
            aria-label={ariaLabel}
            data-placeholder={selected ? undefined : ''}
            className={classMerge(
              inputControlClassName,
              'flex items-center gap-2 text-left data-[placeholder]:text-typography-neutral-secondary',
            )}
          >
            {selected ? (
              <>
                <CategoryIcon icon={selected.icon} color={selected.color} size="sm" />
                <span className="flex-1 truncate">
                  {parent ? `${parent.name} › ${selected.name}` : selected.name}
                </span>
              </>
            ) : (
              <span className="flex-1 truncate">{noneLabel ?? placeholder}</span>
            )}
            <Icon icon="chevron-down" className="size-4 text-icon-neutral-rest" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" aria-label="Categorias" className="w-(--radix-popover-trigger-width) min-w-64 p-0">
          <Command filter={filterCategories}>
            <CommandInput placeholder="Buscar categoria…" aria-label="Buscar categoria" />
            <CommandList id={listboxId}>
              <CommandEmpty>Nenhuma categoria encontrada.</CommandEmpty>
              {noneLabel !== null && (
                <CommandGroup>
                  <CommandItem value={`__none__|${noneLabel}`} checked={selectedId === null} onSelect={() => choose(null)}>
                    {noneLabel}
                  </CommandItem>
                </CommandGroup>
              )}
              {kinds.map((groupKind) => (
                <CommandGroup key={groupKind} heading={kind === null ? CATEGORY_KIND_LABELS[groupKind] : undefined}>
                  {buildCategoryTree(available.filter((category) => category.kind === groupKind)).flatMap((root) => [
                    <CommandItem
                      key={root.id}
                      value={`${root.id}|${root.name}`}
                      keywords={root.children.map((child) => child.name)}
                      checked={selectedId === root.id}
                      onSelect={() => choose(root.id)}
                    >
                      <CategoryIcon icon={root.icon} color={root.color} size="sm" />
                      <span className="truncate">{root.name}</span>
                    </CommandItem>,
                    ...root.children.map((child) => (
                      <CommandItem
                        key={child.id}
                        value={`${child.id}|${child.name}`}
                        keywords={[root.name]}
                        checked={selectedId === child.id}
                        onSelect={() => choose(child.id)}
                        className="pl-9"
                      >
                        <span className="truncate">{child.name}</span>
                      </CommandItem>
                    )),
                  ])}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {name && <input type="hidden" name={name} value={selected ? selected.id : ''} />}
    </>
  );
}
