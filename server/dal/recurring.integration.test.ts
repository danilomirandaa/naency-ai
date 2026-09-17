import type { TransactionFilters } from '@/features/transactions/filters';
import { ForbiddenError } from '@/server/auth/errors';
import { createUser, resetTestDb, signInAs } from '@/tests/integration/db';
import { beforeEach, describe, expect, it } from 'vitest';
import { createAccount, listAccounts } from './accounts';
import { listCategories } from './categories';
import { acceptInvitation, createInvitation } from './members';
import {
  createRecurringRule,
  deleteRecurringRule,
  listRecurringRules,
  materializeRecurring,
  setRecurringRuleActive,
  updateRecurringRule,
} from './recurring';
import { deleteTransaction, listTransactions, setTransactionStatus } from './transactions';
import { createWorkspace } from './workspaces';

let workspaceId: string;
let nubank: string;
let aluguel: string;

const TODAY = '2026-09-16';
const filters = (month: string): TransactionFilters => ({
  month,
  accountId: null,
  categoryId: null,
  kind: null,
  search: '',
  page: 1,
});

const rent = () => ({
  kind: 'expense' as const,
  description: 'Aluguel',
  amountCents: 200_000,
  accountId: nubank,
  categoryId: aluguel,
  frequency: 'monthly' as const,
  startDate: '2026-01-10',
});

async function planned(month: string) {
  const page = await listTransactions(workspaceId, filters(month));
  return page.items.map((item) => [item.date, item.amountCents, item.status]);
}

beforeEach(async () => {
  await resetTestDb();
  await createUser('danilo@exemplo.com', { signIn: true });
  ({ id: workspaceId } = await createWorkspace({ name: 'Casa' }));
  ({ id: nubank } = await createAccount(workspaceId, {
    name: 'Nubank',
    type: 'checking',
    institutionId: null,
    initialBalanceCents: 1_000_000,
    initialBalanceDate: '2026-01-01',
  }));
  aluguel = (await listCategories(workspaceId)).find((category) => category.name === 'Aluguel')?.id ?? '';
});

describe('recorrências', () => {
  it('gera previstos a partir de hoje até 45 dias, sem atrasados falsos do passado', async () => {
    await createRecurringRule(workspaceId, rent(), { today: TODAY });
    expect(await planned('2026-08')).toEqual([]);
    expect(await planned('2026-09')).toEqual([]);
    expect(await planned('2026-10')).toEqual([['2026-10-10', -200_000, 'planned']]);
    expect(await planned('2026-11')).toEqual([]);
    // Previsto não mexe no saldo.
    expect((await listAccounts(workspaceId))[0]?.balanceCents).toBe(1_000_000);

    const [summary] = await listRecurringRules(workspaceId, { today: TODAY });
    expect(summary).toMatchObject({ nextDate: '2026-10-10', active: true, category: { name: 'Aluguel' } });
  });

  it('rodar de novo não duplica; o dia seguinte gera só as novas', async () => {
    await createRecurringRule(workspaceId, rent(), { today: TODAY });
    await expect(materializeRecurring(workspaceId, { today: TODAY })).resolves.toEqual({ created: 0 });
    await expect(materializeRecurring(workspaceId, { today: '2026-10-01' })).resolves.toEqual({ created: 1 });
    expect(await planned('2026-11')).toEqual([['2026-11-10', -200_000, 'planned']]);
  });

  it('ocorrência excluída não volta; efetivada entra no saldo', async () => {
    await createRecurringRule(workspaceId, { ...rent(), frequency: 'weekly', startDate: '2026-09-18' }, { today: TODAY });
    const september = await listTransactions(workspaceId, filters('2026-09'));
    expect(september.items.map((item) => item.date)).toEqual(['2026-09-25', '2026-09-18']);

    await deleteTransaction(workspaceId, september.items[1]?.id ?? '');
    await setTransactionStatus(workspaceId, september.items[0]?.id ?? '', 'cleared');
    await materializeRecurring(workspaceId, { today: TODAY });
    expect(await planned('2026-09')).toEqual([['2026-09-25', -200_000, 'cleared']]);
    expect((await listAccounts(workspaceId))[0]?.balanceCents).toBe(800_000);
  });

  it('editar a regra refaz só os previstos futuros; os efetivados ficam', async () => {
    const { id } = await createRecurringRule(
      workspaceId,
      { ...rent(), frequency: 'weekly', startDate: '2026-09-18' },
      { today: TODAY },
    );
    const [first] = (await listTransactions(workspaceId, filters('2026-09'))).items.slice(-1);
    await setTransactionStatus(workspaceId, first?.id ?? '', 'cleared');

    await updateRecurringRule(
      workspaceId,
      id,
      { ...rent(), frequency: 'weekly', startDate: '2026-09-18', amountCents: 250_000 },
      { today: '2026-09-20' },
    );
    expect(await planned('2026-09')).toEqual([
      ['2026-09-25', -250_000, 'planned'],
      ['2026-09-18', -200_000, 'cleared'],
    ]);
  });

  it('pausar remove os previstos futuros e reativar gera de novo a partir de hoje', async () => {
    const { id } = await createRecurringRule(workspaceId, rent(), { today: TODAY });
    await setRecurringRuleActive(workspaceId, id, false, { today: TODAY });
    expect(await planned('2026-10')).toEqual([]);
    expect((await listRecurringRules(workspaceId, { today: TODAY }))[0]).toMatchObject({ active: false, nextDate: null });

    await setRecurringRuleActive(workspaceId, id, true, { today: TODAY });
    // A ocorrência de 10/10 foi removida de verdade ao pausar, então volta.
    expect(await planned('2026-10')).toEqual([['2026-10-10', -200_000, 'planned']]);
  });

  it('excluir a regra remove os previstos e mantém os efetivados', async () => {
    const { id } = await createRecurringRule(
      workspaceId,
      { ...rent(), frequency: 'weekly', startDate: '2026-09-18' },
      { today: TODAY },
    );
    const items = (await listTransactions(workspaceId, filters('2026-09'))).items;
    await setTransactionStatus(workspaceId, items[1]?.id ?? '', 'cleared');
    await deleteRecurringRule(workspaceId, id, { today: TODAY });
    expect(await planned('2026-09')).toEqual([['2026-09-18', -200_000, 'cleared']]);
    await expect(listRecurringRules(workspaceId)).resolves.toEqual([]);
  });

  it('valida conta, categoria e datas', async () => {
    const salario = (await listCategories(workspaceId)).find((category) => category.name === 'Salário')?.id;
    await expect(createRecurringRule(workspaceId, { ...rent(), categoryId: salario })).rejects.toMatchObject({
      code: 'invalid-category',
    });
    await expect(createRecurringRule(workspaceId, { ...rent(), endDate: '2025-01-01' })).rejects.toThrow();
    const { id: other } = await createWorkspace({ name: 'Empresa' });
    await expect(createRecurringRule(other, { ...rent(), categoryId: null })).rejects.toMatchObject({
      code: 'invalid-account',
    });
    await expect(deleteRecurringRule(other, 'x')).rejects.toMatchObject({ code: 'not-found' });
  });

  it('leitor vê, mas não cria nem altera', async () => {
    const { id } = await createRecurringRule(workspaceId, rent(), { today: TODAY });
    const { token } = await createInvitation(workspaceId, { email: 'ana@exemplo.com', role: 'viewer' });
    await createUser('ana@exemplo.com', { signIn: true });
    await acceptInvitation(token);
    await expect(listRecurringRules(workspaceId)).resolves.toHaveLength(1);
    await expect(createRecurringRule(workspaceId, rent())).rejects.toBeInstanceOf(ForbiddenError);
    await expect(setRecurringRuleActive(workspaceId, id, false)).rejects.toBeInstanceOf(ForbiddenError);
    signInAs(null);
    await expect(materializeRecurring(workspaceId)).rejects.toThrow();
  });
});
