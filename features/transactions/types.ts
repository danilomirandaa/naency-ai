import type { AccountType } from '@/lib/accounts';
import type { CategoryIconName } from '@/lib/categories';
import type { PaymentMethod, TransactionKind, TransactionStatus } from '@/lib/transactions';

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
  paymentMethod: PaymentMethod | null;
  /** "AAAA-MM-DD" em efetivados; `null` em previstos. */
  paidAt: string | null;
  /** Gerado por uma recorrência. */
  recurring: boolean;
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
  /** Somas do filtro inteiro (não só da página), sem transferências e sem o filtro de situação. */
  totals: {
    incomeCents: number;
    expenseCents: number;
    /** Previstos (inclui atrasados) e efetivados do período: soma com sinal e quantidade. */
    pending: { cents: number; count: number };
    paid: { cents: number; count: number };
  };
  /** Previstos com data anterior a hoje, em qualquer período (mesmos filtros de conta, categoria, tipo e busca). */
  overdueCount: number;
};
