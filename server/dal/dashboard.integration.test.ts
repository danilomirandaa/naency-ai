import { monthRange } from '@/lib/dates';
import { ForbiddenError } from '@/server/auth/errors';
import { createUser, resetTestDb, signInAs } from '@/tests/integration/db';
import { beforeEach, describe, expect, it } from 'vitest';
import { createAccount } from './accounts';
import { listCardInvoices } from './cards';
import { listCategories } from './categories';
import {
  getBalances,
  getCashflow,
  getCategoryBreakdown,
  getPeriodResult,
  getMonthlyEvolution,
  getRecentTransactions,
  getSetupProgress,
  getUpcoming,
} from './dashboard';
import { acceptInvitation, createInvitation } from './members';
import { createTransaction } from './transactions';
import { createWorkspace } from './workspaces';

let workspaceId: string;
let nubank: string;
let card: string;
const ids: Record<string, string> = {};

async function tx(
  kind: 'income' | 'expense',
  amountCents: number,
  date: string,
  extra: Record<string, unknown> = {},
) {
  return createTransaction(workspaceId, {
    kind,
    accountId: nubank,
    amountCents,
    date,
    description: `${kind} ${date}`,
    categoryId: null,
    status: 'cleared',
    notes: null,
    ...extra,
  });
}

beforeEach(async () => {
  await resetTestDb();
  await createUser('danilo@exemplo.com', { signIn: true });
  ({ id: workspaceId } = await createWorkspace({ name: 'Casa' }));
  ({ id: nubank } = await createAccount(workspaceId, {
    name: 'Nubank',
    type: 'checking',
    institutionId: null,
    initialBalanceCents: 100_000,
    initialBalanceDate: '2026-01-01',
  }));
  ({ id: card } = await createAccount(workspaceId, {
    name: 'Cartão',
    type: 'credit_card',
    institutionId: null,
    initialBalanceCents: 0,
    initialBalanceDate: '2026-01-01',
    closingDay: 25,
    dueDay: 5,
  }));
  for (const category of await listCategories(workspaceId)) {
    ids[category.name] = category.id;
  }
});

describe('dashboard: resultado do mês', () => {
  it('receitas e despesas efetivadas do mês e do anterior, sem transferências nem previstos', async () => {
    await tx('income', 500_000, '2026-09-05');
    await tx('expense', 20_000, '2026-09-10');
    await tx('expense', 5_000, '2026-09-11', { status: 'planned' });
    await tx('expense', 30_000, '2026-08-10');
    await createTransaction(workspaceId, {
      kind: 'transfer',
      accountId: nubank,
      toAccountId: card,
      amountCents: 10_000,
      date: '2026-09-12',
      description: 'Pagamento',
      status: 'cleared',
      notes: null,
    });

    await expect(getPeriodResult(workspaceId, monthRange('2026-09'))).resolves.toEqual({
      range: { from: '2026-09-01', to: '2026-09-30' },
      previousRange: { from: '2026-08-01', to: '2026-08-31' },
      current: { incomeCents: 500_000, expenseCents: -20_000 },
      previous: { incomeCents: 0, expenseCents: -30_000 },
    });
  });

  it('período personalizado compara com o anterior de mesmo tamanho', async () => {
    await tx('expense', 1_000, '2026-09-05');
    await tx('expense', 3_000, '2026-09-12');
    await expect(getPeriodResult(workspaceId, { from: '2026-09-11', to: '2026-09-20' })).resolves.toMatchObject({
      previousRange: { from: '2026-09-01', to: '2026-09-10' },
      current: { expenseCents: -3_000 },
      previous: { expenseCents: -1_000 },
    });
  });

  it('compra no cartão conta como despesa na data da compra', async () => {
    await tx('expense', 12_000, '2026-09-20', { accountId: card });
    expect((await getPeriodResult(workspaceId, monthRange('2026-09'))).current.expenseCents).toBe(-12_000);
  });
});

describe('dashboard: categorias', () => {
  it('soma subcategorias no pai, ordena e agrupa sem categoria', async () => {
    await tx('expense', 150_000, '2026-09-01', { categoryId: ids.Aluguel });
    await tx('expense', 20_000, '2026-09-02', { categoryId: ids.Energia });
    await tx('expense', 5_000, '2026-09-03', { categoryId: ids.Moradia });
    await tx('expense', 40_000, '2026-09-04', { categoryId: ids.Mercado });
    await tx('expense', 1_000, '2026-09-05');
    await tx('income', 1_000_000, '2026-09-05', { categoryId: ids['Salário'] });

    const slices = await getCategoryBreakdown(workspaceId, monthRange('2026-09'));
    expect(slices.map((slice) => [slice.name, slice.totalCents])).toEqual([
      ['Moradia', 175_000],
      ['Mercado', 40_000],
      ['Sem categoria', 1_000],
    ]);
    expect(slices[0]?.children).toEqual([
      { categoryId: ids.Aluguel, name: 'Aluguel', totalCents: 150_000 },
      { categoryId: ids.Energia, name: 'Energia', totalCents: 20_000 },
    ]);
  });
});

describe('dashboard: evolução', () => {
  it('seis meses terminando no escolhido, com meses vazios zerados', async () => {
    await tx('income', 100, '2026-04-10');
    await tx('expense', 50, '2026-09-10');
    await tx('expense', 999, '2026-03-31');
    const points = await getMonthlyEvolution(workspaceId, '2026-09');
    expect(points.map((point) => point.month)).toEqual(['2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09']);
    expect(points[0]).toEqual({ month: '2026-04', incomeCents: 100, expenseCents: 0 });
    expect(points[5]).toEqual({ month: '2026-09', incomeCents: 0, expenseCents: -50 });
  });
});

describe('dashboard: fluxo do período', () => {
  it('um ponto por dia, com o acumulado somando do primeiro dia até o último', async () => {
    await tx('income', 500_000, '2026-09-05');
    await tx('expense', 120_000, '2026-09-05');
    await tx('expense', 80_000, '2026-09-20');
    // Fora do período: não entra nem no dia nem no acumulado.
    await tx('expense', 999_999, '2026-08-31');

    const points = await getCashflow(workspaceId, monthRange('2026-09'));
    expect(points).toHaveLength(30);
    expect(points[0]).toEqual({ date: '2026-09-01', incomeCents: 0, expenseCents: 0, cumulativeCents: 0 });
    // O dia soma entradas e saídas separadas; o acumulado já traz o que veio antes.
    expect(points[4]).toEqual({
      date: '2026-09-05',
      incomeCents: 500_000,
      expenseCents: -120_000,
      cumulativeCents: 380_000,
    });
    // Dia sem movimento repete o acumulado: a curva não tem buraco.
    expect(points[5]).toEqual({ date: '2026-09-06', incomeCents: 0, expenseCents: 0, cumulativeCents: 380_000 });
    expect(points.at(-1)).toEqual({
      date: '2026-09-30',
      incomeCents: 0,
      expenseCents: 0,
      cumulativeCents: 300_000,
    });
  });

  it('quem não é membro não vê o fluxo', async () => {
    await createUser('estranho@exemplo.com', { signIn: true });
    await expect(getCashflow(workspaceId, monthRange('2026-09'))).rejects.toBeInstanceOf(ForbiddenError);
  });
});

describe('dashboard: próximas contas', () => {
  it('previstos atrasados e dos próximos 30 dias, e faturas a vencer', async () => {
    await tx('expense', 18_990, '2026-09-10', { status: 'planned', description: 'Luz atrasada' });
    await tx('expense', 9_990, '2026-10-01', { status: 'planned', description: 'Internet' });
    await tx('expense', 1, '2026-11-30', { status: 'planned', description: 'Longe demais' });
    await tx('expense', 50_000, '2026-09-15', { accountId: card });

    const items = await getUpcoming(workspaceId, { today: '2026-09-16' });
    expect(items.map((item) => [item.type, item.date, item.description, item.amountCents])).toEqual([
      ['transaction', '2026-09-10', 'Luz atrasada', -18_990],
      ['transaction', '2026-10-01', 'Internet', -9_990],
      ['invoice', '2026-10-05', 'Fatura Cartão', -50_000],
    ]);
    expect((await listCardInvoices(workspaceId, card, { today: '2026-09-16' })).length).toBe(1);
  });
});

describe('dashboard: saldos, recentes e configuração', () => {
  it('saldo disponível separado da dívida dos cartões', async () => {
    await tx('expense', 30_000, '2026-09-10', { accountId: card });
    await tx('income', 20_000, '2026-09-10');
    await expect(getBalances(workspaceId)).resolves.toMatchObject({ availableCents: 120_000, cardsCents: -30_000 });
  });

  it('últimos lançados primeiro, com autor', async () => {
    await tx('expense', 1, '2026-09-20', { description: 'Primeiro' });
    await tx('expense', 2, '2026-01-01', { description: 'Segundo, data antiga' });
    const recent = await getRecentTransactions(workspaceId, 5);
    expect(recent.map((item) => [item.description, item.createdByName])).toEqual([
      ['Segundo, data antiga', 'danilo'],
      ['Primeiro', 'danilo'],
    ]);
  });

  it('progresso da configuração inicial', async () => {
    await expect(getSetupProgress(workspaceId)).resolves.toEqual({
      hasAccount: true,
      hasTransaction: false,
      hasOtherMember: false,
    });
    await tx('expense', 1, '2026-09-20');
    const { token } = await createInvitation(workspaceId, { email: 'ana@exemplo.com', role: 'viewer' });
    await createUser('ana@exemplo.com', { signIn: true });
    await acceptInvitation(token);
    await expect(getSetupProgress(workspaceId)).resolves.toEqual({
      hasAccount: true,
      hasTransaction: true,
      hasOtherMember: true,
    });
  });

  it('quem não é membro não vê nada', async () => {
    signInAs(await createUser('intruso@exemplo.com'));
    for (const call of [
      () => getPeriodResult(workspaceId, monthRange('2026-09')),
      () => getCategoryBreakdown(workspaceId, monthRange('2026-09')),
      () => getMonthlyEvolution(workspaceId, '2026-09'),
      () => getUpcoming(workspaceId),
      () => getBalances(workspaceId),
      () => getRecentTransactions(workspaceId),
      () => getSetupProgress(workspaceId),
    ]) {
      await expect(call()).rejects.toBeInstanceOf(ForbiddenError);
    }
  });
});
