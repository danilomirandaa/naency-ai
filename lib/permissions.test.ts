import { describe, expect, it } from 'vitest';
import {
  WORKSPACE_ACTIONS,
  type WorkspaceAction,
  type WorkspaceRole,
  can,
  isWorkspaceRole,
} from './permissions';

// Espelha a tabela de papéis de docs/domain.md. Mudar permissão exige mudar os dois.
const expected: Record<WorkspaceRole, Record<WorkspaceAction, boolean>> = {
  admin: {
    'workspace.read': true,
    'finance.write': true,
    'import.run': true,
    'members.manage': true,
    'workspace.manage': true,
  },
  editor: {
    'workspace.read': true,
    'finance.write': true,
    'import.run': true,
    'members.manage': false,
    'workspace.manage': false,
  },
  viewer: {
    'workspace.read': true,
    'finance.write': false,
    'import.run': false,
    'members.manage': false,
    'workspace.manage': false,
  },
};

describe('can', () => {
  for (const [role, actions] of Object.entries(expected) as [
    WorkspaceRole,
    Record<WorkspaceAction, boolean>,
  ][]) {
    for (const action of WORKSPACE_ACTIONS) {
      it(`${role} ${actions[action] ? 'pode' : 'não pode'} ${action}`, () => {
        expect(can(role, action)).toBe(actions[action]);
      });
    }
  }

  it('quem não é membro não pode nada', () => {
    for (const action of WORKSPACE_ACTIONS) {
      expect(can(null, action)).toBe(false);
      expect(can(undefined, action)).toBe(false);
    }
  });
});

describe('isWorkspaceRole', () => {
  it.each(['admin', 'editor', 'viewer'])('aceita %s', (role) => {
    expect(isWorkspaceRole(role)).toBe(true);
  });

  it.each(['owner', 'Admin', '', null, 1])('rejeita %s', (value) => {
    expect(isWorkspaceRole(value)).toBe(false);
  });
});
