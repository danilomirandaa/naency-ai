import type { ImportBatchDetail, ImportBatchSummary } from '@/features/imports/types';
import { fetchJson } from '@/lib/api/fetch-json';
import { queryOptions } from '@tanstack/react-query';

/** Contratos de query das importações (docs/architecture.md). */
export const importsQuery = {
  all: (workspaceId: string) => ['workspace', workspaceId, 'imports'] as const,
  list: (workspaceId: string) =>
    queryOptions({
      queryKey: [...importsQuery.all(workspaceId), 'list'] as const,
      queryFn: () => fetchJson<ImportBatchSummary[]>(`/api/workspaces/${workspaceId}/imports`),
    }),
  batch: (workspaceId: string, batchId: string) =>
    queryOptions({
      queryKey: [...importsQuery.all(workspaceId), batchId] as const,
      queryFn: () => fetchJson<ImportBatchDetail>(`/api/workspaces/${workspaceId}/imports/${batchId}`),
    }),
};
