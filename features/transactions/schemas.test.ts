import { describe, expect, it } from 'vitest';
import { parseTransactionForm, recurringFromTransaction } from './schemas';

const A = '11111111-1111-4111-8111-111111111111';
const B = '22222222-2222-4222-8222-222222222222';

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) {
    data.set(key, value);
  }
  return data;
}

describe('parseTransactionForm', () => {
  it('despesa com categoria e status padrão', () => {
    expect(
      parseTransactionForm(
        form({ kind: 'expense', amountCents: '4590', date: '2026-09-10', description: ' Padaria ', accountId: A, categoryId: B, notes: '' }),
      ),
    ).toEqual({
      success: true,
      data: {
        kind: 'expense',
        amountCents: 4590,
        date: '2026-09-10',
        description: 'Padaria',
        status: 'cleared',
        paymentMethod: null,
        paidAt: null,
        notes: null,
        accountId: A,
        categoryId: B,
        installments: 1,
      },
    });
  });

  it('forma de pagamento e dia do pagamento', () => {
    const base = { kind: 'expense', amountCents: '4590', date: '2026-09-10', description: 'Padaria', accountId: A };
    expect(parseTransactionForm(form({ ...base, paymentMethod: 'pix', paidAt: '2026-09-12' }))).toMatchObject({
      success: true,
      data: { paymentMethod: 'pix', paidAt: '2026-09-12' },
    });
    expect(parseTransactionForm(form({ ...base, paymentMethod: 'cheque', paidAt: '12/09' }))).toMatchObject({
      status: 'error',
      fieldErrors: { paymentMethod: 'Forma de pagamento inválida.', paidAt: 'Data de pagamento inválida.' },
    });
  });

  it('transferência sem categoria, entre contas diferentes', () => {
    const ok = parseTransactionForm(
      form({ kind: 'transfer', amountCents: '100000', date: '2026-09-10', description: 'Reserva', accountId: A, toAccountId: B, status: 'planned' }),
    );
    expect(ok).toMatchObject({ success: true, data: { kind: 'transfer', toAccountId: B, status: 'planned' } });

    const same = parseTransactionForm(
      form({ kind: 'transfer', amountCents: '100', date: '2026-09-10', description: 'X', accountId: A, toAccountId: A }),
    );
    expect(same).toMatchObject({
      status: 'error',
      fieldErrors: { toAccountId: 'Escolha uma conta diferente da de origem.' },
    });
  });

  it('erros por campo com valores digitados', () => {
    const result = parseTransactionForm(form({ kind: 'income', amountCents: '0', date: '', description: '', accountId: '' }));
    expect(result).toMatchObject({
      status: 'error',
      fieldErrors: {
        amountCents: 'Informe um valor maior que zero.',
        date: 'Informe a data.',
        description: 'Descreva o lançamento.',
        accountId: 'Escolha a conta.',
      },
      values: { kind: 'income', amountCents: 0 },
    });
  });

  it('tipo ausente ou inválido', () => {
    expect(parseTransactionForm(form({ kind: 'x' }))).toMatchObject({
      status: 'error',
      fieldErrors: { kind: 'Escolha o tipo do lançamento.' },
    });
  });
});

describe('recurringFromTransaction', () => {
  const expense = {
    kind: 'expense',
    amountCents: 130_000,
    date: '2026-10-05',
    description: 'Aluguel',
    status: 'planned',
    paymentMethod: null,
    paidAt: null,
    notes: null,
    accountId: '0000000a-0000-4000-8000-000000000001',
    categoryId: '0000000b-0000-4000-8000-000000000001',
    installments: 1,
  } as const;

  it('a data do lançamento vira a primeira ocorrência', () => {
    expect(recurringFromTransaction(expense, 'monthly')).toEqual({
      success: true,
      data: {
        kind: 'expense',
        description: 'Aluguel',
        amountCents: 130_000,
        accountId: expense.accountId,
        categoryId: expense.categoryId,
        frequency: 'monthly',
        startDate: '2026-10-05',
        endDate: null,
      },
    });
  });

  it('sem frequência válida, aponta o campo', () => {
    expect(recurringFromTransaction(expense, '')).toEqual({
      success: false,
      field: 'frequency',
      message: 'Escolha a frequência.',
    });
  });

  it('transferência não vira regra', () => {
    const transfer = {
      kind: 'transfer',
      amountCents: 100_000,
      date: '2026-10-05',
      description: 'Reserva',
      status: 'cleared',
      paymentMethod: null,
      paidAt: null,
      notes: null,
      accountId: expense.accountId,
      toAccountId: '0000000a-0000-4000-8000-000000000002',
    } as const;
    expect(recurringFromTransaction(transfer, 'monthly')).toMatchObject({
      success: false,
      field: 'repeat',
    });
  });
});
