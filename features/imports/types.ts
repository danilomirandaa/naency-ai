import type { AccountType } from '@/lib/accounts';

export type ImportRowItem = {
  id: string;
  position: number;
  date: string;
  amountCents: number;
  description: string;
  rawDescription: string;
  categoryId: string | null;
  /** Categoria veio da memória de categorização. */
  suggestedByRule: boolean;
  include: boolean;
  rememberCategory: boolean;
  duplicate: 'exact' | 'possible' | null;
};

export type ImportBatchDetail = {
  id: string;
  fileName: string;
  layout: string;
  status: 'review' | 'committed' | 'discarded';
  account: { id: string; name: string; type: AccountType; institution: { name: string; color: string } | null };
  rows: ImportRowItem[];
  summary: {
    total: number;
    included: number;
    duplicates: number;
    uncategorized: number;
    incomeCents: number;
    expenseCents: number;
  };
};

export type ImportBatchSummary = {
  id: string;
  fileName: string;
  status: 'review' | 'committed' | 'discarded';
  accountName: string;
  rowCount: number;
  createdAt: string;
};
