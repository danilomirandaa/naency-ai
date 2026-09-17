import { describe, expect, it } from 'vitest';
import { makeQueryClient } from './query-client';

describe('makeQueryClient', () => {
  it('aplica os defaults do app', () => {
    const queries = makeQueryClient().getDefaultOptions().queries;
    expect(queries).toMatchObject({ staleTime: 30_000, refetchOnWindowFocus: true });
  });

  it('cria um cliente novo a cada chamada', () => {
    expect(makeQueryClient()).not.toBe(makeQueryClient());
  });
});
