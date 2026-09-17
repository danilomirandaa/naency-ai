import type { TransactionFilters } from '@/features/transactions/filters';
import { ForbiddenError } from '@/server/auth/errors';
import { createUser, resetTestDb, signInAs } from '@/tests/integration/db';
import { beforeEach, describe, expect, it } from 'vitest';
import { createAccount, listAccounts, setAccountArchived } from './accounts';
import { listCategories, setCategoryArchived } from './categories';
import { acceptInvitation, createInvitation } from './members';
import {
  createTransaction,
  deleteTransaction,
  listTransactions,
  setTransactionStatus,
  updateTransaction,
} from './transactions';
import { createWorkspace } from './workspaces';

type User = Awaited<ReturnType<typeof createUser>>;

let admin: User;
let workspaceId: string;
let nubank: string;
let carteira: string;
let mercado: string;
let aluguel: string;
let moradia: string;
let salario: string;

const september: TransactionFilters = {
  month: '2026-09',
  accountId: null,
  categoryId: null,
  kind: null,
  search: '',
  page: 1,
};

beforeEach(async () => {
  await resetTestDb();
  admin = await createUser('danilo@exemplo.com', { signIn: true });
  ({ id: workspaceId } = await createWorkspace({ name: 'Finanças da casa' }));
  ({ id: nubank } = await createAccount(workspaceId, {
    name: 'Nubank',
    type: 'checking',
    institutionId: null,
    initialBalanceCents: 100_000,
    initialBalanceDate: '2026-09-01',
  }));
  ({ id: carteira } = await createAccount(workspaceId, {
    name: 'Carteira',
    type: 'cash',
    institutionId: null,
    initialBalanceCents: 0,
    initialBalanceDate: '2026-09-01',
  }));
  const categories = await listCategories(workspaceId);
  const find = (name: string) => categories.find((category) => category.name === name)?.id ?? '';
  mercado = find('Mercado');
  aluguel = find('Aluguel');
  moradia = find('Moradia');
  salario = find('Salário');
});

function expense(overrides: Record<string, unknown> = {}) {
  return {
    kind: 'expense' as const,
    accountId: nubank,
    amountCents: 25_000,
    date: '2026-09-10',
    description: 'Supermercado',
    categoryId: mercado,
    status: 'cleared' as const,
    notes: null,
    ...overrides,
  };
}

async function balances() {
  const list = await listAccounts(workspaceId);
  return Object.fromEntries(list.map((account) => [account.name, account.balanceCents]));
}

describe('lançamentos: receita e despesa', () => {
  it('grava com sinal e entra no saldo da conta', async () => {
    await createTransaction(workspaceId, expense());
    await createTransaction(workspaceId, {
      kind: 'income',
      accountId: nubank,
      amountCents: 500_000,
      date: '2026-09-05',
      description: 'Salário',
      categoryId: salario,
      status: 'cleared',
      notes: 'setembro',
    });

    const page = await listTransactions(workspaceId, september);
    expect(page.items.map((item) => [item.description, item.amountCents])).toEqual([
      ['Supermercado', -25_000],
      ['Salário', 500_000],
    ]);
    expect(page.items[0]).toMatchObject({
      kind: 'expense',
      account: { id: nubank, name: 'Nubank' },
      category: { id: mercado, name: 'Mercado', parentName: null },
      transfer: null,
      createdByName: 'danilo',
    });
    expect(page.totals).toEqual({ incomeCents: 500_000, expenseCents: -25_000 });
    expect(await balances()).toEqual({ Carteira: 0, Nubank: 575_000 });
  });

  it('previsto não entra no saldo até ser efetivado', async () => {
    const { id } = await createTransaction(workspaceId, expense({ status: 'planned' }));
    expect((await balances()).Nubank).toBe(100_000);
    await setTransactionStatus(workspaceId, id, 'cleared');
    expect((await balances()).Nubank).toBe(75_000);
  });

  it('lançamento antes da data do saldo inicial não altera o saldo', async () => {
    await createTransaction(workspaceId, expense({ date: '2026-08-31' }));
    expect((await balances()).Nubank).toBe(100_000);
  });

  it('edita valor, conta e categoria; exclui sem afetar o saldo', async () => {
    const { id } = await createTransaction(workspaceId, expense());
    await updateTransaction(workspaceId, id, expense({ amountCents: 1_000, accountId: carteira, categoryId: aluguel }));

    const [item] = (await listTransactions(workspaceId, september)).items;
    expect(item).toMatchObject({
      amountCents: -1_000,
      account: { name: 'Carteira' },
      category: { name: 'Aluguel', parentName: 'Moradia' },
    });
    expect(await balances()).toEqual({ Carteira: -1_000, Nubank: 100_000 });

    await deleteTransaction(workspaceId, id);
    expect((await listTransactions(workspaceId, september)).items).toEqual([]);
    expect((await balances()).Carteira).toBe(0);
    await expect(deleteTransaction(workspaceId, id)).rejects.toMatchObject({ code: 'not-found' });
  });

  it('categoria precisa ser do mesmo tipo e do espaço', async () => {
    await expect(createTransaction(workspaceId, expense({ categoryId: salario }))).rejects.toMatchObject({
      code: 'invalid-category',
      field: 'categoryId',
    });
    const { id: other } = await createWorkspace({ name: 'Empresa' });
    const [foreign] = await listCategories(other);
    await expect(createTransaction(workspaceId, expense({ categoryId: foreign?.id }))).rejects.toMatchObject({
      code: 'invalid-category',
    });
  });

  it('conta arquivada não recebe lançamento novo, mas o antigo continua editável', async () => {
    const { id } = await createTransaction(workspaceId, expense());
    await setAccountArchived(workspaceId, nubank, true);
    await expect(createTransaction(workspaceId, expense())).rejects.toMatchObject({
      code: 'invalid-account',
      field: 'accountId',
    });
    await expect(updateTransaction(workspaceId, id, expense({ description: 'Feira' }))).resolves.toEqual({ id });
  });

  it('categoria arquivada: o lançamento antigo mantém, o novo não usa', async () => {
    const { id } = await createTransaction(workspaceId, expense());
    await setCategoryArchived(workspaceId, mercado, true);
    await expect(updateTransaction(workspaceId, id, expense({ description: 'Feira' }))).resolves.toEqual({ id });
    await expect(createTransaction(workspaceId, expense())).rejects.toMatchObject({ code: 'invalid-category' });
  });
});

describe('lançamentos: transferência', () => {
  it('cria duas pernas opostas, sem mudar o total de receitas e despesas', async () => {
    await createTransaction(workspaceId, {
      kind: 'transfer',
      accountId: nubank,
      toAccountId: carteira,
      amountCents: 20_000,
      date: '2026-09-12',
      description: 'Saque',
      status: 'cleared',
      notes: null,
    });

    // Sem filtro de conta, aparece uma vez, pela saída.
    const page = await listTransactions(workspaceId, september);
    expect(page.items.map((item) => [item.account.name, item.amountCents, item.transfer?.counterpartAccountName])).toEqual([
      ['Nubank', -20_000, 'Carteira'],
    ]);
    expect(page.totals).toEqual({ incomeCents: 0, expenseCents: 0 });

    // Filtrando pela conta de destino, aparece a entrada.
    const destination = await listTransactions(workspaceId, { ...september, accountId: carteira });
    expect(destination.items.map((item) => [item.amountCents, item.transfer?.counterpartAccountName])).toEqual([
      [20_000, 'Nubank'],
    ]);
    expect(await balances()).toEqual({ Carteira: 20_000, Nubank: 80_000 });
  });

  it('editar ou excluir uma perna afeta as duas', async () => {
    const transfer = {
      kind: 'transfer' as const,
      accountId: nubank,
      toAccountId: carteira,
      amountCents: 20_000,
      date: '2026-09-12',
      description: 'Saque',
      status: 'cleared' as const,
      notes: null,
    };
    await createTransaction(workspaceId, transfer);
    const [incoming] = (await listTransactions(workspaceId, { ...september, accountId: carteira })).items;

    await updateTransaction(workspaceId, incoming?.id ?? '', { ...transfer, amountCents: 5_000, description: 'Saque menor' });
    expect(await balances()).toEqual({ Carteira: 5_000, Nubank: 95_000 });
    expect((await listTransactions(workspaceId, september)).items.map((item) => item.description)).toEqual(['Saque menor']);

    await setTransactionStatus(workspaceId, incoming?.id ?? '', 'planned');
    expect(await balances()).toEqual({ Carteira: 0, Nubank: 100_000 });

    await deleteTransaction(workspaceId, incoming?.id ?? '');
    expect((await listTransactions(workspaceId, september)).total).toBe(0);
  });

  it('trocar despesa por transferência (e volta) substitui as linhas', async () => {
    const { id } = await createTransaction(workspaceId, expense());
    const { id: transferId } = await updateTransaction(workspaceId, id, {
      kind: 'transfer',
      accountId: nubank,
      toAccountId: carteira,
      amountCents: 25_000,
      date: '2026-09-10',
      description: 'Era despesa',
      status: 'cleared',
      notes: null,
    });
    expect((await listTransactions(workspaceId, september)).total).toBe(1);
    expect(await balances()).toEqual({ Carteira: 25_000, Nubank: 75_000 });

    await updateTransaction(workspaceId, transferId, expense({ description: 'Voltou a ser despesa' }));
    const page = await listTransactions(workspaceId, september);
    expect(page.items.map((item) => item.description)).toEqual(['Voltou a ser despesa']);
    expect(await balances()).toEqual({ Carteira: 0, Nubank: 75_000 });
  });

  it('conta de destino de outro espaço é recusada', async () => {
    const { id: other } = await createWorkspace({ name: 'Empresa' });
    const { id: foreignAccount } = await createAccount(other, {
      name: 'PJ',
      type: 'checking',
      institutionId: null,
      initialBalanceCents: 0,
      initialBalanceDate: '2026-09-01',
    });
    await expect(
      createTransaction(workspaceId, {
        kind: 'transfer',
        accountId: nubank,
        toAccountId: foreignAccount,
        amountCents: 1,
        date: '2026-09-12',
        description: 'X',
        status: 'cleared',
        notes: null,
      }),
    ).rejects.toMatchObject({ code: 'invalid-account', field: 'toAccountId' });
  });
});

describe('lançamentos: filtros e paginação', () => {
  beforeEach(async () => {
    await createTransaction(workspaceId, expense({ description: 'Padaria São João', date: '2026-09-02' }));
    await createTransaction(workspaceId, expense({ description: 'Aluguel', categoryId: aluguel, date: '2026-09-05' }));
    await createTransaction(workspaceId, expense({ description: 'Mercado agosto', date: '2026-08-30' }));
    await createTransaction(workspaceId, expense({ description: 'Café', accountId: carteira, date: '2026-09-03' }));
  });

  it('por mês', async () => {
    expect((await listTransactions(workspaceId, september)).total).toBe(3);
    expect((await listTransactions(workspaceId, { ...september, month: '2026-08' })).total).toBe(1);
  });

  it('por conta, por tipo e por busca (ignora maiúsculas)', async () => {
    expect((await listTransactions(workspaceId, { ...september, accountId: carteira })).items.map((i) => i.description)).toEqual(['Café']);
    expect((await listTransactions(workspaceId, { ...september, kind: 'income' })).total).toBe(0);
    expect((await listTransactions(workspaceId, { ...september, search: 'padaria' })).items.map((i) => i.description)).toEqual(['Padaria São João']);
    expect((await listTransactions(workspaceId, { ...september, search: '100%' })).total).toBe(0);
  });

  it('categoria principal inclui as subcategorias', async () => {
    const page = await listTransactions(workspaceId, { ...september, categoryId: moradia });
    expect(page.items.map((item) => item.description)).toEqual(['Aluguel']);
    expect(page.totals.expenseCents).toBe(-25_000);
  });

  it('pagina de 50 em 50, mais recentes primeiro', async () => {
    for (let day = 1; day <= 52; day += 1) {
      await createTransaction(
        workspaceId,
        expense({ description: `Item ${day}`, date: `2026-10-${String(Math.min(day, 31)).padStart(2, '0')}`, amountCents: 100 }),
      );
    }
    const october = { ...september, month: '2026-10' };
    const first = await listTransactions(workspaceId, october);
    const second = await listTransactions(workspaceId, { ...october, page: 2 });
    expect(first).toMatchObject({ total: 52, page: 1, pageSize: 50 });
    expect(first.items).toHaveLength(50);
    expect(second.items).toHaveLength(2);
    expect(first.totals.expenseCents).toBe(-5_200);
    expect(first.items[0]?.date).toBe('2026-10-31');
  });
});

describe('lançamentos: papéis e isolamento', () => {
  it('leitor lê e não escreve; não-membro não lê', async () => {
    const { id } = await createTransaction(workspaceId, expense());
    signInAs(admin);
    const { token } = await createInvitation(workspaceId, { email: 'esposa@exemplo.com', role: 'viewer' });
    const viewer = await createUser('esposa@exemplo.com', { signIn: true });
    await acceptInvitation(token);

    await expect(listTransactions(workspaceId, september)).resolves.toMatchObject({ total: 1 });
    await expect(createTransaction(workspaceId, expense())).rejects.toBeInstanceOf(ForbiddenError);
    await expect(updateTransaction(workspaceId, id, expense())).rejects.toBeInstanceOf(ForbiddenError);
    await expect(deleteTransaction(workspaceId, id)).rejects.toBeInstanceOf(ForbiddenError);
    await expect(setTransactionStatus(workspaceId, id, 'planned')).rejects.toBeInstanceOf(ForbiddenError);

    signInAs(await createUser('intruso@exemplo.com'));
    await expect(listTransactions(workspaceId, september)).rejects.toBeInstanceOf(ForbiddenError);
    expect(viewer.email).toBe('esposa@exemplo.com');
  });

  it('não mexe em lançamento de outro espaço', async () => {
    const { id: other } = await createWorkspace({ name: 'Empresa' });
    const { id: otherAccount } = await createAccount(other, {
      name: 'PJ',
      type: 'checking',
      institutionId: null,
      initialBalanceCents: 0,
      initialBalanceDate: '2026-09-01',
    });
    const { id } = await createTransaction(other, expense({ accountId: otherAccount, categoryId: null }));
    await expect(updateTransaction(workspaceId, id, expense())).rejects.toMatchObject({ code: 'not-found' });
    await expect(deleteTransaction(workspaceId, id)).rejects.toMatchObject({ code: 'not-found' });
    await expect(setTransactionStatus(workspaceId, 'x', 'planned')).rejects.toMatchObject({ code: 'not-found' });
    await expect(createTransaction(workspaceId, expense({ accountId: otherAccount }))).rejects.toMatchObject({
      code: 'invalid-account',
    });
  });
});
