/** Tipos de conta (docs/domain.md). */
export const ACCOUNT_TYPES = ['checking', 'savings', 'investment', 'cash', 'credit_card'] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

/** Todos os tipos podem ser criados; cartão pede fechamento e vencimento. */
export const CREATABLE_ACCOUNT_TYPES = ACCOUNT_TYPES;
export type CreatableAccountType = AccountType;

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  checking: 'Conta corrente',
  savings: 'Poupança',
  investment: 'Investimentos',
  cash: 'Dinheiro',
  credit_card: 'Cartão de crédito',
};

export const INSTITUTION_KINDS = ['bank', 'broker', 'wallet'] as const;
export type InstitutionKind = (typeof INSTITUTION_KINDS)[number];
