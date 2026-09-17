import type { CardSummary, InvoiceSummary } from '@/features/cards/types';

/** Exemplos para stories: hoje = 16/09/2026. */
export const invoicesFixture: InvoiceSummary[] = [
  {
    id: '0000000c-0000-4000-8000-000000000011',
    referenceMonth: '2026-11',
    closingDate: '2026-10-25',
    dueDate: '2026-11-05',
    totalCents: -45_990,
    status: 'open',
    paidAt: null,
  },
  {
    id: '0000000c-0000-4000-8000-000000000010',
    referenceMonth: '2026-10',
    closingDate: '2026-09-25',
    dueDate: '2026-10-05',
    totalCents: -238_450,
    status: 'open',
    paidAt: null,
  },
  {
    id: '0000000c-0000-4000-8000-000000000009',
    referenceMonth: '2026-09',
    closingDate: '2026-08-25',
    dueDate: '2026-09-05',
    totalCents: -198_720,
    status: 'paid',
    paidAt: '2026-09-04T12:00:00.000Z',
  },
  {
    id: '0000000c-0000-4000-8000-000000000008',
    referenceMonth: '2026-08',
    closingDate: '2026-07-25',
    dueDate: '2026-08-05',
    totalCents: -150_000,
    status: 'closed',
    paidAt: null,
  },
];

export const cardsFixture: CardSummary[] = [
  {
    id: '0000000c-0000-4000-8000-000000000001',
    name: 'Nubank Roxinho',
    institution: { id: '22222222-2222-4222-8222-222222222222', name: 'Nubank', color: '#820AD1' },
    closingDay: 25,
    dueDay: 5,
    limitCents: 800_000,
    defaultPaymentAccountId: '0000000a-0000-4000-8000-000000000001',
    balanceCents: -284_440,
    availableCents: 515_560,
    currentInvoice: invoicesFixture[1] as InvoiceSummary,
    archived: false,
  },
  {
    id: '0000000c-0000-4000-8000-000000000002',
    name: 'Inter Gold',
    institution: { id: '11111111-1111-4111-8111-111111111111', name: 'Inter', color: '#FF7A00' },
    closingDay: 3,
    dueDay: 10,
    limitCents: null,
    defaultPaymentAccountId: null,
    balanceCents: 0,
    availableCents: null,
    currentInvoice: {
      id: null,
      referenceMonth: '2026-10',
      closingDate: '2026-10-03',
      dueDate: '2026-10-10',
      totalCents: 0,
      status: 'open',
      paidAt: null,
    },
    archived: false,
  },
];
