import { accountsFixture } from '@/features/accounts/fixtures/accounts';
import { categoriesFixture, categoryFixtureId } from '@/features/categories/fixtures/categories';
import type { TransactionItem } from '@/features/transactions/types';

const [nubank, reserva, carteira] = accountsFixture as [
  (typeof accountsFixture)[number],
  (typeof accountsFixture)[number],
  (typeof accountsFixture)[number],
];

function account(source: typeof nubank) {
  return { id: source.id, name: source.name, type: source.type, institution: source.institution };
}

function category(path: string, kind: 'expense' | 'income' = 'expense') {
  const found = categoriesFixture.find((item) => item.id === categoryFixtureId(path, kind));
  if (!found) {
    throw new Error(`Categoria de exemplo ${path} não existe`);
  }
  const parent = found.parentId ? categoriesFixture.find((item) => item.id === found.parentId) : null;
  return { id: found.id, name: found.name, icon: found.icon, color: found.color, parentName: parent?.name ?? null };
}

function id(n: number) {
  return `0000000t-0000-4000-8000-${String(n).padStart(12, '0')}`.replace('t', '1');
}

/** Lançamentos de setembro de 2026, já na ordem da lista (mais recentes primeiro). */
export const transactionsFixture: TransactionItem[] = [
  {
    id: id(1),
    kind: 'expense',
    amountCents: -18_990,
    date: '2026-09-16',
    occurredTime: '04:57:10',
    description: 'Conta de luz',
    notes: null,
    status: 'planned',
    paymentMethod: 'boleto',
    paidAt: null,
    recurring: true,
    account: account(nubank),
    category: category('Moradia/Energia'),
    transfer: null,
    createdByName: 'Danilo',
    installment: null,
    invoiceMonth: null,
  },
  {
    id: id(2),
    kind: 'expense',
    amountCents: -32_450,
    date: '2026-09-15',
    occurredTime: '15:22:03',
    description: 'Supermercado',
    notes: 'Compra do mês',
    status: 'cleared',
    paymentMethod: 'debit_card',
    paidAt: '2026-09-15',
    recurring: false,
    account: account(nubank),
    category: category('Mercado'),
    transfer: null,
    createdByName: 'Ana',
    installment: null,
    invoiceMonth: null,
  },
  {
    id: id(3),
    kind: 'transfer',
    amountCents: -100_000,
    date: '2026-09-15',
    occurredTime: null,
    description: 'Reserva do mês',
    notes: null,
    status: 'cleared',
    paymentMethod: 'pix',
    paidAt: '2026-09-15',
    recurring: false,
    account: account(nubank),
    category: null,
    transfer: { counterpartAccountId: reserva.id, counterpartAccountName: reserva.name },
    createdByName: 'Danilo',
    installment: null,
    invoiceMonth: null,
  },
  {
    id: id(4),
    kind: 'expense',
    amountCents: -1_550,
    date: '2026-09-12',
    occurredTime: '09:10:00',
    description: 'Padaria',
    notes: null,
    status: 'cleared',
    paymentMethod: 'cash',
    paidAt: '2026-09-12',
    recurring: false,
    account: account(carteira),
    category: null,
    transfer: null,
    createdByName: 'Danilo',
    installment: null,
    invoiceMonth: null,
  },
  {
    id: id(5),
    kind: 'income',
    amountCents: 850_000,
    date: '2026-09-05',
    occurredTime: null,
    description: 'Salário',
    notes: null,
    status: 'cleared',
    paymentMethod: 'bank_transfer',
    paidAt: '2026-09-05',
    recurring: false,
    account: account(nubank),
    category: category('Salário', 'income'),
    transfer: null,
    createdByName: 'Danilo',
    installment: null,
    invoiceMonth: null,
  },
];
