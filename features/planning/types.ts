import type { AccountType } from '@/lib/accounts';
import type { CategoryIconName } from '@/lib/categories';

export type BudgetLine = {
  categoryId: string;
  name: string;
  icon: CategoryIconName;
  color: string;
  /** Orçamento do mês; `null` sem orçamento. */
  budgetCents: number | null;
  /** Gasto efetivado no mês (positivo), subcategorias incluídas. */
  spentCents: number;
};

export type GoalSummary = {
  id: string;
  name: string;
  targetCents: number;
  targetDate: string | null;
  account: { id: string; name: string; type: AccountType; institution: { name: string; color: string } | null };
  /** Saldo atual da conta ligada. */
  savedCents: number;
  /** Quanto guardar por mês para chegar na data; `null` sem data ou já alcançada. */
  monthlyNeededCents: number | null;
};
