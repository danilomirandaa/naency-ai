import { describe, expect, it } from 'vitest';
import { type WorkspaceSummary, resolveActiveWorkspace } from './active';

const casa: WorkspaceSummary = { id: 'a', name: 'Finanças da casa', role: 'admin' };
const praia: WorkspaceSummary = { id: 'b', name: 'Casa da praia', role: 'viewer' };

describe('resolveActiveWorkspace', () => {
  it('usa o espaço do cookie quando a pessoa é membro', () => {
    expect(resolveActiveWorkspace([casa, praia], 'b')).toBe(praia);
  });

  it('cookie de espaço em que a pessoa não está mais cai no primeiro', () => {
    expect(resolveActiveWorkspace([casa, praia], 'removido')).toBe(casa);
  });

  it('sem cookie usa o primeiro', () => {
    expect(resolveActiveWorkspace([casa, praia], undefined)).toBe(casa);
  });

  it('sem espaços retorna null', () => {
    expect(resolveActiveWorkspace([], 'a')).toBeNull();
  });
});
