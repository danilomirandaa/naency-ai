import { monthRange } from '@/lib/dates';
import { type DateRange, rangeParams, resolveRange } from '@/lib/periods';
import type { TransactionKind, TransactionSituation } from '@/lib/transactions';
import { z } from 'zod';

export type TransactionFilters = DateRange & {
  accountId: string | null;
  categoryId: string | null;
  kind: TransactionKind | null;
  search: string;
  page: number;
  /** Atrasadas ignoram o período: tudo que venceu e não foi pago. */
  situation?: TransactionSituation | null;
  /** Sem ordem, mais recentes primeiro. */
  sort?: TransactionSort | null;
  /** Só na página do cartão. */
  invoiceId?: string | null;
};

export const TRANSACTION_SORT_KEYS = ['date', 'amount', 'description', 'account', 'category', 'paidAt'] as const;
export type TransactionSortKey = (typeof TRANSACTION_SORT_KEYS)[number];
export type TransactionSort = { key: TransactionSortKey; dir: 'asc' | 'desc' };

const SITUATION_PARAM: Record<TransactionSituation, string> = {
  overdue: 'atrasadas',
  pending: 'pendentes',
  paid: 'pagas',
};

const SORT_PARAM: Record<TransactionSortKey, string> = {
  date: 'data',
  amount: 'valor',
  description: 'descricao',
  account: 'conta',
  category: 'categoria',
  paidAt: 'pago-em',
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
  const situationParam = params.get('situacao');
  const sortParam = params.get('ordem');
  const sortKey = (Object.entries(SORT_PARAM).find(([, value]) => value === sortParam)?.[0] ?? null) as
    | TransactionSortKey
    | null;
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
    situation:
      (Object.entries(SITUATION_PARAM).find(([, value]) => value === situationParam)?.[0] as
        | TransactionSituation
        | undefined) ?? null,
    sort: sortKey ? { key: sortKey, dir: params.get('direcao') === 'asc' ? 'asc' : 'desc' } : null,
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
  if (filters.situation) {
    params.set('situacao', SITUATION_PARAM[filters.situation]);
  }
  if (filters.sort) {
    params.set('ordem', SORT_PARAM[filters.sort.key]);
    params.set('direcao', filters.sort.dir);
  }
  if (filters.invoiceId) {
    params.set('fatura', filters.invoiceId);
  }
  if (filters.page > 1) {
    params.set('pagina', String(filters.page));
  }
  return params;
}
