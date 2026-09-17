/** Tipos de conta (docs/domain.md). */
export const ACCOUNT_TYPES = ['checking', 'savings', 'investment', 'cash', 'credit_card'] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

/** Cartão de crédito tem fechamento, vencimento e faturas: entra na Fase 2. */
export const CREATABLE_ACCOUNT_TYPES = [
  'checking',
  'savings',
  'investment',
  'cash',
] as const satisfies readonly AccountType[];
export type CreatableAccountType = (typeof CREATABLE_ACCOUNT_TYPES)[number];

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  checking: 'Conta corrente',
  savings: 'Poupança',
  investment: 'Investimentos',
  cash: 'Dinheiro',
  credit_card: 'Cartão de crédito',
};

export const INSTITUTION_KINDS = ['bank', 'broker', 'wallet'] as const;
export type InstitutionKind = (typeof INSTITUTION_KINDS)[number];
