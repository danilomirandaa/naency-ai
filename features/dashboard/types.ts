import type { AccountType } from '@/lib/accounts';
import type { CategoryIconName } from '@/lib/categories';

export type MonthTotals = { incomeCents: number; expenseCents: number };

export type MonthResultData = {
  /** Período escolhido e o anterior de mesmo tamanho. */
  range: { from: string; to: string };
  previousRange: { from: string; to: string };
  current: MonthTotals;
  previous: MonthTotals;
};

export type CategorySlice = {
  /** `null` = sem categoria. */
  categoryId: string | null;
  name: string;
  icon: CategoryIconName | null;
  color: string | null;
  /** Despesa do mês (positivo). */
  totalCents: number;
  children: { categoryId: string; name: string; totalCents: number }[];
};

export type EvolutionPoint = { month: string } & MonthTotals;

/** Um dia do período: o que entrou, o que saiu e quanto sobrou até ali. */
export type CashflowPoint = {
  /** "AAAA-MM-DD" */
  date: string;
  /** Receitas do dia (positivo). */
  incomeCents: number;
  /** Despesas do dia (negativo). */
  expenseCents: number;
  /** Resultado somado do primeiro dia do período até este. */
  cumulativeCents: number;
};

export type UpcomingItem =
  | {
      type: 'transaction';
      id: string;
      date: string;
      description: string;
      amountCents: number;
      accountName: string;
    }
  | {
      type: 'invoice';
      id: string;
      date: string;
      description: string;
      amountCents: number;
      accountId: string;
      referenceMonth: string;
    };

export type BalanceData = {
  /** Soma das contas que não são cartão. */
  availableCents: number;
  /** Soma dos saldos dos cartões (negativo = dívida). */
  cardsCents: number;
  accounts: {
    id: string;
    name: string;
    type: AccountType;
    institution: { name: string; color: string } | null;
    balanceCents: number;
  }[];
};

export type RecentTransaction = {
  id: string;
  kind: 'income' | 'expense' | 'transfer';
  date: string;
  description: string;
  amountCents: number;
  accountName: string;
  createdByName: string;
};

export type SetupProgress = {
  hasAccount: boolean;
  hasTransaction: boolean;
  hasOtherMember: boolean;
};
