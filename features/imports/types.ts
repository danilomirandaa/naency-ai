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
  /** Nome e categoria sugeridos pela AI. */
  suggestedByAi: boolean;
  include: boolean;
  rememberCategory: boolean;
  /** Compra parcelada, quando a fatura informa ("3 de 12"). */
  installment: { number: number; total: number } | null;
  /** Pagamento da fatura anterior listado dentro da fatura. */
  invoicePayment: boolean;
  duplicate: 'exact' | 'possible' | null;
};

export type ImportJob = 'suggest' | 'commit';

export type ImportBatchDetail = {
  id: string;
  fileName: string;
  layout: string;
  status: 'review' | 'committed' | 'discarded';
  /** Trabalho rodando no servidor; a tela acompanha até terminar. */
  job: ImportJob | null;
  /** Erro do último trabalho. */
  jobError: string | null;
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
  job: ImportJob | null;
  accountName: string;
  rowCount: number;
  createdAt: string;
};
