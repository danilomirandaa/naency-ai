import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { detectCsvLayout, parseCsvRecords, parseStatementDate } from './csv';
import { decodeStatement } from './decode';
import { parseStatement } from './parse';
import { StatementParseError } from './types';

function fixture(name: string) {
  return decodeStatement(readFileSync(path.join(__dirname, '__fixtures__', name)));
}

describe('fatura de cartão', () => {
  it('compra positiva no CSV vira saída; pagamento e estorno viram entrada', () => {
    const { layout, rows } = parseStatement('Fatura2026-10-05.csv', fixture('cartao-generico.csv'), {
      accountType: 'credit_card',
    });
    expect(layout).toBe('generico');
    expect(rows.map((row) => [row.description, row.amountCents])).toEqual([
      ['PADOCA REAL.', -2592],
      ['SMILETECH TECNOLOGIA O', -68333],
      ['DISNEY PLUS', -2990],
      ['Pagamento de fatura', 120000],
      ['ESTORNO LOJA', 1000],
    ]);
  });

  it('lê a coluna Parcela e marca só o pagamento da fatura', () => {
    const { rows } = parseStatement('Fatura2026-10-05.csv', fixture('cartao-generico.csv'), {
      accountType: 'credit_card',
    });
    expect(rows.map((row) => [row.description, row.installment, row.invoicePayment])).toEqual([
      ['PADOCA REAL.', null, false],
      // Parcela mantém a data da compra original: por isso a fatura manda na hora de importar.
      ['SMILETECH TECNOLOGIA O', { number: 3, total: 12 }, false],
      ['DISNEY PLUS', null, false],
      ['Pagamento de fatura', null, true],
      // Estorno é crédito, mas não é pagamento de fatura.
      ['ESTORNO LOJA', null, false],
    ]);
  });

  it('em conta comum, crédito com "pagamento de fatura" na descrição não é marcado', () => {
    const { rows } = parseStatement('extrato.csv', fixture('cartao-generico.csv'), { accountType: 'checking' });
    expect(rows.every((row) => !row.invoicePayment)).toBe(true);
  });

  it('não inverte o que já vem com compra negativa (OFX, Nubank cartão) nem conta corrente', () => {
    const ofx = parseStatement('fatura.ofx', fixture('cartao-xml.ofx'), { accountType: 'credit_card' });
    expect(ofx.rows.map((row) => row.amountCents)).toEqual([-8990, 1500]);
    const nubank = parseStatement('fatura.csv', fixture('nubank-cartao.csv'), { accountType: 'credit_card' });
    expect(nubank.rows).toEqual(parseStatement('fatura.csv', fixture('nubank-cartao.csv')).rows);
    const checking = parseStatement('conta.csv', fixture('cartao-generico.csv'), { accountType: 'checking' });
    expect(checking.rows[0]?.amountCents).toBe(2592);
  });
});

describe('OFX', () => {
  it('lê OFX 1.x (SGML, tags sem fechar) com valores em ponto e vírgula', () => {
    expect(parseStatement('extrato.ofx', fixture('conta-sgml.ofx'))).toEqual({
      format: 'ofx',
      layout: 'ofx',
      rows: [
        { date: '2026-09-02', amountCents: -4590, description: 'Compra no débito - PADARIA SAO JOAO', externalId: '6512a1', installment: null, invoicePayment: false },
        { date: '2026-09-05', amountCents: 850000, description: 'Transferência recebida - EMPRESA LTDA', externalId: '6512a2', installment: null, invoicePayment: false },
        { date: '2026-09-10', amountCents: -12050, description: 'Pix enviado - Maria', externalId: '6512a3', installment: null, invoicePayment: false },
      ],
    });
  });

  it('lê OFX 2.x (XML) de cartão, mesmo com extensão errada', () => {
    const { rows } = parseStatement('fatura.txt', fixture('cartao-xml.ofx'));
    expect(rows.map((row) => [row.date, row.amountCents, row.description])).toEqual([
      ['2026-09-20', -8990, 'Netflix.com'],
      ['2026-09-21', 1500, 'Estorno Uber'],
    ]);
  });

  it('recusa OFX sem lançamentos ou com valor inválido', () => {
    expect(() => parseStatement('a.ofx', '<OFX></OFX>')).toThrow(StatementParseError);
    expect(() =>
      parseStatement('a.ofx', '<OFX><STMTTRN><DTPOSTED>20260901<TRNAMT>abc</STMTTRN></OFX>'),
    ).toThrow(/Lançamento 1/);
  });
});

describe('CSV', () => {
  it('Nubank conta: aspas, vírgula no texto e acentos', () => {
    const { layout, rows } = parseStatement('nubank.csv', fixture('nubank-conta.csv'));
    expect(layout).toBe('nubank-conta');
    expect(rows).toEqual([
      { date: '2026-09-02', amountCents: -4590, description: 'Compra no débito - Padaria São João', externalId: null, installment: null, invoicePayment: false },
      { date: '2026-09-05', amountCents: 850000, description: 'Transferência recebida - EMPRESA, LTDA', externalId: null, installment: null, invoicePayment: false },
    ]);
  });

  it('Nubank cartão: compra positiva vira saída e estorno vira entrada', () => {
    const { layout, rows } = parseStatement('fatura.csv', fixture('nubank-cartao.csv'));
    expect(layout).toBe('nubank-cartao');
    expect(rows.map((row) => row.amountCents)).toEqual([-8990, 1500, -12035]);
  });

  it('genérico com débito e crédito, separador ; e ano com 2 dígitos', () => {
    const { layout, rows } = parseStatement('banco.csv', fixture('generico-debito-credito.csv'));
    expect(layout).toBe('generico');
    expect(rows.map((row) => [row.date, row.amountCents, row.description])).toEqual([
      ['2026-09-02', -2990, 'TARIFA PACOTE'],
      ['2026-09-05', 850000, 'SALARIO'],
    ]);
  });

  it('colunas desconhecidas pedem outro formato', () => {
    expect(() => parseStatement('x.csv', fixture('desconhecido.csv'))).toThrow(
      expect.objectContaining({ code: 'unknown-layout' }),
    );
  });

  it('linha inválida indica o número da linha', () => {
    expect(() => parseStatement('x.csv', 'Data,Valor,Identificador,Descrição\n31/02/2026,10,a,b\n')).toThrow(/Linha 2/);
  });

  it('parser de registros lida com aspas escapadas e quebra de linha no campo', () => {
    expect(parseCsvRecords('a,b\n"x ""y""","linha1\nlinha2"\n')).toEqual([
      ['a', 'b'],
      ['x "y"', 'linha1\nlinha2'],
    ]);
  });

  it('datas aceitas', () => {
    expect(parseStatementDate('16/09/2026')).toBe('2026-09-16');
    expect(parseStatementDate('16/09/26')).toBe('2026-09-16');
    expect(parseStatementDate('2026-09-16T10:00:00')).toBe('2026-09-16');
    expect(parseStatementDate('31/02/2026')).toBeNull();
  });

  it('layout genérico precisa de data e descrição', () => {
    expect(detectCsvLayout(['Valor', 'Descrição'])).toBeNull();
    expect(detectCsvLayout(['Data', 'Descrição'])).toBeNull();
  });
});

describe('formatos', () => {
  it('vazio, PDF e desconhecido', () => {
    expect(() => parseStatement('a.csv', '  ')).toThrow(expect.objectContaining({ code: 'empty' }));
    expect(() => parseStatement('a.pdf', '%PDF-1.4')).toThrow(/PDF ainda não é suportado/);
    expect(() => parseStatement('a.xlsx', 'xx')).toThrow(expect.objectContaining({ code: 'unknown-format' }));
  });

  it('decodifica Windows-1252 quando não é UTF-8', () => {
    const latin1 = Uint8Array.from([0x44, 0x65, 0x73, 0x63, 0x72, 0x69, 0xe7, 0xe3, 0x6f]);
    expect(decodeStatement(latin1)).toBe('Descrição');
    expect(decodeStatement(new TextEncoder().encode('﻿São'))).toBe('São');
  });
});
