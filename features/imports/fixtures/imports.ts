import { accountsFixture } from '@/features/accounts/fixtures/accounts';
import { categoryFixtureId } from '@/features/categories/fixtures/categories';
import type { ImportBatchDetail, ImportBatchSummary } from '@/features/imports/types';

const nubank = accountsFixture[0] as (typeof accountsFixture)[number];

function rowId(n: number) {
  return `0000000d-0000-4000-8000-${String(n).padStart(12, '0')}`;
}

export const importBatchFixture: ImportBatchDetail = {
  id: '0000000d-0000-4000-8000-000000000100',
  fileName: 'nubank-setembro.ofx',
  layout: 'ofx',
  status: 'review',
  account: { id: nubank.id, name: nubank.name, type: nubank.type, institution: nubank.institution },
  rows: [
    {
      id: rowId(1),
      position: 1,
      date: '2026-09-02',
      amountCents: -4_590,
      description: 'Compra no débito - PADARIA SAO JOAO',
      rawDescription: 'Compra no débito - PADARIA SAO JOAO',
      categoryId: categoryFixtureId('Alimentação/Padaria e café'),
      suggestedByRule: true,
      include: true,
      rememberCategory: false,
      duplicate: null,
    },
    {
      id: rowId(2),
      position: 2,
      date: '2026-09-05',
      amountCents: 850_000,
      description: 'Transferência recebida - EMPRESA LTDA',
      rawDescription: 'Transferência recebida - EMPRESA LTDA',
      categoryId: null,
      suggestedByRule: false,
      include: true,
      rememberCategory: false,
      duplicate: null,
    },
    {
      id: rowId(3),
      position: 3,
      date: '2026-09-10',
      amountCents: -12_050,
      description: 'Pix enviado - Maria',
      rawDescription: 'Pix enviado - Maria',
      categoryId: null,
      suggestedByRule: false,
      include: false,
      rememberCategory: false,
      duplicate: 'possible',
    },
  ],
  summary: {
    total: 3,
    included: 2,
    duplicates: 1,
    uncategorized: 1,
    incomeCents: 850_000,
    expenseCents: -4_590,
  },
};

export const importHistoryFixture: ImportBatchSummary[] = [
  {
    id: importBatchFixture.id,
    fileName: 'nubank-setembro.ofx',
    status: 'review',
    accountName: 'Nubank',
    rowCount: 3,
    createdAt: '2026-09-16T12:00:00.000Z',
  },
  {
    id: '0000000d-0000-4000-8000-000000000099',
    fileName: 'fatura-agosto.csv',
    status: 'committed',
    accountName: 'Nubank Roxinho',
    rowCount: 48,
    createdAt: '2026-09-01T12:00:00.000Z',
  },
];
