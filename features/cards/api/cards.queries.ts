import type { CardSummary, InvoiceSummary } from '@/features/cards/types';
import { fetchJson } from '@/lib/api/fetch-json';
import { queryOptions } from '@tanstack/react-query';

/** Contratos de query de cartões e faturas (docs/architecture.md). */
export const cardsQuery = {
  all: (workspaceId: string) => ['workspace', workspaceId, 'cards'] as const,
  list: (workspaceId: string) =>
    queryOptions({
      queryKey: [...cardsQuery.all(workspaceId), 'list'] as const,
      queryFn: () => fetchJson<CardSummary[]>(`/api/workspaces/${workspaceId}/cards`),
    }),
  invoices: (workspaceId: string, cardId: string) =>
    queryOptions({
      queryKey: [...cardsQuery.all(workspaceId), cardId, 'invoices'] as const,
      queryFn: () => fetchJson<InvoiceSummary[]>(`/api/workspaces/${workspaceId}/cards/${cardId}/invoices`),
    }),
};
