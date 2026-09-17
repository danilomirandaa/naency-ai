import { monthRange } from '@/lib/dates';
import type { TransactionFilters } from '@/features/transactions/filters';
import { ForbiddenError } from '@/server/auth/errors';
import { createUser, resetTestDb, signInAs } from '@/tests/integration/db';
import { beforeEach, describe, expect, it } from 'vitest';
import { createAccount, listAccounts, updateAccount } from './accounts';
import { listCardInvoices, listCards, payInvoice, unpayInvoice } from './cards';
import { acceptInvitation, createInvitation } from './members';
import { createTransaction, deleteTransaction, listTransactions, updateTransaction } from './transactions';
import { createWorkspace } from './workspaces';

type User = Awaited<ReturnType<typeof createUser>>;

let admin: User;
let workspaceId: string;
let nubank: string;
let card: string;

const TODAY = '2026-09-16';

const cardInput = {
  name: 'Cartão Nubank',
  type: 'credit_card' as const,
  institutionId: null,
  initialBalanceCents: 0,
  initialBalanceDate: '2026-01-01',
  closingDay: 25,
  dueDay: 5,
  limitCents: 500_000,
  defaultPaymentAccountId: null as string | null,
};

const allFilters: TransactionFilters = {
  ...monthRange('2026-09'),
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
    initialBalanceCents: 1_000_000,
    initialBalanceDate: '2026-01-01',
  }));
  ({ id: card } = await createAccount(workspaceId, { ...cardInput, defaultPaymentAccountId: nubank }));
});

function purchase(date: string, amountCents: number, extra: Record<string, unknown> = {}) {
  return createTransaction(workspaceId, {
    kind: 'expense',
    accountId: card,
    amountCents,
    date,
    description: 'Compra',
    categoryId: null,
    status: 'cleared',
    notes: null,
    ...extra,
  });
}

describe('cartão: conta', () => {
  it('cria com fechamento, vencimento, limite e conta de pagamento', async () => {
    const accounts = await listAccounts(workspaceId);
    expect(accounts.find((account) => account.id === card)).toMatchObject({
      type: 'credit_card',
      card: { closingDay: 25, dueDay: 5, limitCents: 500_000, defaultPaymentAccountId: nubank },
    });
    expect(accounts.find((account) => account.id === nubank)?.card).toBeNull();
  });

  it('exige fechamento e vencimento; conta de pagamento não pode ser cartão', async () => {
    await expect(createAccount(workspaceId, { ...cardInput, closingDay: null })).rejects.toThrow();
    await expect(
      createAccount(workspaceId, { ...cardInput, name: 'Outro', defaultPaymentAccountId: card }),
    ).rejects.toMatchObject({ code: 'invalid-payment-account' });
  });

  it('edita os dias e o limite; não vira conta comum nem o contrário', async () => {
    await updateAccount(workspaceId, card, { ...cardInput, closingDay: 3, dueDay: 10, limitCents: null });
    const [cardSummary] = await listCards(workspaceId, { today: TODAY });
    expect(cardSummary).toMatchObject({ closingDay: 3, dueDay: 10, limitCents: null, availableCents: null });

    await expect(updateAccount(workspaceId, card, { ...cardInput, type: 'checking' })).rejects.toMatchObject({
      code: 'type-change',
    });
    await expect(
      updateAccount(workspaceId, nubank, { ...cardInput, name: 'Nubank' }),
    ).rejects.toMatchObject({ code: 'type-change' });
  });
});

describe('cartão: faturas', () => {
  it('compra até o fechamento vai para a fatura do mês seguinte ao fechamento; depois, para a próxima', async () => {
    await purchase('2026-09-20', 10_000);
    await purchase('2026-09-26', 5_000);

    const invoices = await listCardInvoices(workspaceId, card, { today: TODAY });
    expect(invoices.map((invoice) => [invoice.referenceMonth, invoice.totalCents, invoice.status])).toEqual([
      ['2026-11', -5_000, 'open'],
      ['2026-10', -10_000, 'open'],
    ]);
    expect(invoices[1]).toMatchObject({ closingDate: '2026-09-25', dueDate: '2026-10-05' });

    const page = await listTransactions(workspaceId, { ...allFilters, accountId: card });
    expect(page.items.map((item) => [item.date, item.invoiceMonth])).toEqual([
      ['2026-09-26', '2026-11'],
      ['2026-09-20', '2026-10'],
    ]);
  });

  it('resumo do cartão: fatura atual, dívida e limite disponível', async () => {
    await purchase('2026-09-10', 120_000);
    const [summary] = await listCards(workspaceId, { today: TODAY });
    expect(summary).toMatchObject({
      balanceCents: -120_000,
      availableCents: 380_000,
      currentInvoice: { referenceMonth: '2026-10', totalCents: -120_000, status: 'open' },
    });
  });

  it('compra anterior ao cadastro do cartão conta no limite usado', async () => {
    // Cartão cadastrado hoje e fatura importada com compras de meses atrás:
    // cartão não tem saldo inicial, então a data do cadastro não corta nada.
    const { id: novo } = await createAccount(workspaceId, {
      ...cardInput,
      name: 'XP Black',
      initialBalanceDate: TODAY,
      defaultPaymentAccountId: null,
    });
    await createTransaction(workspaceId, {
      kind: 'expense',
      accountId: novo,
      amountCents: 141_524,
      date: '2025-12-05',
      description: 'Compra antiga',
      categoryId: null,
      status: 'cleared',
      notes: null,
    });
    const summary = (await listCards(workspaceId, { today: TODAY })).find((item) => item.name === 'XP Black');
    expect(summary).toMatchObject({ balanceCents: -141_524, availableCents: 358_476 });

    // Conta comum continua ignorando o que é anterior ao saldo inicial.
    const { id: poupanca } = await createAccount(workspaceId, {
      name: 'Poupança',
      type: 'savings',
      institutionId: null,
      initialBalanceCents: 0,
      initialBalanceDate: TODAY,
    });
    await createTransaction(workspaceId, {
      kind: 'expense',
      accountId: poupanca,
      amountCents: 1_000,
      date: '2025-12-05',
      description: 'Antiga',
      categoryId: null,
      status: 'cleared',
      notes: null,
    });
    expect((await listAccounts(workspaceId)).find((item) => item.name === 'Poupança')?.balanceCents).toBe(0);
  });

  it('cartão sem compra mostra a fatura atual vazia', async () => {
    const invoices = await listCardInvoices(workspaceId, card, { today: TODAY });
    expect(invoices).toEqual([
      expect.objectContaining({ id: null, referenceMonth: '2026-10', totalCents: 0, status: 'open' }),
    ]);
  });

  it('mudar a data da compra move para outra fatura', async () => {
    const { id } = await purchase('2026-09-20', 10_000);
    await updateTransaction(workspaceId, id, {
      kind: 'expense',
      accountId: card,
      amountCents: 10_000,
      date: '2026-10-01',
      description: 'Compra',
      categoryId: null,
      status: 'cleared',
      notes: null,
    });
    const invoices = await listCardInvoices(workspaceId, card, { today: TODAY });
    expect(invoices.map((invoice) => [invoice.referenceMonth, invoice.totalCents])).toEqual([
      ['2026-11', -10_000],
      ['2026-10', 0],
    ]);
  });

  it('filtra lançamentos pela fatura, mesmo com compras de meses diferentes', async () => {
    await purchase('2026-09-20', 10_000);
    await purchase('2026-09-26', 5_000);
    await purchase('2026-10-20', 2_000);
    const november = (await listCardInvoices(workspaceId, card, { today: TODAY })).find(
      (invoice) => invoice.referenceMonth === '2026-11',
    );
    const page = await listTransactions(workspaceId, {
      ...allFilters,
      accountId: card,
      invoiceId: november?.id ?? null,
    });
    expect(page.items.map((item) => item.amountCents)).toEqual([-2_000, -5_000]);
  });
});

describe('cartão: parcelas', () => {
  it('divide a compra com a sobra na primeira parcela, uma por fatura', async () => {
    await purchase('2026-09-20', 100_00, { installments: 3, description: 'Geladeira' });

    const invoices = await listCardInvoices(workspaceId, card, { today: TODAY });
    expect(invoices.map((invoice) => [invoice.referenceMonth, invoice.totalCents])).toEqual([
      ['2026-12', -33_33],
      ['2026-11', -33_33],
      ['2026-10', -33_34],
    ]);
    const october = await listTransactions(workspaceId, { ...allFilters, ...monthRange('2026-10'), accountId: card });
    expect(october.items[0]).toMatchObject({
      description: 'Geladeira (2/3)',
      installment: { number: 2, total: 3 },
      date: '2026-10-20',
    });
    // Limite considera a compra inteira (R$ 100 das três parcelas).
    const [summary] = await listCards(workspaceId, { today: TODAY });
    expect(summary?.availableCents).toBe(490_000);
  });

  it('excluir uma parcela exclui a compra inteira', async () => {
    const { id } = await purchase('2026-09-20', 90_00, { installments: 3 });
    await deleteTransaction(workspaceId, id);
    const invoices = await listCardInvoices(workspaceId, card, { today: TODAY });
    expect(invoices.every((invoice) => invoice.totalCents === 0)).toBe(true);
  });

  it('parcelar só em despesa de cartão', async () => {
    await expect(
      createTransaction(workspaceId, {
        kind: 'expense',
        accountId: nubank,
        amountCents: 100,
        date: '2026-09-20',
        description: 'X',
        categoryId: null,
        status: 'cleared',
        notes: null,
        installments: 2,
      }),
    ).rejects.toMatchObject({ code: 'installments-require-card', field: 'installments' });
  });
});

describe('cartão: pagamento da fatura', () => {
  it('paga com transferência da conta escolhida e desfaz', async () => {
    await purchase('2026-09-10', 120_000);
    const [october] = await listCardInvoices(workspaceId, card, { today: TODAY });

    await payInvoice(workspaceId, october?.id ?? '', { fromAccountId: nubank, date: '2026-10-05', amountCents: 120_000 });
    const balances = Object.fromEntries((await listAccounts(workspaceId)).map((a) => [a.name, a.balanceCents]));
    expect(balances).toEqual({ 'Cartão Nubank': 0, Nubank: 880_000 });

    const [paid] = await listCardInvoices(workspaceId, card, { today: TODAY });
    expect(paid).toMatchObject({ status: 'paid', totalCents: -120_000 });
    const october10 = await listTransactions(workspaceId, { ...allFilters, ...monthRange('2026-10') });
    expect(october10.items.map((item) => item.description)).toEqual(['Pagamento da fatura de outubro de 2026']);

    await expect(
      payInvoice(workspaceId, october?.id ?? '', { fromAccountId: nubank, date: '2026-10-05', amountCents: 1 }),
    ).rejects.toMatchObject({ code: 'already-paid' });

    await unpayInvoice(workspaceId, october?.id ?? '');
    const reopened = (await listCardInvoices(workspaceId, card, { today: '2026-10-06' })).find(
      (item) => item.referenceMonth === '2026-10',
    );
    expect(reopened).toMatchObject({ status: 'closed', paidAt: null });
    expect((await listAccounts(workspaceId)).find((a) => a.id === nubank)?.balanceCents).toBe(1_000_000);
    await expect(unpayInvoice(workspaceId, october?.id ?? '')).rejects.toMatchObject({ code: 'not-paid' });
  });

  it('não paga com outro cartão nem fatura de outro espaço', async () => {
    await purchase('2026-09-10', 1_000);
    const [invoice] = await listCardInvoices(workspaceId, card, { today: TODAY });
    await expect(
      payInvoice(workspaceId, invoice?.id ?? '', { fromAccountId: card, date: TODAY, amountCents: 1_000 }),
    ).rejects.toMatchObject({ code: 'invalid-account' });

    const { id: other } = await createWorkspace({ name: 'Empresa' });
    await expect(
      payInvoice(other, invoice?.id ?? '', { fromAccountId: nubank, date: TODAY, amountCents: 1_000 }),
    ).rejects.toMatchObject({ code: 'not-found' });
    await expect(listCardInvoices(other, card, { today: TODAY })).rejects.toMatchObject({ code: 'not-found' });
  });

  it('leitor vê faturas, mas não paga', async () => {
    await purchase('2026-09-10', 1_000);
    const [invoice] = await listCardInvoices(workspaceId, card, { today: TODAY });
    signInAs(admin);
    const { token } = await createInvitation(workspaceId, { email: 'ana@exemplo.com', role: 'viewer' });
    await createUser('ana@exemplo.com', { signIn: true });
    await acceptInvitation(token);

    await expect(listCards(workspaceId, { today: TODAY })).resolves.toHaveLength(1);
    await expect(
      payInvoice(workspaceId, invoice?.id ?? '', { fromAccountId: nubank, date: TODAY, amountCents: 1_000 }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    await expect(unpayInvoice(workspaceId, invoice?.id ?? '')).rejects.toBeInstanceOf(ForbiddenError);
  });
});
