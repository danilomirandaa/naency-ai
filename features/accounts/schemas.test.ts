import { describe, expect, it } from 'vitest';
import { accountInputSchema, parseAccountForm } from './schemas';

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) {
    data.set(key, value);
  }
  return data;
}

const valid = {
  name: '  Nubank  ',
  type: 'checking',
  institutionId: '',
  initialBalanceCents: '150075',
  initialBalanceDate: '2026-09-01',
};

describe('parseAccountForm', () => {
  it('normaliza nome, instituição vazia e centavos', () => {
    expect(parseAccountForm(form(valid))).toEqual({
      success: true,
      data: {
        name: 'Nubank',
        type: 'checking',
        institutionId: null,
        initialBalanceCents: 150075,
        initialBalanceDate: '2026-09-01',
        closingDay: null,
        dueDay: null,
        limitCents: null,
        defaultPaymentAccountId: null,
      },
    });
  });

  it('cartão exige dias de fechamento e vencimento', () => {
    expect(parseAccountForm(form({ ...valid, type: 'credit_card' }))).toMatchObject({
      status: 'error',
      fieldErrors: {
        closingDay: 'Informe o dia de fechamento (1 a 31).',
        dueDay: 'Informe o dia de vencimento (1 a 31).',
      },
    });
    expect(
      parseAccountForm(form({ ...valid, type: 'credit_card', closingDay: '25', dueDay: '5', limitCents: '500000' })),
    ).toMatchObject({ success: true, data: { closingDay: 25, dueDay: 5, limitCents: 500000 } });
  });

  it('saldo vazio vira zero e aceita negativo (conta no cheque especial)', () => {
    const empty = parseAccountForm(form({ ...valid, initialBalanceCents: '' }));
    const negative = parseAccountForm(form({ ...valid, initialBalanceCents: '-5000' }));
    expect(empty).toMatchObject({ success: true, data: { initialBalanceCents: 0 } });
    expect(negative).toMatchObject({ success: true, data: { initialBalanceCents: -5000 } });
  });

  it('devolve erro por campo e os valores digitados', () => {
    const result = parseAccountForm(
      form({
        name: ' ',
        type: 'emprestimo',
        institutionId: 'nao-e-uuid',
        initialBalanceCents: '12.5',
        initialBalanceDate: '2026-02-30',
      }),
    );
    expect(result).toEqual({
      status: 'error',
      message: 'Revise os campos destacados.',
      fieldErrors: {
        name: 'Dê um nome à conta.',
        type: 'Escolha o tipo da conta.',
        institutionId: 'Instituição inválida.',
        initialBalanceCents: 'Saldo inválido.',
        initialBalanceDate: 'Informe a data do saldo.',
      },
      values: {
        name: ' ',
        type: '',
        institutionId: 'nao-e-uuid',
        initialBalanceCents: 12.5,
        initialBalanceDate: '2026-02-30',
        closingDay: '',
        dueDay: '',
        limitCents: null,
        defaultPaymentAccountId: '',
      },
    });
  });

  it('campos ausentes contam como inválidos', () => {
    const result = parseAccountForm(new FormData());
    expect(result).toMatchObject({
      status: 'error',
      fieldErrors: { name: 'Dê um nome à conta.', initialBalanceDate: 'Informe a data do saldo.' },
      values: { name: '', type: '', initialBalanceCents: null },
    });
  });
});

describe('accountInputSchema', () => {
  it('recusa saldo absurdo', () => {
    const result = accountInputSchema.safeParse({
      ...valid,
      initialBalanceCents: 10_000_000_000_001,
    });
    expect(result.success).toBe(false);
  });
});
