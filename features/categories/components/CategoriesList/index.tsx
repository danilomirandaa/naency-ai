'use client';

import { CategoryIcon } from '@/components/finance/CategoryIcon';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { List } from '@/components/ui/List';
import { Panel } from '@/components/ui/Panel';
import { Spinner } from '@/components/ui/Spinner';
import { Text } from '@/components/ui/Text';
import type { CategorySummary } from '@/features/categories/types';
import { type CategoryKind, buildCategoryTree } from '@/lib/categories';
import { classMerge } from '@/lib/utils';
import { useTransition } from 'react';

export type CategoriesListProps = {
  /** Categorias de um tipo, incluindo arquivadas. */
  categories: CategorySummary[];
  kind: CategoryKind;
  canEdit: boolean;
  onCreate: (parentId: string | null) => void;
  onEdit: (category: CategorySummary) => void;
  onArchiveChange: (category: CategorySummary, archived: boolean) => Promise<void>;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
};

function ArchiveButton({
  category,
  onArchiveChange,
}: Pick<CategoriesListProps, 'onArchiveChange'> & { category: CategorySummary }) {
  const [isPending, startTransition] = useTransition();
  const archive = !category.archived;
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      disabled={isPending}
      aria-label={`${archive ? 'Arquivar' : 'Desarquivar'} ${category.name}`}
      onClick={() => startTransition(() => onArchiveChange(category, archive))}
    >
      {isPending ? <Spinner label={null} /> : <Icon icon={archive ? 'archive' : 'unarchive'} />}
    </Button>
  );
}

function CategoryRow({
  category,
  isChild,
  subcategoryCount,
  canEdit,
  onCreate,
  onEdit,
  onArchiveChange,
}: Pick<CategoriesListProps, 'canEdit' | 'onCreate' | 'onEdit' | 'onArchiveChange'> & {
  category: CategorySummary;
  isChild: boolean;
  subcategoryCount?: number;
}) {
  return (
    <List.Item className={classMerge(isChild && 'py-2 pl-14')}>
      <CategoryIcon icon={category.icon} color={category.color} size={isChild ? 'sm' : 'md'} />
      <List.ItemText>
        <Text size="sm" weight={isChild ? 'normal' : 'medium'} className="truncate">
          {category.name}
        </Text>
        {!isChild && subcategoryCount !== undefined && subcategoryCount > 0 && (
          <Text size="xs" color="secondary">
            {subcategoryCount === 1 ? '1 subcategoria' : `${subcategoryCount} subcategorias`}
          </Text>
        )}
      </List.ItemText>
      {canEdit && (
        <div className="flex items-center gap-1">
          {!isChild && !category.archived && (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Nova subcategoria em ${category.name}`}
              onClick={() => onCreate(category.id)}
            >
              <Icon icon="add" />
            </Button>
          )}
          {!category.archived && (
            <Button variant="ghost" size="icon-sm" aria-label={`Editar ${category.name}`} onClick={() => onEdit(category)}>
              <Icon icon="edit" />
            </Button>
          )}
          <ArchiveButton category={category} onArchiveChange={onArchiveChange} />
        </div>
      )}
    </List.Item>
  );
}

/** Categorias de um tipo em árvore (principal → subcategorias), arquivadas à parte. */
export function CategoriesList({
  categories,
  kind,
  canEdit,
  onCreate,
  onEdit,
  onArchiveChange,
  isLoading = false,
  isError = false,
  onRetry,
}: CategoriesListProps) {
  const ofKind = categories.filter((category) => category.kind === kind);
  const tree = buildCategoryTree(ofKind.filter((category) => !category.archived));
  const archived = ofKind.filter((category) => category.archived);
  const rowProps = { canEdit, onCreate, onEdit, onArchiveChange };
  const label = kind === 'income' ? 'Categorias de receita' : 'Categorias de despesa';

  return (
    <>
      <Panel.Root>
        <Panel.Body>
          <Panel.QueryState
            isLoading={isLoading}
            isError={isError}
            isEmpty={tree.length === 0}
            skeleton={
              <div className="flex w-full flex-col">
                <Panel.RowSkeleton />
                <Panel.RowSkeleton />
                <Panel.RowSkeleton />
              </div>
            }
            errorMessage="Não foi possível carregar as categorias"
            errorAction={
              onRetry && (
                <Button variant="outline" onClick={onRetry}>
                  Tentar de novo
                </Button>
              )
            }
            emptyIcon="category"
            emptyMessage="Nenhuma categoria ativa"
            emptyDescription={canEdit ? 'Crie categorias para organizar os lançamentos.' : undefined}
            emptyAction={
              canEdit && (
                <Button onClick={() => onCreate(null)}>
                  <Icon icon="add" data-icon="inline-start" />
                  Nova categoria
                </Button>
              )
            }
          >
            <List.Root aria-label={label}>
              {tree.flatMap((root) => [
                <CategoryRow
                  key={root.id}
                  category={root}
                  isChild={false}
                  subcategoryCount={root.children.length}
                  {...rowProps}
                />,
                ...root.children.map((child) => (
                  <CategoryRow key={child.id} category={child} isChild {...rowProps} />
                )),
              ])}
            </List.Root>
          </Panel.QueryState>
        </Panel.Body>
      </Panel.Root>

      {!isLoading && !isError && archived.length > 0 && (
        <Panel.Root>
          <Panel.Header>
            <Panel.HeaderText>
              <Panel.Title>Arquivadas</Panel.Title>
              <Panel.Description>Não aparecem em lançamentos novos; os antigos continuam classificados.</Panel.Description>
            </Panel.HeaderText>
          </Panel.Header>
          <Panel.Body>
            <List.Root aria-label={`${label} arquivadas`}>
              {archived.map((category) => (
                <CategoryRow key={category.id} category={category} isChild={false} {...rowProps} />
              ))}
            </List.Root>
          </Panel.Body>
        </Panel.Root>
      )}
    </>
  );
}
