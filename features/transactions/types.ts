import type { AccountType } from '@/lib/accounts';
import type { CategoryIconName } from '@/lib/categories';
import type { TransactionKind, TransactionStatus } from '@/lib/transactions';

export type TransactionItem = {
  id: string;
  kind: TransactionKind;
  /** Centavos com sinal. */
  amountCents: number;
  /** "AAAA-MM-DD" */
  date: string;
  description: string;
  notes: string | null;
  status: TransactionStatus;
  account: {
    id: string;
    name: string;
    type: AccountType;
    institution: { name: string; color: string } | null;
  };
  category: {
    id: string;
    name: string;
    icon: CategoryIconName;
    color: string;
    parentName: string | null;
  } | null;
  /** Em transferência: a outra conta. */
  transfer: { counterpartAccountId: string; counterpartAccountName: string } | null;
  createdByName: string;
  /** Compra parcelada: "3 de 10". */
  installment: { number: number; total: number } | null;
  /** Fatura do cartão ("2026-10"), em lançamentos de cartão. */
  invoiceMonth: string | null;
};

export type TransactionsPage = {
  items: TransactionItem[];
  total: number;
  page: number;
  pageSize: number;
  /** Somas do filtro inteiro (não só da página), sem transferências. */
  totals: { incomeCents: number; expenseCents: number };
};
