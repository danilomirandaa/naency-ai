import { accountsFixture } from '@/features/accounts/fixtures/accounts';
import { categoryFixtureId } from '@/features/categories/fixtures/categories';
import type {
  BalanceData,
  CategorySlice,
  EvolutionPoint,
  MonthResultData,
  RecentTransaction,
  UpcomingItem,
} from '@/features/dashboard/types';

export const balanceFixture: BalanceData = {
  availableCents: 2_930_640,
  cardsCents: -284_440,
  accounts: [
    ...accountsFixture.slice(0, 3).map(({ id, name, type, institution, balanceCents }) => ({
      id,
      name,
      type,
      institution: institution ? { name: institution.name, color: institution.color } : null,
      balanceCents,
    })),
    {
      id: '0000000c-0000-4000-8000-000000000001',
      name: 'Nubank Roxinho',
      type: 'credit_card',
      institution: { name: 'Nubank', color: '#820AD1' },
      balanceCents: -284_440,
    },
  ],
};

export const monthResultFixture: MonthResultData = {
  range: { from: '2026-09-01', to: '2026-09-30' },
  previousRange: { from: '2026-08-01', to: '2026-08-31' },
  current: { incomeCents: 850_000, expenseCents: -612_340 },
  previous: { incomeCents: 850_000, expenseCents: -540_000 },
};

export const categoryBreakdownFixture: CategorySlice[] = [
  {
    categoryId: categoryFixtureId('Moradia'),
    name: 'Moradia',
    icon: 'category-home',
    color: '#6366F1',
    totalCents: 238_990,
    children: [
      { categoryId: categoryFixtureId('Moradia/Aluguel'), name: 'Aluguel', totalCents: 200_000 },
      { categoryId: categoryFixtureId('Moradia/Energia'), name: 'Energia', totalCents: 18_990 },
      { categoryId: categoryFixtureId('Moradia/Internet'), name: 'Internet', totalCents: 20_000 },
    ],
  },
  { categoryId: categoryFixtureId('Mercado'), name: 'Mercado', icon: 'category-market', color: '#16A34A', totalCents: 132_450, children: [] },
  { categoryId: categoryFixtureId('Alimentação'), name: 'Alimentação', icon: 'category-food', color: '#EA580C', totalCents: 64_300, children: [] },
  { categoryId: categoryFixtureId('Transporte'), name: 'Transporte', icon: 'category-transport', color: '#0EA5E9', totalCents: 52_000, children: [] },
  { categoryId: categoryFixtureId('Lazer'), name: 'Lazer', icon: 'category-leisure', color: '#DB2777', totalCents: 41_200, children: [] },
  { categoryId: categoryFixtureId('Assinaturas'), name: 'Assinaturas', icon: 'category-subscriptions', color: '#0891B2', totalCents: 21_790, children: [] },
  { categoryId: categoryFixtureId('Saúde'), name: 'Saúde', icon: 'category-health', color: '#DC2626', totalCents: 15_000, children: [] },
  { categoryId: null, name: 'Sem categoria', icon: null, color: null, totalCents: 46_610, children: [] },
];

export const evolutionFixture: EvolutionPoint[] = [
  { month: '2026-04', incomeCents: 850_000, expenseCents: -702_000 },
  { month: '2026-05', incomeCents: 850_000, expenseCents: -655_000 },
  { month: '2026-06', incomeCents: 910_000, expenseCents: -720_500 },
  { month: '2026-07', incomeCents: 850_000, expenseCents: -598_200 },
  { month: '2026-08', incomeCents: 850_000, expenseCents: -540_000 },
  { month: '2026-09', incomeCents: 850_000, expenseCents: -612_340 },
];

export const upcomingFixture: UpcomingItem[] = [
  { type: 'transaction', id: 'u1', date: '2026-09-14', description: 'Conta de luz', amountCents: -18_990, accountName: 'Nubank' },
  { type: 'transaction', id: 'u2', date: '2026-09-17', description: 'Internet', amountCents: -9_990, accountName: 'Nubank' },
  {
    type: 'invoice',
    id: 'u3',
    date: '2026-10-05',
    description: 'Fatura Nubank Roxinho',
    amountCents: -238_450,
    accountId: '0000000c-0000-4000-8000-000000000001',
    referenceMonth: '2026-10',
  },
];

export const recentFixture: RecentTransaction[] = [
  { id: 'r1', kind: 'expense', date: '2026-09-15', description: 'Supermercado', amountCents: -32_450, accountName: 'Nubank', createdByName: 'Ana Paula' },
  { id: 'r2', kind: 'transfer', date: '2026-09-15', description: 'Reserva do mês', amountCents: -100_000, accountName: 'Nubank', createdByName: 'Danilo Miranda' },
  { id: 'r3', kind: 'income', date: '2026-09-05', description: 'Salário', amountCents: 850_000, accountName: 'Nubank', createdByName: 'Danilo Miranda' },
];
