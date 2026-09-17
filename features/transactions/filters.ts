import { monthRange } from '@/lib/dates';
import { type DateRange, rangeParams, resolveRange } from '@/lib/periods';
import type { TransactionKind } from '@/lib/transactions';
import { z } from 'zod';

export type TransactionFilters = DateRange & {
  accountId: string | null;
  categoryId: string | null;
  kind: TransactionKind | null;
  search: string;
  page: number;
  /** Só na página do cartão. */
  invoiceId?: string | null;
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

/** Filtros de um mês inteiro. */
export function monthFilters(month: string, overrides: Partial<TransactionFilters> = {}): TransactionFilters {
  return { ...monthRange(month), accountId: null, categoryId: null, kind: null, search: '', page: 1, ...overrides };
}

/** Lê filtros da URL; valor inválido vira o padrão, nunca erro. */
export function filtersFromSearchParams(
  params: ParamsLike,
  {
    now = new Date(),
    kind = null,
    periodCookie = null,
  }: { now?: Date; kind?: TransactionKind | null; periodCookie?: string | null } = {},
): TransactionFilters {

  const accountId = params.get('conta');
  const categoryId = params.get('categoria');
  const kindParam = params.get('tipo');
  const page = Number(params.get('pagina'));
  const invoiceId = params.get('fatura');
  const parsedKind =
    (Object.entries(KIND_PARAM).find(([, value]) => value === kindParam)?.[0] as TransactionKind | undefined) ??
    null;

  return {
    // Período global: URL (?de=&ate= ou ?mes=) → cookie do header → mês atual.
    ...resolveRange(params, periodCookie, now),
    accountId: accountId && uuid.safeParse(accountId).success ? accountId : null,
    categoryId: categoryId && uuid.safeParse(categoryId).success ? categoryId : null,
    kind: kind ?? parsedKind,
    search: (params.get('busca') ?? '').trim().slice(0, 80),
    page: Number.isSafeInteger(page) && page >= 1 ? page : 1,
    invoiceId: invoiceId && uuid.safeParse(invoiceId).success ? invoiceId : null,
  };
}

/** Só grava na URL o que foge do padrão, para links curtos. */
export function filtersToSearchParams(
  filters: TransactionFilters,
  { omitKind = false }: { omitKind?: boolean } = {},
) {
  const params = new URLSearchParams();
  // Período sempre explícito: sem ele, a página cairia no cookie, que pode ser outro.
  for (const [key, value] of Object.entries(rangeParams(filters))) {
    params.set(key, value);
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
  if (filters.invoiceId) {
    params.set('fatura', filters.invoiceId);
  }
  if (filters.page > 1) {
    params.set('pagina', String(filters.page));
  }
  return params;
}
