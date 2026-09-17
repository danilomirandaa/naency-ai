import { describe, expect, it } from 'vitest';
import { parseTransactionForm } from './schemas';

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
        notes: null,
        accountId: A,
        categoryId: B,
        installments: 1,
      },
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
