import { currentMonth, isMonth } from '@/lib/dates';
import type { TransactionKind } from '@/lib/transactions';
import { z } from 'zod';

export type TransactionFilters = {
  /** "AAAA-MM" */
  month: string;
  accountId: string | null;
  categoryId: string | null;
  kind: TransactionKind | null;
  search: string;
  page: number;
};

export const TRANSACTIONS_PAGE_SIZE = 50;

/** Nomes na URL (pt-BR) e valores do tipo. */
const KIND_PARAM: Record<TransactionKind, string> = {
  income: 'receitas',
  expense: 'despesas',
  transfer: 'transferencias',
};

const uuid = z.uuid();

type ParamsLike = { get(name: string): string | null };

/** Lê filtros da URL; valor inválido vira o padrão, nunca erro. */
export function filtersFromSearchParams(
  params: ParamsLike,
  { now = new Date(), kind = null }: { now?: Date; kind?: TransactionKind | null } = {},
): TransactionFilters {
  const month = params.get('mes');
  const accountId = params.get('conta');
  const categoryId = params.get('categoria');
  const kindParam = params.get('tipo');
  const page = Number(params.get('pagina'));
  const parsedKind =
    (Object.entries(KIND_PARAM).find(([, value]) => value === kindParam)?.[0] as TransactionKind | undefined) ??
    null;

  return {
    month: isMonth(month) ? month : currentMonth(now),
    accountId: accountId && uuid.safeParse(accountId).success ? accountId : null,
    categoryId: categoryId && uuid.safeParse(categoryId).success ? categoryId : null,
    kind: kind ?? parsedKind,
    search: (params.get('busca') ?? '').trim().slice(0, 80),
    page: Number.isSafeInteger(page) && page >= 1 ? page : 1,
  };
}

/** Só grava na URL o que foge do padrão, para links curtos. */
export function filtersToSearchParams(
  filters: TransactionFilters,
  { now = new Date(), omitKind = false }: { now?: Date; omitKind?: boolean } = {},
) {
  const params = new URLSearchParams();
  if (filters.month !== currentMonth(now)) {
    params.set('mes', filters.month);
  }
  if (filters.accountId) {
    params.set('conta', filters.accountId);
  }
  if (filters.categoryId) {
    params.set('categoria', filters.categoryId);
  }
  if (filters.kind && !omitKind) {
    params.set('tipo', KIND_PARAM[filters.kind]);
  }
  if (filters.search) {
    params.set('busca', filters.search);
  }
  if (filters.page > 1) {
    params.set('pagina', String(filters.page));
  }
  return params;
}
