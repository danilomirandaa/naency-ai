import type { AccountType } from '@/lib/accounts';
import type { CategoryIconName } from '@/lib/categories';
import type { RecurrenceFrequency } from '@/lib/recurrence';

export type RecurringRuleSummary = {
  id: string;
  kind: 'income' | 'expense';
  amountCents: number;
  description: string;
  frequency: RecurrenceFrequency;
  startDate: string;
  endDate: string | null;
  active: boolean;
  /** Próxima ocorrência; `null` se terminou ou está pausada. */
  nextDate: string | null;
  account: { id: string; name: string; type: AccountType; institution: { name: string; color: string } | null };
  category: { id: string; name: string; icon: CategoryIconName; color: string } | null;
};
