import type { ImportBatchSummary } from '@/features/imports/types';
import { describe, expect, it } from 'vitest';
import { finishedBatches, jobNotice } from './jobs';

function batch(overrides: Partial<ImportBatchSummary> = {}): ImportBatchSummary {
  return {
    id: 'lote-1',
    fileName: 'Fatura2026-10-05.csv',
    status: 'review',
    job: null,
    jobError: null,
    accountName: 'XP Black',
    rowCount: 68,
    createdAt: '2026-09-18T12:00:00.000Z',
    ...overrides,
  };
}

describe('finishedBatches', () => {
  it('pega quem estava processando e parou', () => {
    const antes = [batch({ job: 'commit' }), batch({ id: 'lote-2', job: null })];
    const depois = [batch({ status: 'committed' }), batch({ id: 'lote-2', job: null })];
    expect(finishedBatches(antes, depois).map((item) => item.id)).toEqual(['lote-1']);
  });

  it('ignora quem continua processando e quem nunca começou', () => {
    expect(finishedBatches([batch({ job: 'suggest' })], [batch({ job: 'suggest' })])).toEqual([]);
    expect(finishedBatches([batch()], [batch()])).toEqual([]);
  });
});

describe('jobNotice', () => {
  it('importou: diz quantas linhas e em qual conta', () => {
    expect(jobNotice(batch({ status: 'committed' }))).toMatchObject({
      title: 'Importação concluída',
      description: '68 linhas de Fatura2026-10-05.csv em XP Black.',
      variant: 'success',
    });
    expect(jobNotice(batch({ status: 'committed', rowCount: 1 })).description).toContain('1 linha ');
  });

  it('sugestões prontas ficam na revisão', () => {
    expect(jobNotice(batch())).toMatchObject({ title: 'Sugestões prontas', variant: 'success' });
  });

  it('erro aparece com o motivo', () => {
    expect(jobNotice(batch({ jobError: 'A AI não respondeu agora.' }))).toMatchObject({
      title: 'A importação não terminou',
      description: 'Fatura2026-10-05.csv: A AI não respondeu agora.',
      variant: 'critical',
    });
  });
});
