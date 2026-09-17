import { ForbiddenError } from '@/server/auth/errors';
import { createUser, resetTestDb } from '@/tests/integration/db';
import { beforeEach, describe, expect, it } from 'vitest';
import { createAccount } from './accounts';
import { listCategories } from './categories';
import { acceptInvitation, createInvitation } from './members';
import { createGoal, deleteGoal, listBudgets, listGoals, setBudget, updateGoal } from './planning';
import { createTransaction } from './transactions';
import { createWorkspace } from './workspaces';

let workspaceId: string;
let nubank: string;
let reserva: string;
const ids: Record<string, string> = {};

beforeEach(async () => {
  await resetTestDb();
  await createUser('danilo@exemplo.com', { signIn: true });
  ({ id: workspaceId } = await createWorkspace({ name: 'Casa' }));
  ({ id: nubank } = await createAccount(workspaceId, {
    name: 'Nubank',
    type: 'checking',
    institutionId: null,
    initialBalanceCents: 0,
    initialBalanceDate: '2026-01-01',
  }));
  ({ id: reserva } = await createAccount(workspaceId, {
    name: 'Reserva',
    type: 'investment',
    institutionId: null,
    initialBalanceCents: 400_000,
    initialBalanceDate: '2026-01-01',
  }));
  for (const category of await listCategories(workspaceId)) {
    ids[category.name] = category.id;
  }
});

describe('orçamentos', () => {
  it('define, lista com o gasto do mês (subcategorias incluídas) e remove', async () => {
    await setBudget(workspaceId, { categoryId: ids.Moradia as string, amountCents: 250_000 });
    await createTransaction(workspaceId, {
      kind: 'expense',
      accountId: nubank,
      amountCents: 200_000,
      date: '2026-09-10',
      description: 'Aluguel',
      categoryId: ids.Aluguel,
      status: 'cleared',
      notes: null,
    });

    const lines = await listBudgets(workspaceId, '2026-09');
    expect(lines[0]).toMatchObject({ name: 'Moradia', budgetCents: 250_000, spentCents: 200_000 });
    expect(lines.find((line) => line.name === 'Mercado')).toMatchObject({ budgetCents: null, spentCents: 0 });
    expect(lines.some((line) => line.name === 'Aluguel' || line.name === 'Salário')).toBe(false);

    await setBudget(workspaceId, { categoryId: ids.Moradia as string, amountCents: 300_000 });
    expect((await listBudgets(workspaceId, '2026-09'))[0]?.budgetCents).toBe(300_000);
    await setBudget(workspaceId, { categoryId: ids.Moradia as string, amountCents: null });
    expect((await listBudgets(workspaceId, '2026-09')).every((line) => line.budgetCents === null)).toBe(true);
  });

  it('só em categoria principal de despesa', async () => {
    for (const name of ['Aluguel', 'Salário']) {
      await expect(setBudget(workspaceId, { categoryId: ids[name] as string, amountCents: 1 })).rejects.toMatchObject({
        code: 'invalid-category',
      });
    }
  });
});

describe('metas', () => {
  it('acompanha o saldo da conta e calcula quanto guardar por mês', async () => {
    const { id } = await createGoal(workspaceId, {
      name: 'Reserva de emergência',
      targetCents: 1_000_000,
      accountId: reserva,
      targetDate: '2027-09-01',
    });
    await expect(listGoals(workspaceId, { today: '2026-09-16' })).resolves.toEqual([
      expect.objectContaining({ id, savedCents: 400_000, monthlyNeededCents: 50_000, account: expect.objectContaining({ name: 'Reserva' }) }),
    ]);
    await updateGoal(workspaceId, id, { name: 'Viagem', targetCents: 300_000, accountId: reserva, targetDate: null });
    expect((await listGoals(workspaceId))[0]).toMatchObject({ name: 'Viagem', monthlyNeededCents: null });
    await deleteGoal(workspaceId, id);
    await expect(listGoals(workspaceId)).resolves.toEqual([]);
  });

  it('conta de cartão ou de outro espaço é recusada', async () => {
    const { id: card } = await createAccount(workspaceId, {
      name: 'Cartão',
      type: 'credit_card',
      institutionId: null,
      initialBalanceCents: 0,
      initialBalanceDate: '2026-01-01',
      closingDay: 1,
      dueDay: 10,
    });
    await expect(createGoal(workspaceId, { name: 'X', targetCents: 1, accountId: card })).rejects.toMatchObject({
      code: 'invalid-account',
    });
    const { id: other } = await createWorkspace({ name: 'Empresa' });
    await expect(createGoal(other, { name: 'X', targetCents: 1, accountId: reserva })).rejects.toMatchObject({
      code: 'invalid-account',
    });
    await expect(deleteGoal(other, 'x')).rejects.toMatchObject({ code: 'not-found' });
  });

  it('leitor vê orçamentos e metas, mas não altera', async () => {
    const { id } = await createGoal(workspaceId, { name: 'Viagem', targetCents: 1, accountId: reserva });
    const { token } = await createInvitation(workspaceId, { email: 'ana@exemplo.com', role: 'viewer' });
    await createUser('ana@exemplo.com', { signIn: true });
    await acceptInvitation(token);
    await expect(listGoals(workspaceId)).resolves.toHaveLength(1);
    await expect(listBudgets(workspaceId, '2026-09')).resolves.not.toHaveLength(0);
    await expect(setBudget(workspaceId, { categoryId: ids.Mercado as string, amountCents: 1 })).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    await expect(deleteGoal(workspaceId, id)).rejects.toBeInstanceOf(ForbiddenError);
  });
});
