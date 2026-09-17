import type { AccountSummary, InstitutionSummary } from '@/features/accounts/types';

/** Dados de exemplo para stories e testes de componente. */
export const institutionsFixture: InstitutionSummary[] = [
  { id: '11111111-1111-4111-8111-111111111111', name: 'Inter', kind: 'bank', color: '#FF7A00' },
  { id: '22222222-2222-4222-8222-222222222222', name: 'Nubank', kind: 'bank', color: '#820AD1' },
  {
    id: '33333333-3333-4333-8333-333333333333',
    name: 'XP Investimentos',
    kind: 'broker',
    color: '#000000',
  },
];

export const accountsFixture: AccountSummary[] = [
  {
    id: 'a1',
    name: 'Nubank',
    type: 'checking',
    institution: { id: '22222222-2222-4222-8222-222222222222', name: 'Nubank', color: '#820AD1' },
    initialBalanceCents: 432_190,
    initialBalanceDate: '2026-09-01',
    balanceCents: 432_190,
    archived: false,
  },
  {
    id: 'a2',
    name: 'Reserva de emergência',
    type: 'investment',
    institution: {
      id: '33333333-3333-4333-8333-333333333333',
      name: 'XP Investimentos',
      color: '#000000',
    },
    initialBalanceCents: 2_500_000,
    initialBalanceDate: '2026-09-01',
    balanceCents: 2_500_000,
    archived: false,
  },
  {
    id: 'a3',
    name: 'Carteira',
    type: 'cash',
    institution: null,
    initialBalanceCents: -1_550,
    initialBalanceDate: '2026-09-10',
    balanceCents: -1_550,
    archived: false,
  },
  {
    id: 'a4',
    name: 'Conta antiga',
    type: 'savings',
    institution: null,
    initialBalanceCents: 0,
    initialBalanceDate: '2025-01-01',
    balanceCents: 0,
    archived: true,
  },
];
