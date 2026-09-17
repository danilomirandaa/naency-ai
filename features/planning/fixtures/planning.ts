import { accountsFixture } from '@/features/accounts/fixtures/accounts';
import { categoryFixtureId } from '@/features/categories/fixtures/categories';
import type { BudgetLine, GoalSummary } from '@/features/planning/types';

export const budgetsFixture: BudgetLine[] = [
  { categoryId: categoryFixtureId('Moradia'), name: 'Moradia', icon: 'category-home', color: '#6366F1', budgetCents: 250_000, spentCents: 238_990 },
  { categoryId: categoryFixtureId('Mercado'), name: 'Mercado', icon: 'category-market', color: '#16A34A', budgetCents: 100_000, spentCents: 132_450 },
  { categoryId: categoryFixtureId('Lazer'), name: 'Lazer', icon: 'category-leisure', color: '#DB2777', budgetCents: 80_000, spentCents: 41_200 },
  { categoryId: categoryFixtureId('Educação'), name: 'Educação', icon: 'category-education', color: '#7C3AED', budgetCents: null, spentCents: 0 },
];

const reserva = accountsFixture[1] as (typeof accountsFixture)[number];

export const goalsFixture: GoalSummary[] = [
  {
    id: '0000000f-0000-4000-8000-000000000001',
    name: 'Reserva de emergência',
    targetCents: 5_000_000,
    targetDate: '2027-09-01',
    account: { id: reserva.id, name: reserva.name, type: reserva.type, institution: reserva.institution },
    savedCents: 2_500_000,
    monthlyNeededCents: 208_334,
  },
  {
    id: '0000000f-0000-4000-8000-000000000002',
    name: 'Viagem',
    targetCents: 1_000_000,
    targetDate: null,
    account: { id: reserva.id, name: reserva.name, type: reserva.type, institution: reserva.institution },
    savedCents: 2_500_000,
    monthlyNeededCents: null,
  },
];
