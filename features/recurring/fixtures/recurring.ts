import { accountsFixture } from '@/features/accounts/fixtures/accounts';
import { categoryFixtureId } from '@/features/categories/fixtures/categories';
import type { RecurringRuleSummary } from '@/features/recurring/types';

const nubank = accountsFixture[0] as (typeof accountsFixture)[number];
const account = { id: nubank.id, name: nubank.name, type: nubank.type, institution: nubank.institution };

export const recurringFixture: RecurringRuleSummary[] = [
  {
    id: '0000000e-0000-4000-8000-000000000001',
    kind: 'expense',
    amountCents: 200_000,
    description: 'Aluguel',
    frequency: 'monthly',
    startDate: '2026-01-10',
    endDate: null,
    active: true,
    nextDate: '2026-10-10',
    account,
    category: { id: categoryFixtureId('Moradia/Aluguel'), name: 'Aluguel', icon: 'category-home', color: '#6366F1' },
  },
  {
    id: '0000000e-0000-4000-8000-000000000002',
    kind: 'income',
    amountCents: 850_000,
    description: 'Salário',
    frequency: 'monthly',
    startDate: '2026-01-05',
    endDate: null,
    active: true,
    nextDate: '2026-10-05',
    account,
    category: { id: categoryFixtureId('Salário', 'income'), name: 'Salário', icon: 'category-salary', color: '#16A34A' },
  },
  {
    id: '0000000e-0000-4000-8000-000000000003',
    kind: 'expense',
    amountCents: 5_990,
    description: 'Academia',
    frequency: 'monthly',
    startDate: '2026-02-01',
    endDate: null,
    active: false,
    nextDate: null,
    account,
    category: null,
  },
];
