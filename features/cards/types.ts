import type { InstitutionSummary } from '@/features/accounts/types';
import type { InvoiceStatus } from '@/lib/cards';

export type InvoiceSummary = {
  /** `null` na fatura atual que ainda não recebeu lançamento. */
  id: string | null;
  referenceMonth: string;
  closingDate: string;
  dueDate: string;
  /** Soma das compras e estornos (negativa = a pagar). */
  totalCents: number;
  status: InvoiceStatus;
  paidAt: string | null;
};

export type CardSummary = {
  id: string;
  name: string;
  institution: Pick<InstitutionSummary, 'id' | 'name' | 'color'> | null;
  closingDay: number;
  dueDay: number;
  limitCents: number | null;
  defaultPaymentAccountId: string | null;
  /** Saldo do cartão (negativo = devendo). */
  balanceCents: number;
  /** Limite − dívida; `null` sem limite cadastrado. */
  availableCents: number | null;
  /** Fatura que recebe as compras de hoje. */
  currentInvoice: InvoiceSummary;
  archived: boolean;
};
