'use client';

import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Panel } from '@/components/ui/Panel';
import { Tabs } from '@/components/ui/Tabs';
import {
  createCategoryAction,
  setCategoryArchivedAction,
  updateCategoryAction,
} from '@/features/categories/actions';
import { categoriesQuery } from '@/features/categories/api/categories.queries';
import { CategoriesList } from '@/features/categories/components/CategoriesList';
import { CategoryFormDialog } from '@/features/categories/components/CategoryFormDialog';
import type { CategorySummary } from '@/features/categories/types';
import { CATEGORY_KINDS, CATEGORY_KIND_LABELS, type CategoryKind } from '@/lib/categories';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as React from 'react';

export type CategoriesScreenProps = {
  workspaceId: string;
  canEdit: boolean;
};

type DialogState =
  | { mode: 'create'; parentId: string | null }
  | { mode: 'edit'; category: CategorySummary }
  | null;

/** Container: liga query e actions aos componentes, sem markup próprio. */
export function CategoriesScreen({ workspaceId, canEdit }: CategoriesScreenProps) {
  const queryClient = useQueryClient();
  const filters = { includeArchived: true };
  const categories = useQuery(categoriesQuery.options(workspaceId, filters));
  const [kind, setKind] = React.useState<CategoryKind>('expense');
  const [dialog, setDialog] = React.useState<DialogState>(null);
  const [archiveFailed, setArchiveFailed] = React.useState(false);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: categoriesQuery.all(workspaceId) });
  const editing = dialog?.mode === 'edit' ? dialog.category : null;
  const action = React.useMemo(
    () =>
      editing
        ? updateCategoryAction.bind(null, workspaceId, editing.id)
        : createCategoryAction.bind(null, workspaceId),
    [editing, workspaceId],
  );

  const handleArchiveChange = async (category: CategorySummary, archived: boolean) => {
    const { ok } = await setCategoryArchivedAction(workspaceId, category.id, archived);
    setArchiveFailed(!ok);
    await invalidate();
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <PageHeader
        title="Categorias"
        description="Como os lançamentos são organizados nos relatórios."
        actions={
          canEdit ? (
            <Button onClick={() => setDialog({ mode: 'create', parentId: null })}>
              <Icon icon="add" data-icon="inline-start" />
              Nova categoria
            </Button>
          ) : undefined
        }
      />
      {archiveFailed && (
        <Panel.Callout variant="critical" icon="alert-circle" role="alert" className="mt-0">
          Não foi possível alterar a categoria. Atualize a página e tente de novo.
        </Panel.Callout>
      )}
      <Tabs.Root value={kind} onValueChange={(value) => setKind(value as CategoryKind)}>
        <Tabs.List>
          {CATEGORY_KINDS.map((option) => (
            <Tabs.Tab key={option} value={option}>
              {CATEGORY_KIND_LABELS[option]}
            </Tabs.Tab>
          ))}
        </Tabs.List>
        {CATEGORY_KINDS.map((option) => (
          <Tabs.Panel key={option} value={option} className="mt-4 flex flex-col gap-4">
            <CategoriesList
              categories={categories.data ?? []}
              kind={option}
              canEdit={canEdit}
              isLoading={categories.isPending}
              isError={categories.isError}
              onRetry={() => void categories.refetch()}
              onCreate={(parentId) => setDialog({ mode: 'create', parentId })}
              onEdit={(category) => setDialog({ mode: 'edit', category })}
              onArchiveChange={handleArchiveChange}
            />
          </Tabs.Panel>
        ))}
      </Tabs.Root>
      {canEdit && (
        <CategoryFormDialog
          open={dialog !== null}
          onOpenChange={(open) => !open && setDialog(null)}
          kind={editing?.kind ?? kind}
          category={editing}
          defaultParentId={dialog?.mode === 'create' ? dialog.parentId : null}
          categories={categories.data ?? []}
          action={action}
          onSaved={() => void invalidate()}
        />
      )}
    </div>
  );
}
