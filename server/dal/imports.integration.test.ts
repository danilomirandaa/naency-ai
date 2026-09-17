import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { TransactionFilters } from '@/features/transactions/filters';
import { ForbiddenError } from '@/server/auth/errors';
import { createUser, resetTestDb, signInAs } from '@/tests/integration/db';
import { beforeEach, describe, expect, it } from 'vitest';
import { createAccount, listAccounts } from './accounts';
import { listCardInvoices } from './cards';
import { listCategories } from './categories';
import {
  commitImportBatch,
  createImportBatch,
  discardImportBatch,
  getImportBatch,
  listImportBatches,
  updateImportRow,
} from './imports';
import { acceptInvitation, createInvitation } from './members';
import { createTransaction, listTransactions } from './transactions';
import { createWorkspace } from './workspaces';

let workspaceId: string;
let nubank: string;
let padaria: string;
let salario: string;

const ofx = readFileSync(path.resolve('lib/import/__fixtures__/conta-sgml.ofx'), 'utf8');
const september: TransactionFilters = { month: '2026-09', accountId: null, categoryId: null, kind: null, search: '', page: 1 };

beforeEach(async () => {
  await resetTestDb();
  await createUser('danilo@exemplo.com', { signIn: true });
  ({ id: workspaceId } = await createWorkspace({ name: 'Finanças da casa' }));
  ({ id: nubank } = await createAccount(workspaceId, {
    name: 'Nubank',
    type: 'checking',
    institutionId: null,
    initialBalanceCents: 0,
    initialBalanceDate: '2026-01-01',
  }));
  const categories = await listCategories(workspaceId);
  padaria = categories.find((category) => category.name === 'Padaria e café')?.id ?? '';
  salario = categories.find((category) => category.name === 'Salário')?.id ?? '';
});

async function importOfx() {
  const { id } = await createImportBatch(workspaceId, { accountId: nubank, fileName: 'extrato.ofx', text: ofx });
  return getImportBatch(workspaceId, id);
}

describe('importação: leitura e revisão', () => {
  it('lê o arquivo em linhas para revisão, sem criar lançamentos', async () => {
    const batch = await importOfx();
    expect(batch).toMatchObject({
      fileName: 'extrato.ofx',
      layout: 'ofx',
      status: 'review',
      account: { id: nubank, name: 'Nubank' },
      summary: { total: 3, included: 3, duplicates: 0, uncategorized: 3, incomeCents: 850_000, expenseCents: -16_640 },
    });
    expect(batch.rows.map((row) => [row.date, row.amountCents, row.include])).toEqual([
      ['2026-09-02', -4_590, true],
      ['2026-09-05', 850_000, true],
      ['2026-09-10', -12_050, true],
    ]);
    expect((await listTransactions(workspaceId, september)).total).toBe(0);
  });

  it('erro de leitura vira mensagem para a pessoa', async () => {
    await expect(
      createImportBatch(workspaceId, { accountId: nubank, fileName: 'x.csv', text: 'a;b\n1;2\n' }),
    ).rejects.toMatchObject({ code: 'parse', message: expect.stringContaining('Não reconhecemos as colunas') });
  });

  it('categoria da revisão precisa combinar com entrada ou saída', async () => {
    const batch = await importOfx();
    const [padariaRow, salarioRow] = batch.rows;
    await expect(updateImportRow(workspaceId, padariaRow?.id ?? '', { categoryId: salario })).rejects.toMatchObject({
      code: 'invalid-category',
    });
    await updateImportRow(workspaceId, salarioRow?.id ?? '', { categoryId: salario, description: 'Salário setembro' });
    const updated = await getImportBatch(workspaceId, batch.id);
    expect(updated.rows[1]).toMatchObject({ categoryId: salario, description: 'Salário setembro' });
    expect(updated.summary.uncategorized).toBe(2);
  });
});

describe('importação: confirmar', () => {
  it('cria os lançamentos incluídos com a categoria escolhida e atualiza o saldo', async () => {
    const batch = await importOfx();
    await updateImportRow(workspaceId, batch.rows[0]?.id ?? '', { categoryId: padaria });
    await updateImportRow(workspaceId, batch.rows[2]?.id ?? '', { include: false });

    await expect(commitImportBatch(workspaceId, batch.id)).resolves.toEqual({ created: 2, accountId: nubank });
    const page = await listTransactions(workspaceId, september);
    expect(page.items.map((item) => [item.description, item.amountCents, item.category?.name ?? null])).toEqual([
      ['Transferência recebida - EMPRESA LTDA', 850_000, null],
      ['Compra no débito - PADARIA SAO JOAO', -4_590, 'Padaria e café'],
    ]);
    expect((await listAccounts(workspaceId))[0]?.balanceCents).toBe(845_410);
    await expect(commitImportBatch(workspaceId, batch.id)).rejects.toMatchObject({ code: 'not-in-review' });
    await expect(updateImportRow(workspaceId, batch.rows[0]?.id ?? '', { include: false })).rejects.toMatchObject({
      code: 'not-in-review',
    });
  });

  it('importar o mesmo arquivo de novo marca tudo como duplicado e fora', async () => {
    await commitImportBatch(workspaceId, (await importOfx()).id);
    const again = await importOfx();
    expect(again.summary).toMatchObject({ total: 3, included: 0, duplicates: 3 });
    expect(again.rows.every((row) => row.duplicate === 'exact' && !row.include)).toBe(true);
  });

  it('lançamento manual parecido (mesmo valor, até 2 dias) vira possível duplicado', async () => {
    await createTransaction(workspaceId, {
      kind: 'expense',
      accountId: nubank,
      amountCents: 4_590,
      date: '2026-09-03',
      description: 'Padaria',
      categoryId: null,
      status: 'cleared',
      notes: null,
    });
    const batch = await importOfx();
    expect(batch.rows[0]).toMatchObject({ duplicate: 'possible', include: false });
    expect(batch.rows[1]).toMatchObject({ duplicate: null, include: true });
  });

  it('"lembrar" cria regra que categoriza a próxima importação', async () => {
    const batch = await importOfx();
    await updateImportRow(workspaceId, batch.rows[0]?.id ?? '', { categoryId: padaria, rememberCategory: true });
    await commitImportBatch(workspaceId, batch.id);

    const text = ofx.replaceAll('2026090', '2026100').replaceAll('20261010', '20261015').replaceAll('6512a', '7612a');
    const { id } = await createImportBatch(workspaceId, { accountId: nubank, fileName: 'outubro.ofx', text });
    const next = await getImportBatch(workspaceId, id);
    expect(next.rows[0]).toMatchObject({ categoryId: padaria, suggestedByRule: true, include: true });
    expect(next.rows[1]).toMatchObject({ categoryId: null, suggestedByRule: false });
  });

  it('extrato de cartão entra nas faturas', async () => {
    const { id: card } = await createAccount(workspaceId, {
      name: 'Cartão',
      type: 'credit_card',
      institutionId: null,
      initialBalanceCents: 0,
      initialBalanceDate: '2026-01-01',
      closingDay: 20,
      dueDay: 28,
    });
    const csv = readFileSync(path.resolve('lib/import/__fixtures__/nubank-cartao.csv'), 'utf8');
    const { id } = await createImportBatch(workspaceId, { accountId: card, fileName: 'fatura.csv', text: csv });
    await commitImportBatch(workspaceId, id);
    const invoices = await listCardInvoices(workspaceId, card, { today: '2026-09-16' });
    expect(invoices.map((invoice) => [invoice.referenceMonth, invoice.totalCents])).toEqual([
      ['2026-10', -10_535],
      ['2026-09', -8_990],
    ]);
  });

  it('descartar encerra sem criar nada; histórico lista as importações', async () => {
    const batch = await importOfx();
    await discardImportBatch(workspaceId, batch.id);
    expect((await listTransactions(workspaceId, september)).total).toBe(0);
    expect(await listImportBatches(workspaceId)).toEqual([
      expect.objectContaining({ id: batch.id, status: 'discarded', rowCount: 3, accountName: 'Nubank' }),
    ]);
  });
});

describe('importação: papéis e isolamento', () => {
  it('leitor vê o histórico, mas não importa nem confirma', async () => {
    const batch = await importOfx();
    const { token } = await createInvitation(workspaceId, { email: 'ana@exemplo.com', role: 'viewer' });
    await createUser('ana@exemplo.com', { signIn: true });
    await acceptInvitation(token);

    await expect(listImportBatches(workspaceId)).resolves.toHaveLength(1);
    await expect(createImportBatch(workspaceId, { accountId: nubank, fileName: 'x.ofx', text: ofx })).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    await expect(commitImportBatch(workspaceId, batch.id)).rejects.toBeInstanceOf(ForbiddenError);
    await expect(updateImportRow(workspaceId, batch.rows[0]?.id ?? '', { include: false })).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });

  it('não importa para conta nem lê importação de outro espaço', async () => {
    const batch = await importOfx();
    const { id: other } = await createWorkspace({ name: 'Empresa' });
    await expect(createImportBatch(other, { accountId: nubank, fileName: 'x.ofx', text: ofx })).rejects.toMatchObject({
      code: 'invalid-account',
    });
    await expect(getImportBatch(other, batch.id)).rejects.toMatchObject({ code: 'not-found' });
    await expect(updateImportRow(other, batch.rows[0]?.id ?? '', { include: false })).rejects.toMatchObject({
      code: 'not-found',
    });
    signInAs(null);
    await expect(getImportBatch(workspaceId, batch.id)).rejects.toThrow();
  });
});
