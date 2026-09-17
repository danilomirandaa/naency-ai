import { describe, expect, it } from 'vitest';
import { createWorkspaceSchema } from './schemas';

const message = (name: unknown) =>
  createWorkspaceSchema.safeParse({ name }).error?.issues[0]?.message;

describe('createWorkspaceSchema', () => {
  it('aceita e apara o nome', () => {
    expect(createWorkspaceSchema.parse({ name: '  Finanças da casa ' }).name).toBe(
      'Finanças da casa',
    );
  });

  it('exige nome', () => {
    expect(message(undefined)).toBe('Dê um nome ao espaço.');
  });

  it('rejeita nome curto (inclusive só espaços)', () => {
    expect(message('a')).toBe('Use pelo menos 2 caracteres.');
    expect(message('    ')).toBe('Use pelo menos 2 caracteres.');
  });

  it('rejeita nome longo', () => {
    expect(message('x'.repeat(61))).toBe('Use no máximo 60 caracteres.');
  });
});
