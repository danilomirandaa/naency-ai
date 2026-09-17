import type { AccountType, InstitutionKind } from '@/lib/accounts';

/** DTOs de contas. Só tipos JSON: passam intactos pela hidratação e pelo Route Handler. */
export type InstitutionSummary = {
  id: string;
  name: string;
  kind: InstitutionKind;
  color: string;
};

export type AccountSummary = {
  id: string;
  name: string;
  type: AccountType;
  institution: Pick<InstitutionSummary, 'id' | 'name' | 'color'> | null;
  initialBalanceCents: number;
  /** "2026-09-16" */
  initialBalanceDate: string;
  /** Saldo calculado (docs/domain.md). Sem lançamentos ainda, é o saldo inicial. */
  balanceCents: number;
  archived: boolean;
  /** Só em cartão de crédito. */
  card: {
    closingDay: number;
    dueDay: number;
    limitCents: number | null;
    defaultPaymentAccountId: string | null;
  } | null;
};
