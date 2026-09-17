import type { CategorySummary } from '@/features/categories/types';
import { fetchJson } from '@/lib/api/fetch-json';
import { queryOptions } from '@tanstack/react-query';

export type CategoriesFilters = { includeArchived: boolean };

/** Contrato de query das categorias (docs/architecture.md). */
export const categoriesQuery = {
  all: (workspaceId: string) => ['workspace', workspaceId, 'categories'] as const,
  key: (workspaceId: string, filters: CategoriesFilters) =>
    [...categoriesQuery.all(workspaceId), filters] as const,
  options: (workspaceId: string, filters: CategoriesFilters) =>
    queryOptions({
      queryKey: categoriesQuery.key(workspaceId, filters),
      queryFn: () =>
        fetchJson<CategorySummary[]>(`/api/workspaces/${workspaceId}/categories`, {
          arquivadas: filters.includeArchived,
        }),
    }),
};
